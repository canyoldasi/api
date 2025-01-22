// custom-email-transport.ts
import { TransportStreamOptions } from 'winston-transport';
import * as TransportStream from 'winston-transport';
import * as nodemailer from 'nodemailer';

export class EmailTransport extends TransportStream {
  constructor(opts?: TransportStreamOptions) {
    super(opts);
  }

  private async sendEmail(message: string) {
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
      subject: process.env.EMAIL_SUBJECT || 'Error Log from Application',
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Error email sent successfully');
    } catch (error) {
      console.error('Failed to send error email:', error);
    }
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    if (info.level === 'error') {
        if (process.env.NODE_ENV == 'production') {
            this.sendEmail(info.message).catch((e) => console.error('Email sending failed:', e));
        }
    }

    callback();
  }
}
