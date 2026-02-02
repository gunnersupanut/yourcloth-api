import { userRepository } from "../repositories/userRepository";
import bcrypt from 'bcrypt';
import { AppError } from "../utils/AppError";
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
    },
    changePassword: async (userId: number, currentPass: string, newPass: string) => {
        // ดึง User มาเอา Hash เก่า
        const user = await userRepository.findUserById(userId);
        if (!user) throw new AppError("User not found", 400);

        // เช็ครหัสเก่า
        const isMatch = await bcrypt.compare(currentPass, user.password_hash);
        if (!isMatch) throw new AppError("Incorrect current password", 401);


        // Hash รหัสใหม่
        const newHash = await bcrypt.hash(newPass, 10);
        await userRepository.updatePasswordByUserId(userId, newHash);
    },
    deleteMyAccount: async (userId: number) => {
        // สั่งลบเลย
        const isDeleted = await userRepository.softDeleteUser(userId);

        // ถ้าลบไม่ได้ (เช่น ID ผิด หรือ เคยลบไปแล้ว) ให้ดีด Error
        if (!isDeleted) {
            throw new AppError("User not found or already deleted", 404);
        }

        return true;
    }
};