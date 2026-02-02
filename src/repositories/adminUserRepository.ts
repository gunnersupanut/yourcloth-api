import pool from '../config/db';

export const adminUserRepository = {
    // 1. ดึงรายชื่อลูกค้าทั้งหมด (ค้นหา + Pagination)
    getAllUsers: async (search: string, limit: number, offset: number) => {
        const searchTerm = `%${search}%`;

        // นับจำนวน (เฉพาะ users ที่ยังไม่ถูก Soft Delete)
        const countSql = `
            SELECT COUNT(*) 
            FROM users 
            WHERE 
                (username ILIKE $1 OR email ILIKE $1 OR name ILIKE $1 OR surname ILIKE $1 OR tel ILIKE $1)
                AND deleted_at IS NULL
        `;
        const countResult = await pool.query(countSql, [searchTerm]);
        const totalCount = parseInt(countResult.rows[0].count);

        // ดึงข้อมูล (ตัด field role ออก เพราะไม่มี/ไม่ได้ใช้)
        const sql = `
            SELECT 
                id, username, email, name, surname, tel, is_active, 
                created_at, last_login, is_verify
            FROM users
            WHERE 
                (username ILIKE $1 OR email ILIKE $1 OR name ILIKE $1 OR surname ILIKE $1 OR tel ILIKE $1)
                 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(sql, [searchTerm, limit, offset]);

        return {
            users: result.rows,
            total: totalCount
        };
    },

    // 2. ดึงรายละเอียดลูกค้าคนเดียว
    getUserById: async (userId: number) => {
        const sql = `
            SELECT id, username, email, name, surname, tel, is_active, is_verify, created_at, last_login
            FROM users
            WHERE id = $1
        `;
        const result = await pool.query(sql, [userId]);
        return result.rows[0];
    },

    // 3. แบน / ปลดแบน (เปลี่ยน is_active)
    toggleUserStatus: async (userId: number, isActive: boolean) => {
        const sql = `
            UPDATE users 
            SET is_active = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, is_active, username
        `;
        const result = await pool.query(sql, [isActive, userId]);
        return result.rows[0];
    }
};