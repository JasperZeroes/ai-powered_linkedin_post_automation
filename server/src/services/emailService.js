const nodemailer = require("nodemailer");
const env = require("../config/env");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSmtpConfig() {
  return {
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth:
      env.smtpUser && env.smtpPass
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
  };
}

async function sendVerificationOtpEmail({ toEmail, fullName, otpCode }) {
  if (!env.smtpHost || !env.emailFrom) {
    throw new Error("SMTP is not configured. Set SMTP_HOST and EMAIL_FROM.");
  }

  const transporter = nodemailer.createTransport(getSmtpConfig());
  const displayName = fullName ? fullName.trim() : "there";
  const safeDisplayName = escapeHtml(displayName);
  const safeOtpCode = escapeHtml(otpCode);

  const subject = "Your verification code for LinkedIn AI Post Generator";
  const text = `Hello ${displayName},\n\nUse this verification code to finish setting up your account:\n${otpCode}\n\nThis code expires in ${env.otpExpiryMinutes} minutes and can only be used once.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nLinkedIn AI Post Generator Team`;
  const html = `
    <div style="margin:0;padding:24px;background-color:#f4f7fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;">
            <p style="margin:0;font-size:14px;letter-spacing:0.3px;opacity:0.9;">LinkedIn AI Post Generator</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">Confirm your email address</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 20px;">
            <p style="margin:0 0 14px;font-size:16px;">Hello ${safeDisplayName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
              Use the verification code below to finish setting up your account.
            </p>
            <div style="margin:0 0 18px;padding:14px 16px;border:1px dashed #94a3b8;border-radius:10px;background-color:#f8fafc;text-align:center;">
              <span style="display:block;font-size:12px;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">Verification code</span>
              <span style="display:block;margin-top:6px;font-size:30px;letter-spacing:8px;font-weight:700;color:#0f172a;">${safeOtpCode}</span>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">
              This code expires in <strong>${env.otpExpiryMinutes} minutes</strong> and can only be used once.
            </p>
            <p style="margin:0;font-size:14px;color:#6b7280;">
              If you did not request this code, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Need help? Reply to this email and our team will assist you.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by LinkedIn AI Post Generator</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: env.emailFrom,
    to: toEmail,
    subject,
    text,
    html,
  });
}

async function sendPasswordResetCodeEmail({ to, fullName, resetCode }) {
  if (!env.smtpHost || !env.emailFrom) {
    throw new Error("SMTP is not configured. Set SMTP_HOST and EMAIL_FROM.");
  }

  const transporter = nodemailer.createTransport(getSmtpConfig());
  const displayName = fullName ? fullName.trim() : "there";
  const safeDisplayName = escapeHtml(displayName);
  const safeResetCode = escapeHtml(resetCode);
  const expiryMinutes = env.passwordResetExpiryMinutes || 15;

  const subject = "Your password reset code for LinkedIn AI Post Generator";
  const text = `Hello ${displayName},

Use this password reset code to reset your account password:
${resetCode}

This code expires in ${expiryMinutes} minutes and can only be used once.

If you did not request this, please ignore this email.

Thanks,
LinkedIn AI Post Generator Team`;

  const html = `
    <div style="margin:0;padding:24px;background-color:#f4f7fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="padding:20px 24px;background:linear-gradient(135deg,#7f1d1d,#991b1b);color:#ffffff;">
            <p style="margin:0;font-size:14px;letter-spacing:0.3px;opacity:0.9;">LinkedIn AI Post Generator</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 20px;">
            <p style="margin:0 0 14px;font-size:16px;">Hello ${safeDisplayName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
              Use the reset code below to set a new password for your account.
            </p>
            <div style="margin:0 0 18px;padding:14px 16px;border:1px dashed #fca5a5;border-radius:10px;background-color:#fff7f7;text-align:center;">
              <span style="display:block;font-size:12px;color:#991b1b;letter-spacing:0.5px;text-transform:uppercase;">Password reset code</span>
              <span style="display:block;margin-top:6px;font-size:30px;letter-spacing:8px;font-weight:700;color:#7f1d1d;">${safeResetCode}</span>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">
              This code expires in <strong>${expiryMinutes} minutes</strong> and can only be used once.
            </p>
            <p style="margin:0;font-size:14px;color:#6b7280;">
              If you did not request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Need help? Reply to this email and our team will assist you.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by LinkedIn AI Post Generator</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendVerificationOtpEmail,
  sendPasswordResetCodeEmail,
};
