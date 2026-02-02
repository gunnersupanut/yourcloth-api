import { bannerRepository } from "../repositories/bannerRepository";
import { ICreateBannerDTO, IUpdateBannerDTO } from "../type/bannerTypes";
import { AppError } from "../utils/AppError"; // Import Class Error ของนายมา

export const bannerService = {
  getPublicBanners: async () => {
    return await bannerRepository.findActiveBanners();
  },

  getAllBanners: async () => {
    return await bannerRepository.findAllBanners();
  },

  createBanner: async (data: ICreateBannerDTO) => {
    // Validate
    if (!data.image_url) {
      throw new AppError("Image URL is required", 400);
    }
    return await bannerRepository.create(data);
  },

  updateBanner: async (id: number, data: IUpdateBannerDTO) => {
    // เช็คก่อนว่ามีของไหม
    const existing = await bannerRepository.findById(id);
    if (!existing) {
      throw new AppError("Banner not found", 404);
    }

    const updated = await bannerRepository.update(id, data);
    return updated;
  },

  deleteBanner: async (id: number) => {
    const existing = await bannerRepository.findById(id);
    if (!existing) {
      throw new AppError("Banner not found", 404);
    }
    await bannerRepository.remove(id);
  },
};