import pool from "../config/db";

export const productRepository = {
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
                ) AS available_colors_name
                 
                FROM products AS pd 
                LEFT JOIN categories AS c ON pd.category_id = c.id
                LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
                GROUP BY 
                pd.id, c.name
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
        LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
        WHERE pd.id = $1
        GROUP BY 
        pd.id, c.name
        ORDER BY pd.id ASC;
        `;
        const result = await pool.query(sql, [product_id])
        return result.rows[0];
    }
}