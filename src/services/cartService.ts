import { cartRepository } from "../repositories/cartRepository";
import { productService } from "./productService"
import { AppError } from '../utils/AppError';
import { UpdateCartItemParams, ValidateStockParams } from "../type/cart.typs";

export const cartService = {
    validateStockAvailability: async (payload: ValidateStockParams) => {
        // ดึง Stock จริง
        const realStock = await productService.getStock(payload.variantId);

        // ดึงของเดิมในตะกร้า (ถ้าต้องเช็คแบบสะสม)
        let currentInCart = 0;
        if (payload.isAccumulate) {
            const currentCartItem = await cartRepository.findItem(payload.userId, payload.variantId);
            currentInCart = currentCartItem ? currentCartItem.quantity : 0;
        }

        // คำนวณยอดรวมที่ต้องการ
        const totalRequired = payload.isAccumulate ? (currentInCart + payload.quantityRequest) : payload.quantityRequest;

        // เช็คว่าที่จะเพิ่ม + ในตะกร้า เกินสต็อกไหม
        if (totalRequired > realStock) {
            throw new AppError(
                "Insufficient stock available.",
                409,
                {
                    availableStock: realStock,
                    currentInCart: currentInCart,
                    requestQty: payload.quantityRequest,
                    totalRequired: totalRequired
                }
            );
        }

        // ถ้าผ่าน
        return true;
    },
    addToCart: async (userId: number, variantId: number, quantityToAdd: number) => {
        const ValidatePayload: ValidateStockParams = {
            userId, variantId, quantityRequest: quantityToAdd, isAccumulate: true
        }
        // เช็ค stock 
        await cartService.validateStockAvailability(ValidatePayload);
        // ถ้าผ่านไปเพิ่มของ/สร้าง ตระกร้า
        const result = await cartRepository.createCart(userId, variantId, quantityToAdd);
        return result
    },
    getCartItem: async (userId: number) => {
        const cartItem = await cartRepository.getCartItem(userId);
        return cartItem
    },
    updateCartItem: async ({ userId, variantId, cartId, quantity }: UpdateCartItemParams) => {
        const ValidatePayload: ValidateStockParams = {
            userId, variantId, quantityRequest: quantity, isAccumulate: false
        }
        // เช็ค stock 
        await cartService.validateStockAvailability(ValidatePayload);

        // ถ้าผ่าน
        const result = await cartRepository.updateCart(quantity, cartId, userId, variantId);
        if (result.rows.length === 0) throw new AppError("Cart item not found or unauthorized", 404);
        return result.rows[0];
    },
    deleteCart: async (cartId: number, userId: number) => {
        const deletedItem = await cartRepository.deleteCartItem(cartId, userId);

        if (!deletedItem) {
            throw new AppError("Item not found or unauthorized", 404);
        }

        return deletedItem;
    },
    deleteSelectedCarts: async (cartIds: number[], userId: number) => {
        // ถ้าส่งมาเปล่าๆ จบการทำงาน
        if (cartIds.length === 0) return []; 
        return await cartRepository.deleteCartItemsBulk(cartIds, userId);
    }
};