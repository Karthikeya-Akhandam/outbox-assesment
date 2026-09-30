import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Standard Ethereal setup from env
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async (to: string, subject: string, text: string) => {
  const transporter = createTransporter();
  
  const info = await transporter.sendMail({
    from: `"ReachInbox Scheduler" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  console.log('Message sent: %s', info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  return info;
};
