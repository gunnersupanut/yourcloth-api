export class AppError extends Error {
    // เพิ่มจาก Error
    public statusCode: number;
    public data: any;
    // ให้สร้างทำทันทีหลังใช้คำสั่ง new AppError(...)
    constructor(message: string, statusCode: number, data?: any) {
        // ส่ง message  ไปให้ Error
        super(message);
        // อาค่า statusCode และ data ที่รับมา ยัดใส่ตัวแปรที่เราประกาศไว้
        this.statusCode = statusCode;
        this.data = data;

        // บรรทัดนี้เพื่อให้ instanceof ทำงานได้ถูกต้องใน TypeScript
        Object.setPrototypeOf(this, AppError.prototype);
    }
}