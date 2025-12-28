import { userRepository } from "../repositories/userRepository";
import Jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { CreateUserParams, LoginRequestBody, RegisterRequestBody } from "../type/user.type";
import bcrypt from 'bcrypt';
import { sendEmail } from "./emailService";

export const authService = {
    login: async (payload: LoginRequestBody) => {
        const { username, password, rememberMe } = payload

        const user = await userRepository.findByUsernameWithPassword(username);
        // ถ้าไม่เจอ user
        if (!user) throw new Error("invalid_credentials")

        // ถ้าเจอตรวจรหัสผ่านก่อน กันสุ่ม user
        const isMatchPassword: boolean = await bcrypt.compare(password, user.password_hash)
        if (!isMatchPassword) throw new Error("invalid_credentials")

        //เช็ค verify
        if (!user.is_verify) return { status: "user_not_verify", email: user.email };
        // เช็คสถานะบัญชี
        if (!user.is_active) return { status: "user_not_active" };
        if (user.deleted_at) return { status: "user_deleted" }
        // หากรหัสผ่านถูกต้อง
        // สร้าง JWT token พร้อม id 
        const token = Jwt.sign({ id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: rememberMe ? '7d' : '1d' }
        );
        return { status: "SUCCESS", token: token }

    },
    register: async (payload: RegisterRequestBody) => {
        const { username, password, email } = payload;
        // เช็คว่า Username/Email ซ้ำไหม
        // ใช้ Promise ส่งไปพร้อมกันเลย
        const [existingUser, existingEmail] = await Promise.all([
            userRepository.findByUsername(username),
            userRepository.findByEmail(email)
        ]);
        if (existingUser) throw new Error("username_exist");
        if (existingEmail) throw new Error("email_exist");

        // hash Password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // สร้างโทเคน
        const verificationToken = uuidv4();
        // สร้างเวลาหมดอายุ (ปัจจุบัน + 30 นาที)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        // เตรียมข้อมูลส่งไป CreateUser Repository
        const newUserParams: CreateUserParams = {
            username: username,
            password_hash: passwordHash,
            email: email,
            verification_token: verificationToken,
            verification_expires_at: expiresAt
        }
        const newUser = await userRepository.addNewUser(newUserParams);
        // ส่งเมล
        try {
            const verifySubject = "Welcome To YourCloth Please Verify Email"
            const verificationLink = `${process.env.CLIENT_URL}/verified?token=${verificationToken}`
            const htmlMessage = `
       <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Verify Email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
              <td align="center">
                  
                  <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <tr>
                          <td style="background-color: #684C6B; height: 8px;"></td>
                      </tr>

                      <tr>
                          <td style="padding: 40px 30px; text-align: center;">
                              
                              <h1 style="color: #684C6B; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
                                  Verify your email address
                              </h1>
                              
                              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                  Thanks for signing up for YourCloth! <br>
                                  Please click the button below to verify your email address and activate your account.
                              </p>

                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                  <tr>
                                      <td align="center" style="border-radius: 5px; background-color: #FFCD02;">
                                          <a href="${verificationLink}" 
                                             style="display: inline-block; padding: 14px 30px; 
                                                    background-color: #FFCD02; 
                                                    color: #684C6B; /* ใช้สีม่วงเข้มบนพื้นเหลืองเพื่อให้อ่านง่าย */
                                                    text-decoration: none; 
                                                    border-radius: 5px; 
                                                    font-size: 16px; 
                                                    font-weight: bold;
                                                    border: 1px solid #FFCD02;">
                                              Verify Email Now
                                          </a>
                                      </td>
                                  </tr>
                              </table>

                              <p style="color: #999999; font-size: 14px; margin-top: 30px;">
                                  This link will expire in 30 minutes.
                              </p>

                              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
                              <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                                  If the button above doesn't work, copy and paste the following link into your browser:<br>
                                  <a href="${verificationLink}" style="color: #684C6B; word-break: break-all;">
                                      ${verificationLink}
                                  </a>
                              </p>

                          </td>
                      </tr>
                  </table>

              </td>
          </tr>
      </table>

  </body>
  </html>    
`;
            await sendEmail(email, verifySubject, htmlMessage)
        } catch (error) {
            console.error("ส่งเมลไม่ผ่าน:", error)
        }
        return newUser;
    },
    verifyEmail: async (token: string) => {
        // เช็ค token
        // ถ้าผ่าน เรียก Repo
        const user = await userRepository.findByVerificationToken(token);
        if (!user) throw new Error("invalid_token")
        // เช็คหมดอายุ
        if (new Date() > user.verification_expires_at) {
            throw new Error("invalid_token");
        }

        // ถ้ายัง ให้ Repo อัปเดต
        const updatedUser = await userRepository.verifyUser(user.id);
        return { status: "SUCCESS", user: updatedUser };
    }
}