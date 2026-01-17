import { addressRepository } from '../repositories/addressRepository';
import pool from "../config/db";
import { UpdateAddressPayload } from '../type/addressTypes';

export const addressService = {
    getUserAddresses: async (userId: number) => {
        return await addressRepository.findAddressByUserId(userId);
    },

    addNewAddress: async (userId: number, data: any) => {
        // ใช้ Transaction 
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (data.isDefault) {
                // เรียก Repo แบบส่ง Client (Transaction) ไป
                await addressRepository.resetDefaultAddress(userId, client);
            }
            const res = await addressRepository.createAddress(userId, data, client);
            await client.query('COMMIT');
            return res
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            // คืน connection
            client.release();
        }
    },
    // delete
    deleteAddress: async (userId: number, addressId: string) => {
        return await addressRepository.deleteAddress(addressId, userId);
    },

    // update
    updateAddress: async (userId: number, addressId: string, data: UpdateAddressPayload) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1ถ้า User ต้องการตั้งเป็น Default ต้องไปเคลียร์ตัวเก่าก่อน
            if (data.isDefault) {
                await addressRepository.resetDefaultAddress(userId, client);
            }

            // อัปเดตข้อมูลจริง
            // ส่ง client ไปเพื่อให้มันรันใน Transaction เดียวกัน
            const updatedAddress = await addressRepository.updateAddress(addressId, userId, data, client);

            await client.query('COMMIT');
            return updatedAddress;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};