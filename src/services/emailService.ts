import nodemailer from 'nodemailer';
import { getVerificationEmailHtml } from '../utils/emailTemplates';

// สร้าง Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.Email_USER,
        pass: process.env.Email_PASS,
    }
})

// ฟังก์ชั่นส่งเมล
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"Your Cloth"<no-reply@yourcloth.com>', // ชื่อผู้ส่ง
            to: to, // ส่งหาใคร
            subject: subject, // หัวข้อ
            html: html, //เนื้อหา
        })
        console.log("Message sent: %s", info.messageId);
        return info;
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
        // ... logic 
    }
};