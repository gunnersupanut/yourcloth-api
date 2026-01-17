import { Request, Response } from 'express';
import { addressService } from '../services/addressService';
import { CreateAddressPayload, UpdateAddressPayload } from '../type/addressTypes';
import { CustomJwtPayload } from "../type/jwtType"; // สมมติว่ามี Type User

// ดึง List ที่อยู่ทั้งหมด 
export const getAddressesController = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;

        const addresses = await addressService.getUserAddresses(userId);

        res.status(200).json(addresses);
    } catch (error) {
        console.error("Get Address Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// เพิ่มที่อยู่ใหม่ 
export const addAddressController = async (req: Request<unknown, unknown, CreateAddressPayload>, res: Response) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;

        const { recipientName, phone, address, isDefault } = req.body;

        // 🛡️ กันเหนียว: เช็คว่าส่งของมาครบไหม
        if (!recipientName || !phone || !address) {
            return res.status(400).json({ message: "กรอกข้อมูลให้ครบด้วยครับวัยรุ่น!" });
        }

        // ส่งข้อมูลไป Service 
        const newAddress = await addressService.addNewAddress(userId, {
            recipientName,
            phone,
            address,
            isDefault: isDefault || false
        });

        res.status(201).json({
            message: "Address added successfully",
            data: newAddress
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "Failed to add address" });
    }
};
export const deleteAddressController = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;
        const { id } = req.params; // รับ ID จาก URL

        const success = await addressService.deleteAddress(userId, id);

        if (!success) {
            // ลบไม่ได้ 
            return res.status(404).json({ message: "Address not found or unauthorized" });
        }
        res.status(200).json({ message: "Address deleted successfully." });

    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ message: "Delete failed" });
    }
};

// 📝 4. แก้ไขที่อยู่ (PUT /:id)
export const updateAddressController = async (
    req: Request<{ id: string }, unknown, UpdateAddressPayload>,
    res: Response
) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;
        const { id } = req.params;

        // ดึง Body มาเลย (ไม่ต้องกำหนด Type ซ้ำ เพราะ Generic จัดการให้แล้ว)
        const updateData = req.body;

        // ส่งไปให้ Service
        const updatedAddress = await addressService.updateAddress(userId, id, updateData);

        if (!updatedAddress) {
            // ถ้าเป็น null แปลว่า Update ไม่สำเร็จ (หาไม่เจอ หรือไม่มี field ส่งมา)
            return res.status(404).json({ message: "Address not found or no changes made" });
        }

        res.status(200).json({
            message: "Address updated successfully.",
            data: updatedAddress
        });

    } catch (error) {
        console.error("Update Address Error:", error);
        res.status(500).json({ message: "Update failed" });
    }
};