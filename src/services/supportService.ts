import { supportRepository, ISupportTicketPayload } from "../repositories/supportRepository";
import { AppError } from "../utils/AppError";

export const supportService = {
    createTicket: async (userId: number, topic: string, message: string) => {
        if (!topic || !message) {
            throw new AppError("Please fill in all fields", 400);
        }

        // Prepare Data
        const payload: ISupportTicketPayload = {
            userId,
            topic,
            message,
        };

        return await supportRepository.create(payload);
    },

    getAllTickets: async () => {
        return await supportRepository.findAll();
    },

    resolveTicket: async (id: number, adminResponse: string, resolverName: string) => {
        // เปลี่ยนสถานะเป็น RESOLVED
        return await supportRepository.updateStatus(id, 'RESOLVED', adminResponse, resolverName);
    }
};