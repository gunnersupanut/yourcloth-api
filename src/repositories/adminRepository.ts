import pool from "../config/db";

export const adminRepository = {
    addNewAdmin: async (username: string, passwordHash: string, adminName?: string) => {
        const sql = `
            INSERT INTO admins (username, password_hash,admin_name)
            VALUES ($1, $2, $3)
        `;

        // เรียงตามลำดับ $1, $2...
        const values = [
            username,
            passwordHash,
            adminName || "Admin"
        ];
        await pool.query(sql, values);
    },
    findByUsernameWithPassword: async (username: string) => {
        const sql = `
        SELECT id, username, password_hash, admin_name
        FROM admins 
        WHERE username = $1
        `;
        const result = await pool.query(sql, [username]);
        return result.rows[0];
    },
}