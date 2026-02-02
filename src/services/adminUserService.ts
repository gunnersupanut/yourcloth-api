import { adminUserRepository } from "../repositories/adminUserRepository";
// อย่าลืม import AppError ของนายมาด้วยนะ
import { AppError } from "../utils/AppError"; 

export const adminUserService = {
    // ดึงรายการ User (จัดการเรื่องหน้า + ค้นหา)
    getUsers: async (search: string = '', page: number = 1, limit: number = 10) => {
        const offset = (page - 1) * limit;
        return await adminUserRepository.getAllUsers(search, limit, offset);
    },

    // ดึงรายคน
    getUserById: async (userId: number) => {
        const user = await adminUserRepository.getUserById(userId);
        if (!user) throw new AppError("User not found", 404);
        return user;
    },

    // แบน / ปลดแบน
    toggleUserBan: async (userId: number, isActive: boolean) => {
        const updatedUser = await adminUserRepository.toggleUserStatus(userId, isActive);
        if (!updatedUser) throw new AppError("User not found", 404);
        
        return updatedUser;
    }
};