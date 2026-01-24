import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ฟังก์ชันลบไฟล์ออกจาก Cloudinar
export const deleteFileFromCloudinary = async (publicId: string, type: 'image' | 'video' = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: type
        });

        console.log(`Deleted ${type} [${publicId}]:`, result);
        return result;
    } catch (error) {
        console.error(`Delete failed for ${publicId}:`, error);
        // ไม่ต้อง throw error ก็ได้ แค่ log ไว้ เพราะการลบรูปไม่ควรขัด Flow หลัก
        return null;
    }
};