import { productRepository } from "../repositories/productRepository"

export const productService = {
    createProduct: async (data: any) => {
        // data หน้าตาประมาณนี้:
        // {
        //    product_name: "เสื้อเท่",
        //    description: "...",
        //    image_url: "...",
        //    category_id: 1,
        //    gender_id: 1,
        //    variants: [ { color_id: 1, size_id: 2, price: 500, stock_quantity: 10 }, ... ]
        // }

        // แยก header กับ variants ออกจากกัน
        const { variants, ...productInfo } = data;

        if (!variants || variants.length === 0) {
            throw new Error("Product must have at least one variant!");
        }

        return await productRepository.createProduct(productInfo, variants);
    },
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
    getAdminProducts: async () => {
        // เรียก Repo ตัวใหม่ที่เราเพิ่งคุยกัน
        const products = await productRepository.getAdminProducts();
        return products;
    },
    getAdminById: async (id: number) => {
        return await productRepository.getAdminById(id);
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
    },
    update: async (id: number, data: any) => {
        const { variants, ...productInfo } = data;

        if (!variants || variants.length === 0) {
            throw new Error("Product must have at least one variant!");
        }

        return await productRepository.updateProduct(id, productInfo, variants);
    }
}