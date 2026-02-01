import { Request, Response, NextFunction } from "express";
import { masterRepository } from "../repositories/masterRepository";

export const masterController = {
    getMetadata: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // ยิงทีเดียวได้ทั้ง สี และ ไซส์ (ประหยัด Request)
            const [colors, sizes] = await Promise.all([
                masterRepository.getColors(),
                masterRepository.getSizes()
            ]);

            res.json({ success: true, colors, sizes });
        } catch (error) {
            next(error);
        }
    }
};