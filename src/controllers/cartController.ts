import { Request, Response } from "express";
import pool from "../config/db";
import { CustomJwtPayload } from "../type/jwt.type";
import { ParamsDictionary } from 'express-serve-static-core';
import { AppError } from '../utils/AppError';
import { cartService } from "../services/cartService";
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
        const result = await cartService.addToCart(userId, product_variant_id, quantity);
        res.status(201).json({ message: "Add Product to cart complete.", result: result })
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                data: error.data
            });
        }
        // กรณี Error อื่นๆ ที่เราไม่ได้ตั้งใจ (เช่น Database ล่ม)
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const getCartController = async (req: Request, res: Response) => {
    const userId = (req.user as CustomJwtPayload).id;

    try {
        const result = await cartService.getCartItem(userId);
        res.status(200).json({
            message: "Get cart product complete.",
            result: result
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
        // // --- เช็ค Stock

        // const stockSql = `
        // SELECT stock_quantity 
        // FROM product_variants pv 
        // JOIN cart_item ci ON ci.product_variant_id = pv.id
        // WHERE ci.id = $1 AND ci.user_id = $2
        // `;
        // const stockResult = await pool.query(stockSql, [cartIdAsNumber, userId]);
        // // ถ้า product variant ไม่มี
        // if (stockResult.rows.length === 0) {
        //     return res.status(404).json({ error: 'Cart item not found.' });
        // }
        // const realStock: number = stockResult.rows[0].stock_quantity;
        // // --ถ้าจำนวนใหม่มากกว่าของใน Stock
        // if (quantity > realStock) return res.status(400).json({ error: 'Stock not sufficient.' })
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
        // แก้ด้วยตอนทำ update
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                data: error.data
            });
        }
        // กรณี Error อื่นๆ ที่เราไม่ได้ตั้งใจ (เช่น Database ล่ม)
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deleteCartController = async (req: Request<updateCartParamsRequest, unknown, updateCartBodyRequest>, res: Response) => {
    const { cartId } = req.params
    const userId = (req.user as CustomJwtPayload).id;
}