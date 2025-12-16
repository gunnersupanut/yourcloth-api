import { Request, Response } from "express";
import pool from "../config/db";
import { CustomJwtPayload } from "../type/jwt.type";
import { ParamsDictionary } from 'express-serve-static-core';
interface addCartRequest {
    product_variant_id: number;
    quantity: number;
}
export const addCartController = async (req: Request<unknown, unknown, addCartRequest>, res: Response) => {
    const { product_variant_id, quantity, } = req.body
    const userId = (req.user as CustomJwtPayload).id;

    // เช็คค่าจาก body
    if (!product_variant_id) {
        return res.status(400).json({ error: 'product_variant_id is required.' });
    }
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'quantity must be greater than 0.' });
    }
    try {

        // --- เช็ค Stock
        const stockSql = 'SELECT stock_quantity FROM product_variants WHERE id = $1';
        const stockResult = await pool.query(stockSql, [product_variant_id]);
        // ถ้า product variant ไม่มี
        if (stockResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product variant not found.' });
        }
        const realStock: number = stockResult.rows[0].stock_quantity;
        // ดูของในตระกร้าเดิม
        const cartSql = `SELECT quantity FROM cart_item WHERE user_id = $1 AND product_variant_id = $2`
        const cartResult = await pool.query(cartSql, [userId, product_variant_id])

        // ของในตระกร้าเดิม
        const currentCartQty: number = cartResult.rows.length > 0 ? cartResult.rows[0].quantity : 0

        // เช็คว่าของเกินที่มีไหม
        if ((currentCartQty + quantity) > realStock) {
            return res.status(400).json({
                error: `Stock not sufficient!`,
                message: `You already have ${currentCartQty} in cart, and stock only has ${realStock}.`
            })
        }

        // --- INSERT
        const insertSql = `
        INSERT INTO cart_item(user_id, product_variant_id, quantity)
        VALUES($1,$2,$3)
        ON CONFLICT (user_id, product_variant_id) 
        DO UPDATE SET 
      quantity = cart_item.quantity + EXCLUDED.quantity;
        `;
        await pool.query(insertSql, [userId, product_variant_id, quantity])
        res.status(201).json({ message: "Add Product to cart complete." })
    } catch (error: any) {
        if (error.code !== '23505' && error.code) { // ถ้า Error... แต่ "ไม่ใช่" 23505...
            console.log(`[Add Product to cart error]`, error);
            return res.status(500).json({ error: "Add Product to cart fail." });
        }

        // ถ้ามัน 23505 ซึ่งมันไม่ควรจะเกิด ถ้าใช้ ON CONFLICT )
        // หรือถ้า Error อย่างอื่น...
        console.log(`[Add Product to cart error] Unknown error:`, error);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
}


export const getCartController = async (req: Request, res: Response) => {
    const userId = (req.user as CustomJwtPayload).id;

    try {
        // --- Get Sql
        const getCartSql = `
        SELECT 
        ci.id,
        pd.product_name,
        cl.name AS color,
        pd.price,
        si.name AS size,
        pd.description,
        pd.image_url,
        ci.quantity
        FROM cart_item as ci
        JOIN product_variants pv ON ci.product_variant_id = pv.id
        JOIN sizes si ON pv.size_id = si.id
        JOIN colors cl ON pv.color_id = cl.id
        JOIN products pd ON pv.product_id = pd.id
        WHERE ci.user_id = $1
        `;
        const result = await pool.query(getCartSql, [userId])
        if (result.rows.length <= 0) return res.status(200).json({ message: "You don't Have item in cart", result: [] })
        res.status(200).json({
            message: "Get cart product complete.",
            result: result.rows
        })
    } catch (error: any) {
        if (error instanceof Error) {
            console.error('[Get Cart Error]:', error.message);
        } else {
            console.error('[Get Cart Error]: Unknown error', error);
        }
        res.status(500).json({ error: "Get cart product fail." });
    }
}

interface updateCartBodyRequest {
    quantity: number
}

export interface updateCartParamsRequest extends ParamsDictionary {
    cartId: string;
}

export const updateCartController = async (req: Request<updateCartParamsRequest, unknown, updateCartBodyRequest>, res: Response) => {
    const { cartId } = req.params
    const userId = (req.user as CustomJwtPayload).id;
    const { quantity } = req.body
    // แปลง cartId เป็น number
    const cartIdAsNumber = parseInt(cartId, 10);
    if (isNaN(cartIdAsNumber)) {
        return res.status(400).json({ error: 'Cart ID must be a number' });
    }
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be greater than 0.' })
    try {
        // --- เช็ค Stock
        const stockSql = `
        SELECT stock_quantity 
        FROM product_variants pv 
        JOIN cart_item ci ON ci.product_variant_id = pv.id
        WHERE ci.id = $1 AND ci.user_id = $2
        `;
        const stockResult = await pool.query(stockSql, [cartIdAsNumber, userId]);
        // ถ้า product variant ไม่มี
        if (stockResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }
        const realStock: number = stockResult.rows[0].stock_quantity;
        // --ถ้าจำนวนใหม่มากกว่าของใน Stock
        if (quantity > realStock) return res.status(400).json({ error: 'Stock not sufficient.' })
        // --- Update Sql
        const updateCartSql = `
        UPDATE cart_item 
        SET quantity = $1
        WHERE id = $2 AND user_id = $3
            `;
        await pool.query(updateCartSql, [quantity, cartIdAsNumber, userId])
        res.status(200).json({
            message: `Update cart ${cartId} complete.`,
        })
    } catch (error: any) {
        // เช็คว่า เป็น Error Object ไหม
        if (error instanceof Error) {
            console.error('[Update cart Error]:', error.message);
        } else {
            console.error('[Update cart Error]: Unknown error', error);
        }
        res.status(500).json({ error: "Update cart product fail." });
    }
}

export const deleteCartController = async (req: Request<updateCartParamsRequest, unknown, updateCartBodyRequest>, res: Response) => {
    const { cartId } = req.params
    const userId = (req.user as CustomJwtPayload).id;
}