import { productRepository } from "../repositories/productRepository"

export const productService = {
    getAll: async () => {
        return await productRepository.getAllProduct();
    },
    getById: async (product_id: number) => {
        const result = await productRepository.getById(product_id)
        if (!result) throw new Error("product_not_found");
        return result
    }
}