export const verificationEmailTemplate = (name: string, verificationLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Academisthan</title>
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
              <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 24px;">
                Welcome to Academisthan, ${name}! 🎓
              </h2>
              
              <p style="margin: 0 0 20px; color: #555; font-size: 16px; line-height: 1.6;">
                Thank you for becoming a Fellow! We're excited to have you join India's premier academic community.
              </p>
              
              <p style="margin: 0 0 30px; color: #555; font-size: 16px; line-height: 1.6;">
                To complete your registration and access your Fellow dashboard, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; background-color: hsl(38, 55%, 58%); color: hsl(228, 45%, 16%); text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px hsla(38, 55%, 58%, 0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; color: #888; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 30px; padding: 12px; background-color: #f9f9f9; border-radius: 6px; color: #666; font-size: 13px; word-break: break-all;">
                ${verificationLink}
              </p>
              
              <div style="padding: 20px; background-color: #fff5e6; border-left: 4px solid hsl(38, 55%, 58%); border-radius: 4px; margin: 0 0 20px;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                  <strong>⏱️ Important:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6;">
                Once verified, you'll be able to:
              </p>
              
              <ul style="margin: 10px 0 20px; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                <li>Access your Fellow dashboard</li>
                <li>Register your institution</li>
                <li>Enroll in programs like "AI for Educators"</li>
                <li>Use all teacher tools and resources</li>
                <li>Connect with educators across India</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #888; font-size: 13px; line-height: 1.6;">
                If you didn't create an account with Academisthan, you can safely ignore this email.
              </p>
              
              <p style="margin: 0 0 15px; color: #888; font-size: 13px; line-height: 1.6;">
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

export const verificationSuccessEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verified - Academisthan</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, hsl(228, 45%, 16%) 0%, hsl(228, 45%, 20%) 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: hsl(38, 55%, 58%); font-size: 28px;">
                Academisthan
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: #10b981; border-radius: 50%; line-height: 80px; text-align: center;">
                <span style="font-size: 40px; color: #ffffff; line-height: 80px; font-weight: bold; display: inline-block; vertical-align: middle;">✓</span>
              </div>
              
              <h2 style="margin: 0 0 20px; color: hsl(228, 45%, 16%); font-size: 24px;">
                Email Verified Successfully! 🎉
              </h2>
              
              <p style="margin: 0 0 30px; color: #555; font-size: 16px; line-height: 1.6;">
                Welcome aboard, ${name}! Your email has been verified and your Fellow account is now fully active.
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard" style="display: inline-block; padding: 16px 40px; background-color: hsl(38, 55%, 58%); color: hsl(228, 45%, 16%); text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                © 2026 Academisthan. All rights reserved.
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
