import { verify } from 'crypto';
import pool from '../config/db';
import { CreateUserParams, RegisterRequestBody } from '../type/user.type';

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
        SELECT id,username
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
    addNewUser: async (data: CreateUserParams) => {
        const sql = `
            INSERT INTO users (username, password_hash, email, verification_token, verification_expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email
        `;

        // เรียงตามลำดับ $1, $2...
        const values = [
            data.username,
            data.password_hash,
            data.email,
            data.verification_token,
            data.verification_expires_at
        ];

        const result = await pool.query(sql, values);
        return result.rows[0];
    },
    verifyUser: async (id: number) => {
        const sql = `UPDATE users
        SET is_verify = true,
            verification_token = NULL,    
            verification_expires_at = NULL
        WHERE id = $1
        RETURNING id, username, email, is_verify
        `;
        const result = await pool.query(sql, [id]);
        return result.rows[0];
    }
}