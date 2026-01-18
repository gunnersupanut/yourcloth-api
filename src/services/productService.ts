import { productRepository } from "../repositories/productRepository"

export const productService = {
    getStock: async (product_variant_id: number) => {
        const stock = await productRepository.getStockQuantity(product_variant_id);
        return stock;
    },
    getAll: async () => {
        return await productRepository.getAllProduct();
    },
    getById: async (product_id: number) => {
        const result = await productRepository.getById(product_id)
        if (!result) throw new Error("product_not_found");
        return result
    },
    validateCheckoutItems: async (variantIds: number[]) => {
        if (!variantIds || variantIds.length === 0) {
            return [];
        }
        const rawProducts = await productRepository.getBulkByVariantIds(variantIds);

        const formattedProducts = rawProducts.map((p: any) => ({
            id: p.id,
            name: p.product_name,
            description: p.description,
            price: Number(p.price),
            stock: p.stock_quantity,
            image: p.image_url,
            size: p.size,
            color: p.color
        }));

        return formattedProducts
    }
}