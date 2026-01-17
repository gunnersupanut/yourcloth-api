import { Request, Response } from 'express';
import { addressService } from '../services/addressService';
import { CreateAddressPayload } from '../type/addressTypes';
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
            message: "Add new address complete.",
            data: newAddress
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "Failed to add address" });
    }
};