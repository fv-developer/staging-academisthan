import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool from '../config/database';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticate,
  generateResetToken,
  AuthRequest,
} from '../utils/auth';
import { sendVerificationEmail, sendVerificationSuccessEmail, sendPasswordChangedEmail, sendAdminNewFellowEmail, sendWelcomeEmail } from '../services/email';
import { frontendUrl } from '../config/email';
import { logUserActivity } from '../utils/logger';

const router = express.Router();

// Sign up
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, country, phone } = req.body;

    if (!email || !password || !fullName || !country || !phone) {
      return res.status(400).json({ error: 'Email, password, full name, country, and phone number are required' });
    }

    // Check if user exists
    const [existing]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user with email_verified = FALSE
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, full_name, email_verified, verification_token, verification_token_expires)
       VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
      [userId, email, passwordHash, fullName, verificationToken, tokenExpires]
    );

    // Create profile with pending fellowship status
    await pool.execute(
      `INSERT INTO profiles (id, email, full_name, membership_status, status, email_verified, country, phone)
       VALUES (?, ?, ?, 'pending', 'inactive', FALSE, ?, ?)`,
      [userId, email, fullName, country, phone]
    );

    // Log registration activity
    await logUserActivity(userId, 'register', 'Account registered successfully (Pending Email Verification)');

    // Notify admins about new user registration
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id, p.email, p.full_name FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );
      for (const adminUser of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, trigger_user_id, type, title, message, link)
           VALUES (?, ?, ?, 'general', 'New User Registration 👤', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, userId, `${fullName} has registered a new account.`]
        );
        if (adminUser.email) {
          sendAdminNewFellowEmail(adminUser.email, adminUser.full_name || 'Admin', fullName).catch(err => {
            console.error('Failed to send admin signup notification email:', err);
          });
        }
      }
    } catch (err) {
      console.error('Failed to notify admins on registration:', err);
    }

    // Send verification email
    try {
      const verificationLink = `${frontendUrl}/verify-email/${verificationToken}`;
      console.log(`\n\n---------------------------------------\n🔗 DEV MODE VERIFICATION LINK:\n${verificationLink}\n---------------------------------------\n\n`);
      await sendVerificationEmail(email, fullName, verificationLink);
    } catch (err) {
      console.error('Failed to send verification email on signup:', err);
    }

    res.status(201).json({
      user: { id: userId, email, full_name: fullName, email_verified: false },
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const [users]: any = await pool.execute(
      'SELECT id, email, password_hash, full_name, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email address to activate your account.' });
    }

    // Update last sign in
    await pool.execute(
      'UPDATE users SET last_sign_in_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Log sign-in activity
    await logUserActivity(user.id, 'login', 'User logged in successfully');

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        email_verified: true,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [users]: any = await pool.execute(
      'SELECT id, email, full_name, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Forgot password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'Password reset email sent if account exists' });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [resetToken, expiresAt, email]
    );

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'Password reset email sent if account exists' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Find user by reset token
    const [users]: any = await pool.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Sign out (client-side token removal)
router.post('/signout', (req: Request, res: Response) => {
  res.json({ message: 'Signed out successfully' });
});

// Verify email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user by verification token
    const [users]: any = await pool.execute(
      'SELECT id, email, full_name, verification_token_expires FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = users[0];

    // Check if token expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Update user as verified
    await pool.execute(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL 
       WHERE id = ?`,
      [user.id]
    );

    // Update user profile as active and email verified
    await pool.execute(
      `UPDATE profiles 
       SET membership_status = 'active', 
           status = 'active', 
           email_verified = TRUE,
           verified_at = NOW() 
       WHERE id = ?`,
      [user.id]
    );

    // Log user activation activity
    await logUserActivity(user.id, 'activate', 'Account activated and verified successfully');

    // Notify admins about fellowship approval
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );
      for (const adminUser of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'general', 'New Fellowship Approved 🏆', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, `${user.full_name}'s Fellowship has been approved after email verification.`]
        );
      }
    } catch (err) {
      console.error('Failed to notify admins on verification:', err);
    }

    // Send success and welcome email
    await sendVerificationSuccessEmail(user.email, user.full_name);
    await sendWelcomeEmail(user.email, user.full_name);

    res.json({ 
      message: 'Email verified successfully! You can now sign in.',
      email_verified: true 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user
    const [users]: any = await pool.execute(
      'SELECT id, email, full_name, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a verification link has been sent.' });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update token
    await pool.execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, tokenExpires, user.id]
    );

    // Send verification email
    const verificationLink = `${frontendUrl}/verify-email/${verificationToken}`;
    console.log(`\n\n---------------------------------------\n🔗 DEV MODE VERIFICATION LINK:\n${verificationLink}\n---------------------------------------\n\n`);
    await sendVerificationEmail(user.email, user.full_name, verificationLink);

    res.json({ message: 'Verification email sent! Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Get user
    const [users]: any = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify old password
    const valid = await verifyPassword(oldPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect old password' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    // Send confirmation email
    try {
      const [uRows]: any = await pool.execute('SELECT email, full_name FROM users WHERE id = ?', [userId]);
      if (uRows.length > 0) {
        const { email, full_name } = uRows[0];
        await sendPasswordChangedEmail(email, full_name);
      }
    } catch (emailErr) {
      console.error('Failed to send password change email:', emailErr);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
