import { userRepository } from "../repositories/userRepository";

export const userService = {
    // ดึงข้อมูลตัวเอง
    getProfile: async (userId: number) => {
        const user = await userRepository.getUserProfile(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    },

    // แก้ไขข้อมูลตัวเอง
    updateProfile: async (userId: number, data: any) => {
        
        return await userRepository.updateUserProfile(userId, data);
    }
};