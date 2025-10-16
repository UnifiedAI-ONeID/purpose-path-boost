export function generatePasswordResetEmail(
  userEmail: string,
  resetLink: string,
  expiryHours: number = 24
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #f8fbfb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12); text-align: center; margin-bottom: 20px;">
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 56px; height: 56px; background-color: #184646; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; vertical-align: middle;">
                      <span style="font-size: 36px; line-height: 1;">🌱</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle; text-align: left; padding-left: 12px;">
                    <h1 style="color: #184646; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2;">ZhenGrowth</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr><td style="height: 20px;"></td></tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);">
              <h2 style="color: #0b1212; font-size: 28px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.3;">Reset Your Password</h2>
              
              <p style="color: #3a4949; font-size: 16px; line-height: 1.6; margin: 16px 0;">
                Hello,
              </p>
              
              <p style="color: #3a4949; font-size: 16px; line-height: 1.6; margin: 16px 0;">
                We received a request to reset the password for your ZhenGrowth account associated with <strong style="color: #0b1212; font-weight: 600;">${userEmail}</strong>.
              </p>

              <p style="color: #3a4949; font-size: 16px; line-height: 1.6; margin: 16px 0;">
                Click the button below to create a new password. This link will expire in ${expiryHours} hours.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 32px auto; text-align: center; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="background-color: #e7c873; border-radius: 12px; color: #0b1212; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px; box-shadow: 0 4px 12px rgba(231, 200, 115, 0.3); transition: all 0.2s;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #3a4949; font-size: 14px; line-height: 1.5; margin: 16px 0 8px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0;">
                <a href="${resetLink}" style="color: #184646; font-size: 14px; text-decoration: underline; word-break: break-all;">${resetLink}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #d3dfdf; margin: 24px 0;">

              <p style="color: #93a5a5; font-size: 14px; line-height: 1.5; margin: 12px 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

              <p style="color: #93a5a5; font-size: 14px; line-height: 1.5; margin: 12px 0;">
                For security reasons, this link will expire in ${expiryHours} hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <hr style="border: none; border-top: 1px solid #d3dfdf; margin: 0 0 24px 0;">
              <p style="color: #93a5a5; font-size: 14px; line-height: 1.5; margin: 12px 0;">
                <strong style="color: #184646; font-weight: 600;">ZhenGrowth</strong><br>
                Transforming potential into performance
              </p>
              <p style="color: #93a5a5; font-size: 13px; margin: 8px 0;">
                <a href="https://zhengrowth.com" style="color: #184646; text-decoration: none;">Website</a>
                <span style="color: #93a5a5;"> • </span>
                <a href="https://zhengrowth.com/about" style="color: #184646; text-decoration: none;">About</a>
                <span style="color: #93a5a5;"> • </span>
                <a href="https://zhengrowth.com/contact" style="color: #184646; text-decoration: none;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generatePasswordResetText(
  userEmail: string,
  resetLink: string,
  expiryHours: number = 24
): string {
  return `
ZhenGrowth - Reset Your Password

Hello,

We received a request to reset the password for your ZhenGrowth account associated with ${userEmail}.

Click the link below to create a new password. This link will expire in ${expiryHours} hours:

${resetLink}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, this link will expire in ${expiryHours} hours.

---
ZhenGrowth
Transforming potential into performance

Website: https://zhengrowth.com
About: https://zhengrowth.com/about
Support: https://zhengrowth.com/contact
  `.trim();
}