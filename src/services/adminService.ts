import { adminRepository } from "../repositories/adminRepository";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppError } from "../utils/AppError";

export const adminService = {
    register: async (username: string, password: string, adminName: string) => {
        // hashPassword
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds)
        // 
        await adminRepository.addNewAdmin(username, passwordHash, adminName)
    },
    login: async (username: string, password: string) => {
        // หา admin 
        const admin = await adminRepository.findByUsernameWithPassword(username)
        console.log("Admin Data:", admin)           // ถ้าไม่เจอ
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            throw new AppError("Invalid username or password", 401);
        }
        // สร้าง Token
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                role: 'ADMIN',
                name: admin.admin_name
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );
        // อัพเดต LastLogin
        await adminRepository.updateLastLogin(admin.id);
        return { status: "SUCCESS", token: token, id: admin.id, name: admin.admin_name }
    }
}