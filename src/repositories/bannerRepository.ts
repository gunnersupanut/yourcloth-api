import pool from "../config/db"; 
import { IBanner, ICreateBannerDTO, IUpdateBannerDTO } from "../type/bannerTypes";

export const bannerRepository = {
    // หาเฉพาะที่ Active
    findActiveBanners: async (): Promise<IBanner[]> => {
        const query = `
      SELECT * FROM banner 
      WHERE is_active = true 
      AND (start_date IS NULL OR start_date <= NOW()) 
      AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY sort_order ASC, created_at DESC
    `;
        const { rows } = await pool.query<IBanner>(query);
        return rows;
    },

    // หาหมด 
    findAllBanners: async (): Promise<IBanner[]> => {
        const query = `SELECT * FROM banner ORDER BY sort_order ASC, created_at DESC`;
        const { rows } = await pool.query<IBanner>(query);
        return rows;
    },

    // หาตัวเดียว
    findById: async (id: number): Promise<IBanner | null> => {
        const query = `SELECT * FROM banner WHERE id = $1`;
        const { rows } = await pool.query<IBanner>(query, [id]);
        return rows[0] || null;
    },

    // สร้าง
    create: async (data: ICreateBannerDTO): Promise<IBanner> => {
        const query = `
      INSERT INTO banner (title, image_url, is_active, sort_order, start_date, end_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            data.title || "",
            data.image_url,
            data.is_active ?? true,
            data.sort_order || 0,
            data.start_date || null,
            data.end_date || null,
        ];
        const { rows } = await pool.query<IBanner>(query, values);
        return rows[0];
    },

    // อัพเดต (Dynamic SQL)
    update: async (id: number, data: IUpdateBannerDTO): Promise<IBanner | null> => {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.title !== undefined) { fields.push(`title = $${index++}`); values.push(data.title); }
        if (data.image_url !== undefined) { fields.push(`image_url = $${index++}`); values.push(data.image_url); }
        if (data.is_active !== undefined) { fields.push(`is_active = $${index++}`); values.push(data.is_active); }
        if (data.sort_order !== undefined) { fields.push(`sort_order = $${index++}`); values.push(data.sort_order); }
        if (data.start_date !== undefined) { fields.push(`start_date = $${index++}`); values.push(data.start_date); }
        if (data.end_date !== undefined) { fields.push(`end_date = $${index++}`); values.push(data.end_date); }

        fields.push(`updated_at = NOW()`);

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
      UPDATE banner 
      SET ${fields.join(", ")} 
      WHERE id = $${index} 
      RETURNING *
    `;

        const { rows } = await pool.query<IBanner>(query, values);
        return rows[0];
    },

    // ลบ
    remove: async (id: number): Promise<void> => {
        const query = `DELETE FROM banner WHERE id = $1`;
        await pool.query(query, [id]);
    },
};