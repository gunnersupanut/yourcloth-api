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
    getCartItem: async (userId: number) => {
        const sql = `
        SELECT 
        ci.id AS cart_item_id,
        pd.id AS product_id,
        pv.id AS variant_id,
        pd.product_name,
        cl.name AS color,
        pv.price,
        si.name AS size,
        pd.description,
        pd.image_url,
        ci.quantity,
        pv.stock_quantity
        FROM cart_item as ci
        JOIN product_variants pv ON ci.product_variant_id = pv.id
        JOIN sizes si ON pv.size_id = si.id
        JOIN colors cl ON pv.color_id = cl.id
        JOIN products pd ON pv.product_id = pd.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at ASC
        `;
        const result = await pool.query(sql, [userId])
        return result.rows;
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