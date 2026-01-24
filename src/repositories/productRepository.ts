import pool from "../config/db";
import { PoolClient } from 'pg';
export const productRepository = {
    getStockQuantity: async (product_variant_id: number) => {
        const sql =
            'SELECT stock_quantity FROM product_variants WHERE id = $1';

        const result = await pool.query(sql, [product_variant_id])
        if (result.rows.length === 0) {
            return 0;
        }
        return result.rows[0].stock_quantity;
    },
    getAllProduct: async () => {
        const sql =
            `
                SELECT
                pd.id, 
                pd.product_name, 
                MIN(pv.price) AS price,
                pd.description, 
                pd.image_url,
                c.name AS category,
                gd.name AS gender,
                 (
            SELECT JSON_AGG(
            json_build_object(
            'name', sub.name, 
            'code', sub.hex_code
            )
            )
            FROM (
            SELECT DISTINCT cl.name, cl.hex_code
            FROM product_variants pv
            JOIN colors AS cl ON pv.color_id = cl.id
            WHERE pv.product_id = pd.id
            ) sub
            ) AS available_colors,
                (
                SELECT JSON_AGG(DISTINCT si.name)
                FROM product_variants pv
                JOIN sizes AS si ON pv.size_id = si.id
                WHERE pv.product_id = pd.id 
                ) AS available_sizes  
                FROM products AS pd 
                LEFT JOIN categories AS c ON pd.category_id = c.id
                LEFT JOIN genders AS gd ON pd.gender_id = gd.id
                LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
                GROUP BY 
                pd.id, c.name, gd.name
                ORDER BY pd.id ASC;
                `;

        const result = await pool.query(sql)
        return result.rows;
    },
    getById: async (product_id: number) => {
        const sql =
            `
        SELECT
        pd.id, 
        pd.product_name, 
        MIN(pv.price) AS price,
        pd.description, 
        pd.image_url,
        c.name AS category,
        gd.name AS gender,
        (
        SELECT JSON_AGG(
        json_build_object(
        'name', sub.name, 
        'code', sub.hex_code
        )
        )
        FROM (
        SELECT DISTINCT cl.name, cl.hex_code
        FROM product_variants pv
        JOIN colors AS cl ON pv.color_id = cl.id
        WHERE pv.product_id = pd.id
        ) sub
        ) AS available_colors,
        (
        SELECT JSON_AGG(DISTINCT si.name)
        FROM product_variants pv
        JOIN sizes AS si ON pv.size_id = si.id
        WHERE pv.product_id = pd.id 
        ) AS available_sizes,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'variant_id', v.id,
              'color_name', col.name,
              'color_code', col.hex_code,
              'size', sz.name,
              'price', v.price,
              'stock', v.stock_quantity 
            ) ORDER BY v.id ASC
          )
        FROM product_variants v
          JOIN colors col ON v.color_id = col.id
          JOIN sizes sz ON v.size_id = sz.id
          WHERE v.product_id = pd.id
        ) AS variants
        FROM products AS pd 
        LEFT JOIN categories AS c ON pd.category_id = c.id
        LEFT JOIN genders AS gd ON pd.gender_id = gd.id
        LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
        WHERE pd.id = $1
        GROUP BY 
        pd.id, c.name, gd.name
        ORDER BY pd.id ASC;
        `;
        const result = await pool.query(sql, [product_id])
        return result.rows[0];
    },
    getBulkByVariantIds: async (variantIds: number[]) => {
        const sql = `
        SELECT 
            v.id,
            v.price,
            v.stock_quantity,
            p.description,
            p.product_name,
            p.image_url,
            s.name AS size,
            c.name AS color
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN sizes s ON v.size_id = s.id
        LEFT JOIN colors c ON v.color_id = c.id
        WHERE v.id = ANY($1)
    `;
        const result = await pool.query(sql, [variantIds]);
        return result.rows;
    },
    decreaseStock: async (items: any[], client: PoolClient) => {
        // ถ้าไม่มีของให้ตัด 
        if (items.length === 0) return;

        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;

        // วนลูปเตรียม(Values List)
        items.forEach((item) => {
            // item ต้องมี variantId และ quantity
            // สร้างคู่ ($1, $2) ::int เพื่อบอก DB ว่าเป็นตัวเลขแน่ๆ 
            placeholders.push(`($${paramIndex}::int, $${paramIndex + 1}::int)`);

            values.push(item.variantId, item.quantity);

            paramIndex += 2;
        });

        // อัปเดตตาราง product_variants (v)
        // โดยให้ stock_quantity = stock เดิม - quantity ที่ส่งมา (t.quantity)
        // จากข้อมูลใน VALUES (t) ที่มีคอลัมน์ชื่อ id และ quantity
        // โดยจับคู่ที่ v.id ตรงกับ t.id
        const sql = `
            UPDATE product_variants AS v
            SET stock_quantity = v.stock_quantity - t.quantity
            FROM (VALUES ${placeholders.join(', ')}) AS t(id, quantity)
            WHERE v.id = t.id
        `;

        // ตัดสต็อกรวดเดียว
        await client.query(sql, values);
    }
}