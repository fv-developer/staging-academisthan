import { createTransporter, emailFrom, frontendUrl } from '../config/email';
import { verificationEmailTemplate, verificationSuccessEmailTemplate } from '../templates/verificationEmail';
import { v4 as uuidv4 } from 'uuid';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const domain = emailFrom.address.split('@')[1] || 'academisthan.org';
    const messageId = `<${uuidv4()}@${domain}>`;
    
    await transporter.sendMail({
      from: `${emailFrom.name} <${emailFrom.address}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      messageId,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': uuidv4(),
      }
    });
    
    console.log(`✅ Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  verificationLink: string
): Promise<boolean> => {
  const html = verificationEmailTemplate(name, verificationLink);
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Academisthan',
    html,
    text: `Welcome to Academisthan, ${name}! Please verify your email by visiting: ${verificationLink}`,
  });
};

export const sendVerificationSuccessEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  const html = verificationSuccessEmailTemplate(name);
  
  return sendEmail({
    to: email,
    subject: 'Email Verified - Welcome to Academisthan!',
    html,
    text: `Welcome ${name}! Your email has been verified successfully.`,
  });
};

// Helper to wrap email content in a premium HTML template
const getEmailWrapper = (title: string, contentHtml: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Academisthan</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, hsl(228, 45%, 16%) 0%, hsl(228, 45%, 20%) 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: hsl(38, 55%, 58%); font-size: 28px; font-family: 'Playfair Display', serif;">
                Academisthan
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                Of the Teachers · By the Teachers · For the Teachers
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${contentHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 15px; color: #888; font-size: 13px; line-height: 1.6; text-align: center;">
                Need help? Contact us at <a href="mailto:support@academisthan.org" style="color: hsl(38, 55%, 58%); text-decoration: none;">support@academisthan.org</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
              
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                © 2026 Academisthan. All rights reserved.<br>
                Empowering India's Educators
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendInstitutionStatusEmail = async (
  email: string,
  name: string,
  institutionName: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<boolean> => {
  const isApproved = status === 'approved';
  const subject = isApproved 
    ? `Institution Approved - ${institutionName}` 
    : `Institution Registration - Update Required`;
  
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">
      Institution Registration Update
    </h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Your institution registration for <strong>${institutionName}</strong> has been ${status}.
    </p>
    ${isApproved ? `
      <div style="padding: 20px; background-color: #e6f4ea; border-left: 4px solid #137333; border-radius: 4px; margin: 0 0 25px;">
        <p style="margin: 0; color: #137333; font-size: 15px; line-height: 1.6; font-weight: bold;">
          Congratulations! Your institution profile is now live on Academisthan.
        </p>
      </div>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td align="center">
            <a href="${frontendUrl}/dashboard/institutions" style="display: inline-block; padding: 14px 35px; background-color: hsl(38, 55%, 58%); color: hsl(228, 45%, 16%); text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              View Your Institutions
            </a>
          </td>
        </tr>
      </table>
    ` : `
      <div style="padding: 20px; background-color: #fce8e6; border-left: 4px solid #c5221f; border-radius: 4px; margin: 0 0 25px;">
        <p style="margin: 0 0 10px; color: #c5221f; font-size: 15px; line-height: 1.6; font-weight: bold;">
          Action Required: Registration Rejected
        </p>
        <p style="margin: 0; color: #c5221f; font-size: 14px; line-height: 1.6;">
          <strong>Reason:</strong> ${reason || 'Please review and resubmit with correct information.'}
        </p>
      </div>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td align="center">
            <a href="${frontendUrl}/dashboard/institutions" style="display: inline-block; padding: 14px 35px; background-color: #c5221f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Edit and Resubmit
            </a>
          </td>
        </tr>
      </table>
    `}
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

export const sendInstitutionSuspendedEmail = async (
  email: string,
  name: string,
  institutionName: string,
  reason: string
): Promise<boolean> => {
  const subject = `Institution Suspended - ${institutionName}`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">
      Institution Suspension Notice
    </h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      We regret to inform you that your institution, <strong>${institutionName}</strong>, has been suspended.
    </p>
    <div style="padding: 20px; background-color: #fef7e0; border-left: 4px solid #b06000; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #b06000; font-size: 14px; line-height: 1.6;">
        <strong>Reason for suspension:</strong> ${reason}
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      If you believe this suspension is in error or wish to appeal, please contact the administrative support team.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

export const sendChangeRequestStatusEmail = async (
  email: string,
  name: string,
  institutionName: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<boolean> => {
  const isApproved = status === 'approved';
  const subject = isApproved 
    ? `Change Request Approved - ${institutionName}` 
    : `Change Request Rejected - ${institutionName}`;
  
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">
      Institution Change Request Update
    </h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Your request to edit the profile fields for <strong>${institutionName}</strong> has been ${status}.
    </p>
    ${notes ? `
      <div style="padding: 20px; background-color: #f1f3f4; border-left: 4px solid #5f6368; border-radius: 4px; margin: 0 0 25px;">
        <p style="margin: 0; color: #3c4043; font-size: 14px; line-height: 1.6;">
          <strong>Admin Notes:</strong> ${notes}
        </p>
      </div>
    ` : ''}
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

export const sendPasswordChangedEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  const subject = 'Security Alert: Password Changed';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">
      Password Changed Successfully
    </h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      This email confirms that the password for your Academisthan account was recently updated. 
    </p>
    <div style="padding: 20px; background-color: #fef7e0; border-left: 4px solid #b06000; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #b06000; font-size: 14px; line-height: 1.6;">
        If you performed this change, no action is required. If you did not authorize this, please reset your password immediately or contact our administrator.
      </p>
    </div>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 1. sendFellowApprovedEmail
export const sendFellowApprovedEmail = async (email: string, name: string): Promise<boolean> => {
  const subject = 'Fellowship Approved - Academisthan';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Fellowship Approved!</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Congratulations! Your Academisthan Fellowship application has been reviewed and approved by the administration.
    </p>
    <div style="padding: 20px; background-color: #e6f4ea; border-left: 4px solid #137333; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #137333; font-size: 15px; line-height: 1.6; font-weight: bold;">
        Your account is now fully active. You have full access to our LMS workspace, courses, and digital tools!
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please visit your dashboard to explore all available features.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 2. sendFellowRejectedEmail
export const sendFellowRejectedEmail = async (email: string, name: string, reason: string): Promise<boolean> => {
  const subject = 'Fellowship Application Update - Revisions Required';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Fellowship Application Status</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Thank you for submitting your fellowship details. Upon administrative review, we require some modifications to your profile details before approval.
    </p>
    <div style="padding: 20px; background-color: #fce8e6; border-left: 4px solid #c5221f; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0 0 5px; color: #c5221f; font-size: 15px; line-height: 1.6; font-weight: bold;">Rejection Reason:</p>
      <p style="margin: 0; color: #c5221f; font-size: 14px; line-height: 1.6;">${reason}</p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please log in to your Fellow Dashboard, edit your profile details, and click "Save & Resubmit" to submit your application for review again.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 3. sendFellowSuspendedEmail
export const sendFellowSuspendedEmail = async (email: string, name: string, reason: string): Promise<boolean> => {
  const subject = 'Fellowship Account Suspended';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Account Suspension Notice</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      We regret to inform you that your Academisthan Fellowship status has been suspended.
    </p>
    <div style="padding: 20px; background-color: #fef7e0; border-left: 4px solid #b06000; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0 0 5px; color: #b06000; font-size: 14px; line-height: 1.6; font-weight: bold;">Reason for suspension:</p>
      <p style="margin: 0; color: #b06000; font-size: 14px; line-height: 1.6;">${reason}</p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      If you wish to dispute this suspension, please contact the administrative support team.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 4. sendFellowDeletedEmail
export const sendFellowDeletedEmail = async (email: string, name: string): Promise<boolean> => {
  const subject = 'Academisthan Account Deleted';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Account Deletion Notice</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      This email serves as confirmation that your Academisthan Fellow account has been permanently deleted from our system. 
    </p>
    <div style="padding: 20px; background-color: #fce8e6; border-left: 4px solid #c5221f; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #c5221f; font-size: 14px; line-height: 1.6;">
        All your profiles, syllabus progress, certificates, and activity logs have been permanently deleted and cannot be recovered.
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      If you did not authorize this, or if this happened in error, please contact support immediately.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 5. sendAdminNewFellowEmail
export const sendAdminNewFellowEmail = async (adminEmail: string, adminName: string, fellowName: string): Promise<boolean> => {
  const subject = 'Alert: New Fellow Registration';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">New Fellow Registered</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${adminName},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      A new user, <strong>${fellowName}</strong>, has registered a Fellow account on Academisthan.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please check the Admin Dashboard to review the application details.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: adminEmail, subject, html: getEmailWrapper(subject, content) });
};

// 6. sendAdminFellowResubmittedEmail
export const sendAdminFellowResubmittedEmail = async (adminEmail: string, adminName: string, fellowName: string): Promise<boolean> => {
  const subject = 'Alert: Fellow Profile Resubmitted';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Fellow Profile Resubmitted</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${adminName},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      The Fellow, <strong>${fellowName}</strong>, has edited and resubmitted their profile information for review.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please log in to the Admin Dashboard to review their updated details and approve/reject their status.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: adminEmail, subject, html: getEmailWrapper(subject, content) });
};

// 7. sendAdminNewInstitutionEmail
export const sendAdminNewInstitutionEmail = async (adminEmail: string, adminName: string, instName: string): Promise<boolean> => {
  const subject = 'Alert: New Institution Registration';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">New Institution Registered</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${adminName},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      A new institution, <strong>${instName}</strong>, has been registered on Academisthan and is awaiting approval.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please go to the Admin Dashboard under "Institutions" to review the verification documents and approve the registration.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: adminEmail, subject, html: getEmailWrapper(subject, content) });
};

// 8. sendAdminInstitutionResubmittedEmail
export const sendAdminInstitutionResubmittedEmail = async (adminEmail: string, adminName: string, instName: string): Promise<boolean> => {
  const subject = 'Alert: Institution Details Resubmitted';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Institution Resubmitted</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${adminName},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      The representative for <strong>${instName}</strong> has updated and resubmitted their registration details for review.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please review their application status in the Admin Dashboard.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: adminEmail, subject, html: getEmailWrapper(subject, content) });
};

// 9. sendInstitutionDeletedEmail
export const sendInstitutionDeletedEmail = async (email: string, name: string, instName: string): Promise<boolean> => {
  const subject = `Institution Account Deleted - ${instName}`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Institution Deletion Notice</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      This email serves as confirmation that the institution profile for <strong>${instName}</strong> has been deleted from Academisthan by the administration.
    </p>
    <div style="padding: 20px; background-color: #fce8e6; border-left: 4px solid #c5221f; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #c5221f; font-size: 14px; line-height: 1.6;">
        All related records, approval logs, and change requests have been permanently deleted.
      </p>
    </div>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 10. sendAdminBlogSubmittedEmail
export const sendAdminBlogSubmittedEmail = async (adminEmail: string, adminName: string, blogTitle: string, authorName: string): Promise<boolean> => {
  const subject = 'Alert: New Blog Submitted for Review';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Blog Submitted</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${adminName},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      A new blog post, <strong>"${blogTitle}"</strong>, has been submitted by <strong>${authorName}</strong> and is awaiting review.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please visit the Admin Dashboard under "Blogs" to review and approve the post.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: adminEmail, subject, html: getEmailWrapper(subject, content) });
};

// 11. sendBlogApprovedEmail
export const sendBlogApprovedEmail = async (email: string, name: string, blogTitle: string): Promise<boolean> => {
  const subject = `Blog Approved and Published - "${blogTitle}"`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Blog Approved!</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Your blog submission, <strong>"${blogTitle}"</strong>, has been approved and published on Academisthan!
    </p>
    <div style="padding: 20px; background-color: #e6f4ea; border-left: 4px solid #137333; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0; color: #137333; font-size: 15px; line-height: 1.6; font-weight: bold;">
        Your post is now live and visible to the public. Thank you for your contribution!
      </p>
    </div>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 12. sendBlogRejectedEmail
export const sendBlogRejectedEmail = async (email: string, name: string, blogTitle: string, reason: string): Promise<boolean> => {
  const subject = `Blog Review Update - Revisions Required: "${blogTitle}"`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Blog Review Status</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Thank you for your blog submission, <strong>"${blogTitle}"</strong>. Upon review, our editorial team requires some modifications before publishing.
    </p>
    <div style="padding: 20px; background-color: #fce8e6; border-left: 4px solid #c5221f; border-radius: 4px; margin: 0 0 25px;">
      <p style="margin: 0 0 5px; color: #c5221f; font-size: 15px; line-height: 1.6; font-weight: bold;">Feedback/Rejection Reason:</p>
      <p style="margin: 0; color: #c5221f; font-size: 14px; line-height: 1.6;">${reason}</p>
    </div>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Please go to your dashboard, edit the blog content to address this feedback, and resubmit it for review.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 13. sendWelcomeEmail
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const subject = 'Welcome to Academisthan! 🎓';
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 24px;">
      Welcome to Academisthan, ${name}! 🎓
    </h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
      We are thrilled to welcome you to Academisthan—India's premier academic community, built of the teachers, by the teachers, and for the teachers.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 16px; line-height: 1.6;">
      Your account has been successfully verified! Here are a few things you can do to get started on your dashboard:
    </p>
    <ul style="margin: 0 0 25px; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
      <li><strong>Complete Your Profile:</strong> Reach 100% completion to activate your Fellowship status.</li>
      <li><strong>Academic CV Builder:</strong> Generate a professional CV tailored for educators.</li>
      <li><strong>UGC API & CAS Promotion Tools:</strong> Check your eligibility and calculate your API scores.</li>
      <li><strong>Enroll in Programs:</strong> Join advanced training programs such as "AI for Educators".</li>
      <li><strong>Register Your Institution:</strong> Link your college or university to connect it with the community.</li>
    </ul>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <tr>
        <td align="center">
          <a href="${frontendUrl}/dashboard" style="display: inline-block; padding: 15px 40px; background-color: hsl(38, 55%, 58%); color: hsl(228, 45%, 16%); text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px hsla(38, 55%, 58%, 0.3);">
            Go to Your Dashboard
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">If you have any questions or need assistance, feel free to contact us at any time.</p>
    <p style="margin: 20px 0 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br><strong>The Academisthan Team</strong></p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 14. sendInstitutionRegistrationConfirmationEmail
export const sendInstitutionRegistrationConfirmationEmail = async (email: string, name: string, instName: string): Promise<boolean> => {
  const subject = `Institution Registration Submitted - ${instName}`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Registration Submitted</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Thank you for registering <strong>${instName}</strong> on Academisthan!
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Your submission has been received and is currently undergoing administrative review. We will verify your details and supporting documents, and notify you as soon as the review is complete.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      In the meantime, you can track the status of your application on your Fellow Dashboard.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};

// 15. sendInstitutionResubmittedConfirmationEmail
export const sendInstitutionResubmittedConfirmationEmail = async (email: string, name: string, instName: string): Promise<boolean> => {
  const subject = `Institution Details Resubmitted - ${instName}`;
  const content = `
    <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 22px;">Details Resubmitted</h2>
    <p style="margin: 0 0 15px; color: #555; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      We have received the updated details you resubmitted for <strong>${instName}</strong>.
    </p>
    <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.6;">
      Your application is once again under review by our admin team. We will notify you immediately once the review is completed.
    </p>
    <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.6;">Best regards,<br>Academisthan Team</p>
  `;
  return sendEmail({ to: email, subject, html: getEmailWrapper(subject, content) });
};


