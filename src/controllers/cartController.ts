import { Request, Response } from "express";
import pool from "../config/db";
import { CustomJwtPayload } from "../type/jwt.type";
import { ParamsDictionary } from 'express-serve-static-core';
import { AppError } from '../utils/AppError';
import { cartService } from "../services/cartService";
import { DeleteSelectedCarts, UpdateCartItemParams, UpdateCartParams } from "../type/cart.typs";
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
    quantity: number;
    variantId: number;
}



export const updateCartController = async (req: Request<UpdateCartParams, unknown, updateCartBodyRequest>, res: Response) => {
    const userId = (req.user as CustomJwtPayload).id;
    const { quantity, variantId } = req.body
    const cartId = Number(req.params.cartId);
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be greater than 0.' })
    if (isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid Cart ID' });
    }
    if (!variantId) {
        return res.status(400).json({ error: 'Missing required fields (variantId).' });
    }
    try {
        // เตรียม payload
        const updateCartPayload: UpdateCartItemParams = {
            userId, variantId, cartId, quantity
        }
        // UpdateCart
        const updateCart = await cartService.updateCartItem(updateCartPayload);
        res.status(200).json({
            message: `Update cart ${cartId} complete.`,
            result: updateCart
        })
    } catch (error: any) {
        //  ดัก AppError ตัวเดียวจบ 
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                data: error.data
            });
        }

        // กรณี Database Error หรือ Code บัค
        console.error("Update Cart Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deleteCartController = async (req: Request<UpdateCartParams, unknown, updateCartBodyRequest>, res: Response) => {
    const userId = (req.user as CustomJwtPayload).id;
    const cartId = Number(req.params.cartId);
    // เช็คว่ามี CartId ไหม
    if (isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid Cart ID' });
    }
    try {
        // ลบ
        await cartService.deleteCart(cartId, userId);
        // ถ้าผ่าน
        res.status(200).json({ message: "Deleted successfully" });
        // ถ้า error
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                data: error.data
            });
        }
        console.error("Delete Cart Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deleteSelectedCartsController = async (req: Request<unknown, unknown, DeleteSelectedCarts>, res: Response) => {
    const userId = (req.user as CustomJwtPayload).id;
    const { cartIds } = req.body;
    console.log("Body Received:", req.body);
    // เช็คว่ามี CartId ไหม
    // Validate 
    if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({ error: "No items selected" });
    }
    try {
        const deletedItems = await cartService.deleteSelectedCarts(cartIds, userId);
        res.status(200).json({
            message: `Deleted ${deletedItems.length} items successfully`,
            deletedIds: deletedItems.map(i => i.id)
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                data: error.data
            });
        }
        console.error("Delete Selected Cart Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}