import { cartRepository } from "../repositories/cartRepository";
import { productService } from "./productService"
import { AppError } from '../utils/AppError';

export const cartService = {
    addToCart: async (userId: number, variantId: number, quantityToAdd: number) => {
        // ดึง stock จริง
        const realStock = await productService.getStock(variantId);
        // ดึงของในตะกร้าเดิม
        const currentCartItem = await cartRepository.findItem(userId, variantId);
        const currentQty = currentCartItem ? currentCartItem.quantity : 0;

        // เช็คว่าที่จะเพิ่ม + ในตะกร้า เกินสต็อกไหม
        if (currentQty + quantityToAdd > realStock) {
            throw new AppError(
                "Insufficient stock available.",
                409,
                {
                    availableStock: realStock,
                    currentInCart: currentQty,
                    requestQty: quantityToAdd
                }
            );
        }
        // ถ้าผ่านไปเพิ่มของ/สร้าง ตระกร้า
        const result = await cartRepository.createCart(userId, variantId, quantityToAdd);
        return result
    },
    getCartItem: async (userId: number) => {
        const cartItem = await cartRepository.getCartItem(userId);
        return cartItem
    }
};