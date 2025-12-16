import { Request, Response } from "express";
import pool from "../config/db";

export const getAllProductController = async (req: Request, res: Response) => {
    try {
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
        res.status(200).json({
            message: "Get All Product Complete.",
            result: result.rows
        })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.log('[Get All Product] Error:', error)
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error('[Get All Product]: Unknown error', error);
        }

        res.status(500).json({ error: "Get All Product Fail." })
    }
}

export const getProductController = async (req: Request, res: Response) => {
    const productId = req.params.id
    try {
        const sql =
            `
        SELECT
        pd.product_name, 
        pd.price, 
        pd.description, 
        pd.image_url,
        c.name AS category,
        (
            SELECT JSON_AGG(DISTINCT cl.name) 
            FROM product_variants pv
            JOIN colors cl ON pv.color_id = cl.id
            WHERE pv.product_id = pd.id 
        ) AS available_colors,
          (
            SELECT JSON_AGG(DISTINCT si.name) 
            FROM product_variants pv
            JOIN sizes si ON pv.size_id = si.id
            WHERE pv.product_id = pd.id 
        ) AS available_sizes

        FROM products AS pd 
        LEFT JOIN categories AS c ON pd.category_id = c.id
        WHERE pd.id = $1
        GROUP BY 
        pd.id, c.name
        ORDER BY pd.id ASC;
        `;
        const result = await pool.query(sql, [productId])

        // ถ้าไม่มีข้อมูลใน DB
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Product with ID ${productId} not found` });
        }
        res.status(200).json({
            message: `Get Product ${productId} Complete.`,
            result: result.rows[0]
        })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.log(`[Get Product  ${productId} ] Error:`, error)
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error(`[Get Product ${productId} ] Error:`, error);
        }

        res.status(500).json({ error: `[Get Product ${productId}] Error:` })
    }
}

