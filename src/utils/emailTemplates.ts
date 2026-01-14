export const getVerificationEmailHtml = (link: string) => {
    return `
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
                                  Thanks for signing up for YourCloth <br>
                                  Please click the button below to verify your email address and activate your account.
                              </p>

                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                  <tr>
                                      <td align="center" style="border-radius: 5px; background-color: #FFCD02;">
                                          <a href="${link}" 
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
                                  <a href="${link}" style="color: #684C6B; word-break: break-all;">
                                      ${link}
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
};

export const resetPasswordEmailHtml = (link: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* ปุ่ม Reset สุดเท่ */
    .btn {
      background-color: #FFC107; /* สีเหลือง YourCloth */
      color: #000000;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      display: inline-block;
      margin-top: 20px;
    }
    .btn:hover {
      background-color: #FFD54F;
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color: #6B46C1; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">YourCloth Shop</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: left; color: #333333;">
              <h2 style="margin-top: 0; color: #4A5568;">Reset Your Password 🔒</h2>
              <p style="font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your <b>YourCloth</b> account.
                <br>If you didn't make this request, just ignore this email.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" class="btn">Reset Password Now</a>
              </div>

              <p style="font-size: 14px; color: #718096;">
                This link will expire in 60 minutes.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

              <p style="font-size: 12px; color: #a0aec0; word-break: break-all;">
                If the button above doesn't work, copy and paste the following link into your browser:<br>
                <a href="${link}" style="color: #6B46C1;">${link}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #718096;">
              &copy; ${new Date().getFullYear()} YourCloth Shop. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};