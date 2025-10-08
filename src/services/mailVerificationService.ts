import nodemailer from 'nodemailer';
import path from 'path';
import { verifyUserEmail } from '../template_mail/verificationUserMail';
import resend from '../config/resendConfig'

//const filePath = path.join(__dirname, '../../../../uploads/email/1.png');

interface IUser {
  email: string;
  name?: string;
  username?: string; 
}




export const sendVerificationEmail = async (
  user: IUser,
  verificationCode: Number
): Promise<void> => {
  try {
    const htmlContent = verifyUserEmail(user.username ?? '', verificationCode);

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: "gbaialij@gmail.com", 
      subject: '🔐 Code de vérification pour votre compte Flajoo',
      html: htmlContent,
   /*   attachments: [
        {
          path: filePath,
          filename: 'logo.png',
        },
    ],*/
    });

    if ((response as any).error) {
      console.error('❌ Erreur lors de l’envoi de l’email:', (response as any).error);
      return;
    }

    console.log(`✅ Email envoyé avec succès à ${user.email}`);
  } catch (error) {
    console.error('🚨 Erreur lors de l’envoi de l’email avec Resend:', error);
  }
};


