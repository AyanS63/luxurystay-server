import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testEmail = async () => {
    console.log('--- Starting Email Debugger ---');
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`SMTP User: ${process.env.SMTP_EMAIL}`);
    // Do not log password, but check if it exists and length
    console.log(`SMTP Password set: ${!!process.env.SMTP_PASSWORD} (Length: ${process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0})`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD.replace(/\s+/g, '')
        },
        logger: true, // Log to console
        debug: true   // Include debug info
    });

    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP Connection Verified!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `Debug <${process.env.SMTP_EMAIL}>`,
            to: process.env.SMTP_EMAIL,
            subject: 'Test Email from LuxuryStay Debugger',
            text: 'This is a test email.',
            html: '<b>This is a test email.</b>'
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
    }
};

testEmail();
