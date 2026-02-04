import { productRepository } from "../repositories/productRepository"
import { IProductParams } from "../type/productTypes";
import { deleteFileFromCloudinary } from "../utils/cloudinary";

export const productService = {
    createProduct: async (data: any) => {
        // แยก variants ออกมา ส่วนที่เหลือคือข้อมูลสินค้า + Gallery
        const { variants, ...productInfo } = data;

        if (!variants || variants.length === 0) {
            throw new Error("Product must have at least one variant!");
        }

        return await productRepository.createProduct(productInfo, variants);
    },

    update: async (id: number, data: any) => {
        const { variants, ...productInfo } = data;

        // 1ดึงข้อมูลเก่า (เพื่อเอา file_path ของรูปปกเดิม)
        const oldProduct = await productRepository.getAdminById(id);
        const oldFilePath = oldProduct?.file_path; // public_id ของรูปปกเก่า

        // สั่ง Update ลง DB & Gallery 
        // (Repo จะจัดการลบรูป Gallery เก่าทิ้งให้เอง ตาม Logic ที่เราเขียนไว้)
        const result = await productRepository.updateProduct(id, productInfo, variants);

        // จัดการรูปปก
        // เช็ค: ถ้ามีการส่งรูปใหม่มา (file_path เปลี่ยน) และมีรูปเก่าอยู่ -> ลบรูปเก่าทิ้ง!
        if (productInfo.file_path && oldFilePath && productInfo.file_path !== oldFilePath) {
            console.log(`Main image changed! Deleting old image [${oldFilePath}]...`);
            await deleteFileFromCloudinary(oldFilePath, 'image');
        }

        return result;
    },
    getStock: async (product_variant_id: number) => {
        const stock = await productRepository.getStockQuantity(product_variant_id);
        return stock;
    },
    getAllProducts: async (filters: IProductParams) => {
        return await productRepository.getAllProducts(filters);
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
    delete: async (id: number) => {
        // เรียก Repo ให้จัดการปิดสวิตช์ (Soft Delete)
        return await productRepository.deleteProduct(id);
    }
};