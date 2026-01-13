import pool from "../config/db";

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
                    SELECT JSON_AGG(DISTINCT cl.hex_code) 
                    FROM product_variants pv
                    JOIN colors AS cl ON pv.color_id = cl.id
                    WHERE pv.product_id = pd.id 
                ) AS available_colors_code,     
                 (
                    SELECT JSON_AGG(DISTINCT cl.name) 
                    FROM product_variants pv
                    JOIN colors AS cl ON pv.color_id = cl.id
                    WHERE pv.product_id = pd.id 
                ) AS available_colors_name,
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
        SELECT JSON_AGG(DISTINCT cl.hex_code) 
        FROM product_variants pv
        JOIN colors AS cl ON pv.color_id = cl.id
        WHERE pv.product_id = pd.id 
        ) AS available_colors_code,     
        (
        SELECT JSON_AGG(DISTINCT cl.name) 
        FROM product_variants pv
        JOIN colors AS cl ON pv.color_id = cl.id
        WHERE pv.product_id = pd.id 
        ) AS available_colors_name,
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
    }
}