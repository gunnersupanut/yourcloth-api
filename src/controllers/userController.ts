import { Request, Response } from "express";
import pool from "../config/db";
import { CustomJwtPayload } from "../type/jwtType";

// ---type 
interface UpdateProfileRequestBody {
    name: string;
    surname: string;
    tel: string;
    birthday: string;
    gender: "Male" | "Female" | "Non-binary";

}
export const updateProfileController = async (req: Request<unknown, unknown, UpdateProfileRequestBody>, res: Response) => {
    try {
        const { name, surname, tel, birthday, gender } = req.body
        const userId = (req.user as CustomJwtPayload).id;
        const updates = []; // ใช้ SET
        const updateProfileValues = [];  // ใช้เป็น ค่า
        let paramIndex: number = 1; // ตัวนับ $

        // เงื่อนไข
        if (name) {
            updates.push(`name = $${paramIndex++}`); // "name = $1"
            updateProfileValues.push(name);
        }
        if (surname) {
            updates.push(`surname = $${paramIndex++}`); // "surname = $2"
            updateProfileValues.push(surname);
        }
        if (tel) {
            updates.push(`tel = $${paramIndex++}`); // "tel = $3"
            updateProfileValues.push(tel);
        }
        if (birthday) {
            updates.push(`birthday = $${paramIndex++}`); // "birthday = $4"
            updateProfileValues.push(birthday);
        }
        if (gender) {
            updates.push(`gender = $${paramIndex++}`); // "gender = $5"
            updateProfileValues.push(gender);
        }

        // เช็คว่ามี updates อะไรบ้าง
        // ถ้าไม่มี
        if (updates.length === 0) {
            return res.status(400).json({ error: 'There must be at least one value to update.' });
        }

        // ส่ง User Id เป็นค่าสุดท้ายของ WHERE
        updateProfileValues.push(userId);
        const whereClause = `WHERE id = $${paramIndex}`;
        const updateProfileSql = `
        UPDATE users
        SET ${updates.join(', ')}
        ${whereClause};
        `;
        await pool.query(updateProfileSql, updateProfileValues)
        res.status(200).json({ message: "Update Profile Complete." })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.error('[UpdateProfile Error]:', error.message);
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error('[UpdateProfile Error]: Unknown error', error);
        }
        res.status(500).json({ error: `UpdateProfile Fail` });
    }
}

export const getMyProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;

        const getmyProfileSql = `
        SELECT username, name, surname, email, tel, birthday, gender
        FROM users
        WHERE id = $1
        `;
        const result = await pool.query(getmyProfileSql, [userId])
        if (result.rows.length === 0) {
            // ไม่เจอ User 
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: "Get My  Profile Complete.", result: result.rows[0] })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.error('[Get My Profile Error]:', error.message);
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error('[Get My Profile Error]: Unknown error', error);
        }
        res.status(500).json({ error: `Get My Profile Fail` });
    }
}