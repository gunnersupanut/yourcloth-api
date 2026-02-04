import { NextFunction, Request, Response } from "express";
import { productService } from "../services/productService";
import { AppError } from "../utils/AppError";

export const createProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.createProduct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
}
export const getAllProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page,
            limit,
            search,
            category,
            gender,
            size,
            sort,
            minPrice,
            maxPrice
        } = req.query;
        const filters = {
            page: page ? parseInt(page as string) : 1,          // ถ้าไม่ส่งมา เอาหน้า 1
            limit: limit ? parseInt(limit as string) : 12,      // ถ้าไม่ส่งมา เอา 12 ชิ้น
            search: search as string,                           // String อยู่แล้ว
            category: category as string,
            gender: gender as string,
            size: size as string,
            sort: sort as string,
            minPrice: minPrice ? parseInt(minPrice as string) : undefined, // แปลงเป็น int
            maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined, // แปลงเป็น int
        };

        // เรียกใช้ Service
        const result = await productService.getAllProducts(filters);

        res.status(200).json({
            success: true,
            data: result.products,      // รายการสินค้า
            pagination: {               // ข้อมูลหน้ากระดาษ (Frontend เอาไปทำปุ่ม Next/Prev)
                total: result.total,
                currentPage: result.currentPage,
                totalPages: result.totalPages,
            }
        });

    } catch (error) {
        next(error); // ส่ง Error ให้ Middleware จัดการ
    }
}
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);

        // เช็คก่อนว่า ID เป็นตัวเลขจริงๆ ไหม (กัน Error ประหลาด)
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "Invalid Product ID" });
            return; // ต้อง return เพื่อจบ function
        }

        // โยน req.body ไปให้ Service ทั้งก้อนเลย 
        // (ในนั้นมี variants, deleted_gallery_ids, new_gallery ครบแล้ว จากที่ frontend ส่งมา)
        const result = await productService.update(id, req.body);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};
export const getAdminProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await productService.getAdminById(id);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
interface getProductReq {
    id: number;
}

export const getProductController = async (req: Request<getProductReq>, res: Response) => {
    const { id } = req.params;
    // แปลงเป็น number (params มาเป็น string เสมอ)
    const productId = Number(id);
    if (!productId) return res.status(400).json({ message: "Invalid Product ID" })
    try {
        const result = await productService.getById(productId)

        // ถ้าไม่มีข้อมูลใน DB
        res.status(200).json({
            message: `Get Product ${productId} Complete.`,
            result: result
        })
    } catch (error: any) {
        if (error.message === "product_not_found") {
            return res.status(404).json({ error: `Product with ID ${productId} not found` });
        }
        console.error(`[Get Product ${productId}] Error:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
interface getCheckoutValidationReq {
    variantIds: number
}
export const getCheckoutValidation = async (req: Request<unknown, unknown, getCheckoutValidationReq>, res: Response) => {
    try {
        const { variantIds } = req.body;

        if (!Array.isArray(variantIds)) {
            throw new AppError("Invalid payload: variantIds must be an array", 400);
        }

        const products = await productService.validateCheckoutItems(variantIds);

        res.status(200).json({
            message: "Product validation successful",
            data: products
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
};
export const getAdminProductsContoller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await productService.getAdminProducts();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);

        // Validate ID นิดนึง กันพวกยิงมั่ว
        if (isNaN(id)) {
            throw new Error("Invalid Product ID");
        }

        const result = await productService.delete(id);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
}

