import pool from '../config/db';
import { createResetPasswordTokenParams, CreateUserParams, resetPasswordReq, updateTokenParams } from '../type/userType';

export const userRepository = {
    findByUsername: async (username: string) => {
        const sql = `
        SELECT id,email
        FROM users
        WHERE username = $1
        `
        const result = await pool.query(sql, [username]);
        return result.rows[0];
    },
    findByEmail: async (email: string) => {
        const sql = `
        SELECT id, username, is_verify
        FROM users
        WHERE email = $1
        `
        const result = await pool.query(sql, [email]);
        return result.rows[0];
    },
    findByUsernameWithPassword: async (username: string) => {
        const sql = `
        SELECT id, username, email, password_hash, is_active, is_verify, deleted_at
        FROM users 
        WHERE username = $1
        `;
        const result = await pool.query(sql, [username]);
        return result.rows[0];
    },
    findByVerificationToken: async (token: string) => {
        const sql = `
            SELECT id, is_verify, verification_expires_at FROM users 
            WHERE verification_token = $1
        `;
        const result = await pool.query(sql, [token]);
        return result.rows[0];
    },
    findByResetToken: async (token: string) => {
        const sql = `
        SELECT id, reset_password_expires_at FROM users 
        WHERE reset_password_token = $1
    `;
        const result = await pool.query(sql, [token]);
        return result.rows[0];
    }, findUserById: async (userId: number) => {
        const sql = `
            SELECT id, password_hash 
            FROM users 
            WHERE id = $1
        `;
        const result = await pool.query(sql, [userId]);
        return result.rows[0];
    },

    //  อัปเดต Password ใหม่
    updatePasswordByUserId: async (userId: number, newHash: string) => {
        const sql = `
            UPDATE users 
            SET password_hash = $1, updated_at = NOW() 
            WHERE id = $2
        `;
        await pool.query(sql, [newHash, userId]);
        return true; // ส่งกลับว่าสำเร็จ
    },
    // addNewUser: async (data: CreateUserParams) => {
    //     const sql = `
    //         INSERT INTO users (username, password_hash, email, verification_token, verification_expires_at)
    //         VALUES ($1, $2, $3, $4, $5)
    //     `;

    //     // เรียงตามลำดับ $1, $2...
    //     const values = [
    //         data.username,
    //         data.password_hash,
    //         data.email,
    //         data.verification_token,
    //         data.verification_expires_at
    //     ];
    //     await pool.query(sql, values);
    // },
    addNewUser: async (data: CreateUserParams) => {
        const sql = `
            INSERT INTO users (username, password_hash, email, is_verify)
            VALUES ($1, $2, $3, true)
        `;

        // เรียงตามลำดับ $1, $2...
        const values = [
            data.username,
            data.password_hash,
            data.email,
        ];
        await pool.query(sql, values);
    },
    createResetPasswordToken: async (data: createResetPasswordTokenParams) => {
        const sql = `
          UPDATE users 
           SET 
            reset_password_token = $1,
            reset_password_expires_at = $2
        WHERE email = $3
        `
        const values = [
            data.reset_password_token,
            data.reset_password_expires_at,
            data.email
        ];
        await pool.query(sql, values);
    },
    updatePassword: async (data: resetPasswordReq) => {
        const sql = `
           UPDATE users 
        SET 
            password_hash = $1,
            reset_password_token = NULL,     
            reset_password_expires_at = NULL  
        WHERE reset_password_token = $2
        `;
        const values = [
            data.password, data.token
        ];
        await pool.query(sql, values);
    },
    updateLastLogin: async (userId: number) => {
        // ยิง Update เวลาปัจจุบัน (NOW())
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
    },
    updateToken: async (data: updateTokenParams) => {
        const sql = `
           UPDATE users 
        SET 
            verification_token = $1,
            verification_expires_at = $2
        WHERE email = $3
        `;
        const values = [
            data.verification_token,
            data.verification_expires_at,
            data.email
        ];
        await pool.query(sql, values);
    },
    verifyUser: async (id: number) => {
        const sql = `UPDATE users
        SET is_verify = true,
            verification_token = NULL,    
            verification_expires_at = NULL
        WHERE id = $1
        `;
        await pool.query(sql, [id]);
    }, getUserProfile: async (userId: number) => {
        const sql = `
            SELECT 
                id, 
                username, 
                email, 
                name, 
                surname, 
                tel, 
                birthday, 
                gender
            FROM users 
            WHERE id = $1 AND is_active = true
        `;
        const result = await pool.query(sql, [userId]);
        return result.rows[0];
    },

    // อัปเดตข้อมูล Profile (ไม่รวม Password / Email)
    updateUserProfile: async (userId: number, data: any) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const sql = `
                UPDATE users 
                SET 
                    name = $1, 
                    surname = $2, 
                    tel = $3, 
                    birthday = $4, 
                    gender = $5,
                    updated_at = NOW()
                WHERE id = $6
                RETURNING id, name, surname, tel, birthday, gender
            `;

            const values = [
                data.name,
                data.surname,
                data.tel,
                data.birthday, // ส่งเป็น String 'YYYY-MM-DD' หรือ Date Object ก็ได้ pg จัดการให้
                data.gender,   // ต้องตรงกับ ENUM ใน DB (Male, Female, Non binary)
                userId
            ];

            const result = await client.query(sql, values);

            await client.query('COMMIT');
            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    softDeleteUser: async (userId: number) => {
        const sql = `
            UPDATE users 
            SET 
                deleted_at = NOW(), 
                is_active = false,
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id
        `;
        const result = await pool.query(sql, [userId]);
        return result; // ส่งกลับ true ถ้าลบสำเร็จ
    }
}