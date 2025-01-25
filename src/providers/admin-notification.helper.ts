// custom-email-transport.ts
import * as nodemailer from 'nodemailer';

export class AdminNotificationHelper  {
  public async sendEmail(message: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: process.env.EMAIL_SUBJECT || 'Hata oluştu',
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Error email sent successfully');
    } catch (error) {
      console.error('Failed to send error email:', error);
    }
  }

}
