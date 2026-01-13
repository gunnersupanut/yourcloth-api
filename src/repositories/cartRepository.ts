import pool from "../config/db";
export const cartRepository = {
    findItem: async (userId: number, variantId: number) => {
        // หา item ในตาราง cart_items ที่อยู่ในตะกร้าของ user ? และสินค้า ?
        const sql = `
        SELECT id, quantity 
        FROM cart_item 
        WHERE user_id = $1 AND product_variant_id = $2
    `;
        const result = await pool.query(sql, [userId, variantId]);
        return result.rows[0];
    },
    createCart: async (userId: number, variantId: number, quantityToAdd: number) => {
        const sql = `
        INSERT INTO cart_item(user_id, product_variant_id, quantity)
        VALUES($1,$2,$3)
        ON CONFLICT (user_id, product_variant_id) 
        DO UPDATE SET 
      quantity = cart_item.quantity + EXCLUDED.quantity
      RETURNING *;
    `;
        const result = await pool.query(sql, [userId, variantId, quantityToAdd]);
        return result.rows[0];
    },
}