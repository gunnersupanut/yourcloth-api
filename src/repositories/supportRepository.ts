import pool from "../config/db";

export interface ISupportTicketPayload {
    userId: number;
    topic: string;
    message: string;
}

export const supportRepository = {
    // User สร้าง Ticket ใหม่
    create: async (data: ISupportTicketPayload) => {
        const query = `
      INSERT INTO support_tickets (user_id, topic, message, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
      RETURNING *
    `;
        const values = [data.userId, data.topic, data.message];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    // Admin ดูรายการทั้งหมด (เรียงจากใหม่ไปเก่า)
    findAll: async () => {
        const query = `
      SELECT 
        t.*, 
        u.username, 
        u.email, 
        u.tel
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `;
        const { rows } = await pool.query(query);
        return rows;
    },
    // Admin อัปเดตสถานะ (เช่น เปลี่ยนเป็น RESOLVED)
    updateStatus: async (id: number, status: string, adminResponse?: string, resolverName?: string) => {
        const query = `
      UPDATE support_tickets 
      SET status = $2, admin_response = $3,resolver_name = $4, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const { rows } = await pool.query(query, [id, status, adminResponse, resolverName || null]);
        return rows[0];
    }
};