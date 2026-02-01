import { NextFunction, Request, Response } from "express";
import { productService } from "../services/productService";
import { AppError } from "../utils/AppError";

export const createProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // รับข้อมูลจาก Body
        const result = await productService.createProduct(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}
export const getAllProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await productService.getAll();
        res.status(200).json({
            message: "Get All Product Complete.",
            result: result
        })
    } catch (error) {
        next(error);
    }
}
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
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const result = await productService.update(id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};


