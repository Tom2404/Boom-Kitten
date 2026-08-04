let transporter;

async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw new Error('SMTP is not configured');
    return;
  }
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Boom-Kitten <no-reply@boom-kitten.local>',
    to,
    subject: 'Đặt lại mật khẩu Boom-Kitten',
    text: `Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút: ${resetUrl}`,
  });
}

module.exports = { sendPasswordResetEmail };
