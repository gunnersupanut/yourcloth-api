import { addressRepository } from '../repositories/addressRepository';
import pool from "../config/db";

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
    }
};