import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: Number(process.env.SMTP_PORT) === 465, // Use SSL for 465, STARTTLS for others
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD.replace(/\s+/g, '') // Remove spaces from App Password
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'LuxuryStay'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html // HTML content takes precedence in most clients
  };

  const info = await transporter.sendMail(message);


};

export default sendEmail;
