import { Request, Response } from 'express';
import { sendEmail } from '../services/email.sercive';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
const jwtSecret: string = process.env.JWT_SECRET as string
interface RegisterRequestBody {
    username: string;
    email: string;
    password: string;
}

// Email
const verifySubject = "Welcome To YourCloth Please Verify Email"


export const registerController = async (
    req: Request<unknown, unknown, RegisterRequestBody>,
    res: Response) => {

    const { username, email, password } = req.body
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, Email And Password are required" });
    }
    try {
        const saltRounds: number = 10
        const hashedPassword: string = await bcrypt.hash(password, saltRounds);
        const insertSql: string = `
        INSERT INTO users(username,email,password_hash)
        VALUES ($1, $2, $3)
        RETURNING id;
        `;
        const values = [username, email, hashedPassword];
        const result = await pool.query(insertSql, values);

        // สร้าง Token สำหรับลิงก์ยืนยันตัวตน
        const verifyToken = jwt.sign(
            { id: result.rows[0].id },
            jwtSecret,
            { expiresIn: '1h' }
        )
        const verificationLink = `${process.env.CLIENT_URL}/verified?token=${verifyToken}`
        const htmlMessage = `
  <h1>ยืนยันอีเมลของคุณ</h1>
  <p>กรุณากดปุ่มด้านล่างเพื่อยืนยันการสมัครสมาชิกครับ</p>
  <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
    ยืนยันอีเมล (Verify Email)
  </a>
  <p>หรือคลิกลิงก์นี้: <a href="${verificationLink}">${verificationLink}</a></p>
`;
        await sendEmail(email, verifySubject, htmlMessage)
        res.status(201).json({
            message: 'Register Complete.',
            userId: result.rows[0].id
        });

    } catch (error: any) { // ใส่ 'any' จะได้ .code ได้

        // 23505 คือรหัส Error "Unique Violation" ของ PostgreSQL!
        if (error.code === '23505') {

            // err.detail... มันจะฟ้องว่าซ้ำที่ Key ไหน!
            if (error.detail.includes('username')) {
                return res.status(400).json({ message: 'Username already exists!' });
            }
            if (error.detail.includes('email')) {
                return res.status(400).json({ message: 'Email already exists!' });
            }
            return res.status(400).json({ massage: 'Unique Violation' });
        }

        // ถ้ามัน Error อย่างอื่น
        console.error(error);
        res.status(500).json({ message: 'Register Fail.' });
    }
}

interface LoginRequestBody {
    username: string;
    password: string;
    rememberMe: boolean;
}
export const loginController = async (req: Request<unknown, unknown, LoginRequestBody>, res: Response) => {
    const { username, password, rememberMe } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: "Username And Password are required" });
    }
    try {
        // Sql
        const sql = `
        SELECT id, username, email, password_hash, is_active, is_verify
        FROM users
        WHERE username = $1
        `;
        // Run query
        const result = await pool.query(sql, [username])
        // ถ้าไม่เจอ user
        if (result.rows.length === 0) {
            return res.status(401).json({ message: `Username Or Password is invalid.` })
        }
        const user = result.rows[0];

        // ตรวจรหัสผ่านก่อน กันเดาสุ่ม user
        const isMatchPassword: boolean = await bcrypt.compare(password, user.password_hash)
        if (!isMatchPassword) return res.status(401).json({ message: `Username Or Password is invalid.` })

        // ถ้า is_verify = 0
        if (!user.is_verify) return res.status(403).json({
            message: `Please verify your email.`,
            email: user.email
        })
        // ถ้า is_active = 0
        if (!user.is_active) return res.status(403).json({ message: `Account is suspended. Please contact support.` })
        // หากรหัสผ่านถูกต้อง
        // สร้าง JWT token พร้อม id และ id_companies
        const token = jwt.sign(
            { id: user.id, username: user.username },
            jwtSecret,
            { expiresIn: rememberMe ? '7d' : '1d' }
        );
        // ส่งข้อมูลกลับไปยัง user
        res.status(200).json({
            message: "Login Complete.",
            token: token,
        })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.error('[Login Error]:', error.message);
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error('[Login Error]: Unknown error', error);
        }
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
        const decoded: any = jwt.verify(token, jwtSecret);
        const sql = `
        UPDATE users
        SET is_verify = true
        WHERE id = $1
        RETURNING id, username
        `
        const result = await pool.query(sql, [decoded.id]);
        // เช็คว่าเจอ user ไหม (เผื่อ id นี้โดนลบไปแล้ว)
        if (result.rowCount === 0) {
            return res.status(404).send("User not found");
        }
        // สำเร็จ
        res.status(200).json({
            message: "Email verified successfully!",
            user: result.rows[0]
        });
    } catch (error) {
        res.status(400).send("Invalid or Expired Token");
    }

}

export const resentEmailController = async(req:Request,res:Response)=>{

};