import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class SendEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    origin: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <html>
  <body style="background-color: #F9F9F9; font-family: Arial, sans-serif; color: #333333; padding: 20px; margin: 0;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); padding: 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 32px; color: #4CAF50; margin-bottom: 10px; font-weight: bold;">Tanyadiet - Atur Ulang Kata Sandi Anda</h1>
        <p style="font-size: 18px; color: #555555; line-height: 1.5;">Halo,</p>
        <p style="font-size: 16px; color: #555555; line-height: 1.5;">Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Jangan khawatir, ini adalah langkah mudah untuk kembali mengakses akun Anda.</p>
        <p style="font-size: 16px; color: #555555; line-height: 1.5;">Untuk melanjutkan, cukup klik tombol di bawah ini untuk membuat kata sandi baru:</p>
      </div>
      <center>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 14px 36px; font-size: 18px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center; transition: background-color 0.3s ease;">Atur Ulang Kata Sandi</a>
      </center>

      <p style="font-size: 16px; color: #555555; line-height: 1.5;">Jika Anda tidak merasa melakukan permintaan ini, Anda dapat mengabaikan email ini. Link reset akan kedaluwarsa dalam 24 jam.</p>

      <div style="font-size: 14px; text-align: center; color: #777777; margin-top: 40px;">
        <p>Terima kasih telah menggunakan Tanyadiet! <br> Kami selalu siap membantu Anda.</p>
        <p style="font-size: 16px; color: #42A5F5; font-weight: bold;">Tim Tanyadiet</p>
        <p><a href="https://tanyadiet.com" style="color: #42A5F5; text-decoration: none;">Kunjungi Tanyadiet</a></p>
      </div>
    </div>
  </body>
</html>

    `;

    try {
      await this.transporter.sendMail({
        from: '"Tanyadiet Support" <your-email@gmail.com>', // Ganti dengan email Anda
        to,
        subject: 'Password Reset Request',
        html: htmlContent,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
