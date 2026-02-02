import { Request, Response, NextFunction } from "express";
import { bannerService } from "../services/bannerService";
import { AppError } from "../utils/AppError";

export const bannerController = {
    // GET Public
    getPublicBanners: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const banners = await bannerService.getPublicBanners();
            res.status(200).json({ success: true, data: banners });
        } catch (error) {
            next(error);
        }
    },

    // GET All
    getAllBanners: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const banners = await bannerService.getAllBanners();
            res.status(200).json({ success: true, data: banners });
        } catch (error) {
            next(error);
        }
    },

    // POST Create
    createBanner: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const newBanner = await bannerService.createBanner(req.body);
            res.status(201).json({ success: true, data: newBanner });
        } catch (error) {
            next(error);
        }
    },

    // PUT Update
    updateBanner: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) throw new AppError("Invalid ID", 400);

            const updatedBanner = await bannerService.updateBanner(id, req.body);
            res.status(200).json({ success: true, data: updatedBanner });
        } catch (error) {
            next(error);
        }
    },

    // DELETE
    deleteBanner: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) throw new AppError("Invalid ID", 400);

            await bannerService.deleteBanner(id);
            res.status(200).json({ success: true, message: "Banner deleted successfully" });
        } catch (error) {
            next(error);
        }
    },
};