import { Request, Response } from 'express';


import { LoginRequestBody, RegisterRequestBody } from '../type/user.type';
import { authService } from "../services/authService";
const jwtSecret: string = process.env.JWT_SECRET as string

// Email

export const registerController = async (
    req: Request<unknown, unknown, RegisterRequestBody>,
    res: Response) => {

    const { username, email, password } = req.body
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, Email And Password are required" });
    }
    const registerPayload: RegisterRequestBody = {
        username,
        email,
        password
    };
    try {
        const result = await authService.register(registerPayload)

        res.status(201).json({
            message: 'Register Complete.',
            userId: result.id
        });

    } catch (error: any) { // ใส่ 'any' จะได้ .code ได้
        if (error instanceof Error) {
            if (error.message === "username_exist") return res.status(409).json({ message: `This username already exist.` })
            if (error.message === "email_exist") return res.status(409).json({ message: `This email already exist.` })
        }
        // ถ้ามัน Error อย่างอื่น
        console.error(error);
        res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }
}

export const loginController = async (req: Request<unknown, unknown, LoginRequestBody>, res: Response) => {
    const { username, password, rememberMe } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: "Username And Password are required" });
    }
    const loginPayload: LoginRequestBody = {
        username,
        password,
        rememberMe: rememberMe || false // ใส่ default value ได้ตรงนี้
    };
    try {
        // เรียกใช้ Sercive
        const result = await authService.login(loginPayload)
        if (result.status === "user_not_verify") return res.status(403).json({
            message: `Please verify your email.`,
            email: result.email
        })
        if (result.status === "user_not_active") return res.status(403).json({ message: `Account is suspended. Please contact support.` })
        if (result.status === "user_deleted") return res.status(404).json({ message: `Account is Deleted. Please contact support.` })
        res.status(200).json({
            message: "Login Complete.",
            token: result.token,
        })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            if (error.message === "invalid_credentials") return res.status(401).json({ message: `The username or password is incorrect.` })
        }
        // ถ้ามันเป็นอย่างอื่นที่โยนมา
        console.error('[Login Error]: Unknown error', error);
        res.status(500).json({ message: `Login Fail` });
    }
}

interface VerifyEmailQuery {
    token: string;
}
export const verifyController = async (req: Request<unknown, unknown, unknown, VerifyEmailQuery>,
    res: Response) => {
    // รับ Token จาก frontend
    const { token } = req.query;
    if (!token) return res.status(400).send("No token provided");
    // แกะ Token
    try {
        // เรียก Service
        const result = await authService.verifyEmail(token as string);
        // สำเร็จ
        res.status(200).json({
            message: "Email verified successfully!",
            user: result.user
        });
    } catch (error: any) {
        if (error.message === "invalid_token") {
            return res.status(400).send({ message: "Invalid or Expired Token." });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }

}

export const resentEmailController = async (req: Request, res: Response) => {

};