import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import jwt from 'jsonwebtoken';
const jwtSecret: string = process.env.JWT_SECRET as string
interface RegisterRequestBody {
    username: string;
    email: string;
    password: string;
}
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
        res.status(201).json({
            message: 'Register Complete.',
            userId: result.rows[0].id
        });

    } catch (error: any) { // ใส่ 'any' จะได้ .code ได้

        // 23505 คือรหัส Error "Unique Violation" ของ PostgreSQL!
        if (error.code === '23505') {

            // err.detail... มันจะฟ้องว่ามึงซ้ำที่ Key ไหน!
            if (error.detail.includes('username')) {
                return res.status(400).json({ error: 'Username already exists!' });
            }
            if (error.detail.includes('email')) {
                return res.status(400).json({ error: 'Email already exists!' });
            }
            return res.status(400).json({ error: 'Unique Violation' });
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
        SELECT id, password_hash, is_active
        FROM users
        WHERE username = $1
        `;
        // Run query
        const result = await pool.query(sql, [username])
        // ถ้าไม่เจอ user
        if (result.rows.length === 0) {
            return res.status(401).json({ error: `Username Or Password is invalid.` })
        }
        const user = result.rows[0];
        // ถ้า is_active = 0
        if (!user.is_active) return res.status(401).json({ error: `Account is suspended. Please contact support.` })
        // ตรวจรหัสผ่าน
        const isMatchPassword: boolean = await bcrypt.compare(password, user.password_hash)
        if (!isMatchPassword) return res.status(401).json({ error: `Username Or Password is invalid.` })
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