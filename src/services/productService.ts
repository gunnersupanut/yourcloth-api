import { productRepository } from "../repositories/productRepository"
import { deleteFileFromCloudinary } from "../utils/cloudinary";

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

        // ดึงข้อมูลเก่าออกมาก่อน (
        const oldProduct = await productRepository.getAdminById(id);
        const oldFilePath = oldProduct?.file_path; // public_id เก่า

        // สั่ง Update ลง DB
        const result = await productRepository.updateProduct(id, productInfo, variants);

        // เช็ค: ถ้ามีการส่งรูปใหม่มา และ มันไม่ตรงกับรูปเก่า -> ลบรูปเก่าทิ้ง!
        // (ต้องเช็คว่ามี oldFilePath ด้วยนะ เดี๋ยวไปลบความว่างเปล่า)
        if (productInfo.file_path && oldFilePath && productInfo.file_path !== oldFilePath) {
            console.log("Image changed! Deleting old image...");

            // สั่งลบแล้วไม่ต้องรอ ไปทำอย่างอื่นต่อเลย
            deleteFileFromCloudinary(oldFilePath);
        }

        return result;
    },
    delete: async (id: number) => {
        // เรียก Repo ให้จัดการปิดสวิตช์ (Soft Delete)
        return await productRepository.deleteProduct(id);
    }
};