import { Request, Response } from "express";
import { productService } from "../services/productService";


export const getAllProductController = async (req: Request, res: Response) => {
    try {
        const result = await productService.getAll();
        res.status(200).json({
            message: "Get All Product Complete.",
            result: result
        })
    } catch (error) {
        // เช็คมันคือ Error Object ไหม
        if (error instanceof Error) {
            console.log('[Get All Product] Error:', error)
        } else {
            // ถ้ามันเป็นอย่างอื่นที่โยนมา
            console.error('[Get All Product]: Unknown error', error);
        }

        res.status(500).json({ error: "Get All Product Fail." })
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

