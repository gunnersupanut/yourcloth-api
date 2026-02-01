import { Request, Response, NextFunction } from "express";
import { masterRepository } from "../repositories/masterRepository";

export const masterController = {
    getMetadata: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // ยิงทีเดียวได้ทั้ง สี และ ไซส์ (ประหยัด Request)
            const [colors, sizes, genders, categories] = await Promise.all([
                masterRepository.getColors(),
                masterRepository.getSizes(),
                masterRepository.getGenders(),
                masterRepository.getCategoris()
            ]);

            res.json({ success: true, colors, sizes, genders, categories });
        } catch (error) {
            next(error);
        }
    }
};