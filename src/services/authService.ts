import { userRepository } from "../repositories/userRepository";
import Jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { createResetPasswordTokenParams, CreateUserParams, LoginRequestBody, RegisterRequestBody, resetPasswordReq, updateTokenParams } from "../type/userType";
import bcrypt from 'bcrypt';
import { emailService } from "./emailService";

export const authService = {
    login: async (payload: LoginRequestBody) => {
        const { username, password, rememberMe } = payload

        const user = await userRepository.findByUsernameWithPassword(username);
        // ถ้าไม่เจอ user
        if (!user) throw new Error("invalid_credentials")

        // ถ้าเจอตรวจรหัสผ่านก่อน กันสุ่ม user
        const isMatchPassword: boolean = await bcrypt.compare(password, user.password_hash)
        if (!isMatchPassword) throw new Error("invalid_credentials")
        //เช็ค verify
        if (!user.is_verify) return { status: "user_not_verify", email: user.email };
        // เช็คสถานะบัญชี
        if (!user.is_active) return { status: "user_not_active" };
        if (user.deleted_at) return { status: "user_deleted" }
        // หากรหัสผ่านถูกต้อง
        // สร้าง JWT token พร้อม id 
        const token = Jwt.sign({ id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: rememberMe ? '7d' : '1d' }
        );
        // update เวลาเข้าใช้งานล่าสุด
        await userRepository.updateLastLogin(user.id);
        return { status: "SUCCESS", token: token }

    },
    register: async (payload: RegisterRequestBody) => {
        const { username, password, email } = payload;
        // เช็คว่า Username/Email ซ้ำไหม
        // ใช้ Promise ส่งไปพร้อมกันเลย
        const [existingUser, existingEmail] = await Promise.all([
            userRepository.findByUsername(username),
            userRepository.findByEmail(email)
        ]);
        if (existingUser) throw new Error("username_exist");
        if (existingEmail) throw new Error("email_exist");

        // hash Password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // สร้างโทเคน
        const verificationToken = uuidv4();
        // สร้างเวลาหมดอายุ (ปัจจุบัน + 30 นาที)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        // เตรียมข้อมูลส่งไป CreateUser Repository
        const newUserParams: CreateUserParams = {
            username: username,
            password_hash: passwordHash,
            email: email,
            verification_token: verificationToken,
            verification_expires_at: expiresAt
        }
        await userRepository.addNewUser(newUserParams);
        // ส่งเมล
        try {
            await emailService.sendVerificationEmail(email, verificationToken);
        } catch (error) {
            console.error("ส่งเมลไม่ผ่าน:", error)
        }
    },
    forgotpassword: async (email: string) => {
        // หา user ก่อน
        const user = await userRepository.findByEmail(email);
        // ถ้าไม่มี
        if (!user) {
            return;
        }
        // ถ้ามี
        // สร้างโทเคน
        const resetPasswordToken = uuidv4();
        // สร้างเวลาหมดอายุ (ปัจจุบัน + 30 นาที)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 60);
        // เตรียมข้อมูลส่งไป CreateResetPassword Repository
        const resetPasswordTokenParams: createResetPasswordTokenParams = {
            email,
            reset_password_token: resetPasswordToken,
            reset_password_expires_at: expiresAt
        }
        await userRepository.createResetPasswordToken(resetPasswordTokenParams);
        // ส่งเมล
        try {
            await emailService.sendResetPasswordEmail(email, resetPasswordToken);
        } catch (error) {
            console.error("ส่งเมลไม่ผ่าน:", error)
        }
    },
    checkResetToken: async (token: string) => {
        const user = await userRepository.findByResetToken(token);

        // ถ้าไม่เจอ (Token มั่ว หรือ ถูกใช้ไปแล้วแล้วลบทิ้ง)
        if (!user) {
            throw new Error("invalid_token");
        }

        // เช็คหมดอายุ
        if (new Date() > user.reset_password_expires_at) {
            throw new Error("invalid_token");
        }
    },
    resetPassword: async (payload: resetPasswordReq) => {
        const { token, password } = payload
        // เช็ค Token
        const user = await userRepository.findByResetToken(token);

        // ถ้าไม่เจอ (Token มั่ว หรือ ถูกใช้ไปแล้วแล้วลบทิ้ง)
        if (!user) {
            throw new Error("invalid_token");
        }

        // เช็คหมดอายุ
        if (new Date() > user.reset_password_expires_at) {
            throw new Error("invalid_token");
        }
        // hash Password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds)
        // เตรียมข้อมูล updatePassword
        const updatePasswordData: resetPasswordReq = {
            token, password: passwordHash
        }
        // อัพเดต password
        await userRepository.updatePassword(updatePasswordData)
    },
    verifyEmail: async (token: string) => {
        // ถ้าผ่าน เรียก Repo
        const user = await userRepository.findByVerificationToken(token);
        if (!user) throw new Error("invalid_token")
        // เช็คหมดอายุ
        if (new Date() > user.verification_expires_at) {
            throw new Error("invalid_token");
        }
        // ถ้ายัง ให้ Repo อัปเดต
        await userRepository.verifyUser(user.id);
    },
    resendEmail: async (email: string) => {
        // ลองหา user ก่อน
        const user = await userRepository.findByEmail(email);
        // ถ้าไม่มี
        if (!user) {
            throw new Error("user_not_found");
        }
        // ถ้า Verify ไปแล้ว จะส่งไปทำไม? ให้จบเลย
        if (user.is_verify) {
            throw new Error("already_verified");
        }
        // สร้างโทเคน
        const verificationToken = uuidv4();
        // สร้างเวลาหมดอายุ (ปัจจุบัน + 30 นาที)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        // เตรียมข้อมูลส่งไป CreateUser Repository
        const updateTokenParams: updateTokenParams = {
            email,
            verification_token: verificationToken,
            verification_expires_at: expiresAt
        }
        await userRepository.updateToken(updateTokenParams);

        // ส่งเมล
        try {
            await emailService.sendVerificationEmail(email, verificationToken);
        } catch (error) {
            console.error("ส่งเมลไม่ผ่าน:", error)
        }
    }

}