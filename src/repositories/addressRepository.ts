import pool from "../config/db";
import { Pool, PoolClient } from 'pg';
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
    }
};