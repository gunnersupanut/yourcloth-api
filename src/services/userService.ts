import { userRepository } from "../repositories/userRepository";
import bcrypt from 'bcrypt';
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
        if (!user) throw new Error("User not found");

        // เช็ครหัสเก่า
        const isMatch = await bcrypt.compare(currentPass, user.password_hash);
        if (!isMatch) {
            const error: any = new Error("Incorrect current password");
            error.statusCode = 400; // ส่ง 400 Bad Request
            throw error;
        }

        // Hash รหัสใหม่
        const newHash = await bcrypt.hash(newPass, 10);
        await userRepository.updatePasswordByUserId(userId, newHash);
    }
};