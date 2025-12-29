import { userRepository } from "../repositories/userRepository";
import Jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { CreateUserParams, LoginRequestBody, RegisterRequestBody, updateTokenParams } from "../type/user.type";
import bcrypt from 'bcrypt';
import { emailService, sendEmail } from "./emailService";

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
    verifyEmail: async (token: string) => {
        // เช็ค token
        // ถ้าผ่าน เรียก Repo
        const user = await userRepository.findByVerificationToken(token);
        if (!user) throw new Error("invalid_token")
        // เช็คหมดอายุ
        if (new Date() > user.verification_expires_at) {
            throw new Error("invalid_token");
        }

        // ถ้ายัง ให้ Repo อัปเดต
        const updatedUser = await userRepository.verifyUser(user.id);
        return { status: "SUCCESS", user: updatedUser };
    },
    resendEmail: async (userId: number, email: string) => {
        // สร้างโทเคน
        const verificationToken = uuidv4();
        // สร้างเวลาหมดอายุ (ปัจจุบัน + 30 นาที)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        // เตรียมข้อมูลส่งไป CreateUser Repository
        const updateTokenParams: updateTokenParams = {
            userId,
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