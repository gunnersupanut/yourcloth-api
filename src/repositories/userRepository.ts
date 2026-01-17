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
    },
    addNewUser: async (data: CreateUserParams) => {
        const sql = `
            INSERT INTO users (username, password_hash, email, verification_token, verification_expires_at)
            VALUES ($1, $2, $3, $4, $5)
        `;

        // เรียงตามลำดับ $1, $2...
        const values = [
            data.username,
            data.password_hash,
            data.email,
            data.verification_token,
            data.verification_expires_at
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
    }
}