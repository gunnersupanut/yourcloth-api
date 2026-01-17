import pool from "../config/db";
import { Pool, PoolClient } from 'pg';
import { UpdateAddressPayload } from "../type/addressTypes";
import { toSnakeCase } from "../utils/dbHelper";
export const addressRepository = {
    findAddressByUserId: async (userId: number) => {
        const sql = `
        SELECT * FROM user_addresses 
        WHERE user_id = $1 
        ORDER BY is_default DESC, created_at DESC
    `;
        const result = await pool.query(sql, [userId]);
        return result.rows;
    },
    createAddress: async (userId: number, data: any, client: Pool | PoolClient = pool) => {
        const { recipientName, phone, address, isDefault } = data;
        const sql = `
        INSERT INTO user_addresses (user_id, recipient_name, phone, address, is_default)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
        const result = await client.query(sql, [userId, recipientName, phone, address, isDefault || false]);
        return result.rows[0];
    },
    // รับ Pool หรือ Client ก็ได้นะ แต่ถ้าไม่ส่งมา ให้ใช้ pool เป็นค่าเริ่มต้น
    resetDefaultAddress: async (userId: number, client: Pool | PoolClient = pool) => {
        const sql = `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`;
        await client.query(sql, [userId]);
    },
    // ลบ
    deleteAddress: async (id: string, userId: number) => {
        const sql = `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id`;
        const result = await pool.query(sql, [id, userId]);
        return (result.rowCount ?? 0) > 0;
    },

    // อัปเดตที่อยู่
    updateAddress: async (id: string, userId: number, data: UpdateAddressPayload, client: Pool | PoolClient = pool) => {
        // กรองเอาเฉพาะ field ที่ส่งมา (ไม่เอา undefined)
        const updates = Object.keys(data).filter(
            key => data[key as keyof UpdateAddressPayload] !== undefined
        );
        // ถ้าไม่มีอะไรส่งมาเลย ก็ไม่ต้องทำอะไร
        if (updates.length === 0) return null;
        // สร้างประโยค SET (เช่น "recipient_name = $1, phone = $2")
        // และเตรียม Values (เช่น ["New Name", "081..."])
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1; // เริ่มนับ $1

        updates.forEach(key => {
            // แปลงชื่อ field ให้ตรงกับ DB
            const dbField = toSnakeCase(key);

            setClauses.push(`${dbField} = $${paramIndex}`); // ใส่ $1, $2...
            values.push(data[key as keyof UpdateAddressPayload]); // เก็บค่าจริง

            paramIndex++; // ขยับเลข index
        });

        // ประกอบร่าง SQL
        // values ตอนนี้มีครบตามจำนวน field แล้ว
        // แต่เราต้องเติม id และ userId เข้าไปใน values เพื่อใช้กับ WHERE
        values.push(id);
        values.push(userId);
        // Update 
        const sql = `
        UPDATE user_addresses 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
    `;
        const result = await client.query(sql, values);
        return result.rows[0];
    }
};