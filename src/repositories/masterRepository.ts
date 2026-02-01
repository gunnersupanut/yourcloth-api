import pool from "../config/db";

export const masterRepository = {
    getColors: async () => {
        // เรียงตาม ID หรือ Name ก็ได้
        const result = await pool.query('SELECT id, name, hex_code AS code FROM colors ORDER BY id ASC');
        return result.rows;
    },
    getSizes: async () => {
        const result = await pool.query('SELECT id, name FROM sizes ORDER BY id ASC');
        return result.rows;
    }
};