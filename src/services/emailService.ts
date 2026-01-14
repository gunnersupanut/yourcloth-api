import * as Brevo from '@getbrevo/brevo';
import { getVerificationEmailHtml, resetPasswordEmailHtml } from '../utils/emailTemplates';

//  Setup API Client
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey, // Key หลัก
    process.env.BREVO_API_KEY || '' // Key ของเรา
);

// ฟังก์ชั่นส่งเมล
export const sendEmail = async (to: string, subject: string, html: string) => {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    sendSmtpEmail.sender = { "name": "YourCloth Admin", "email": "yourclothc@gmail.com" };
    sendSmtpEmail.to = [{ "email": to }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
        console.log("Brevo Email sent successfully:");
        return data;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

export const emailService = {
    // ฟังก์ชันย่อยสำหรับส่ง Verify Email โดยเฉพาะ
    sendVerificationEmail: async (email: string, token: string) => {
        const link = `${process.env.CLIENT_URL}/verified?token=${token}`;
        const subject = "Welcome To YourCloth Please Verify Email";

        // เรียกเอา HTML มาจากไฟล์ Template
        const htmlContent = getVerificationEmailHtml(link);

        // เรียกฟังก์ชันส่ง
        await sendEmail(email, subject, htmlContent);
    },

    // รอเพิ่ม
    sendResetPasswordEmail: async (email: string, token: string) => {
        const link = `${process.env.CLIENT_URL}/resetpassword?token=${token}`;
        const subject = "Reset Password Email";
        // เรียกเอา HTML มาจากไฟล์ Template
        const htmlContent = resetPasswordEmailHtml(link);

        // เรียกฟังก์ชันส่ง
        await sendEmail(email, subject, htmlContent);
    },
};