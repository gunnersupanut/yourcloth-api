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
                                  Thanks for signing up for YourCloth!<br>
                                  Please click the button below to verify your email address and activate your account.
                              </p>

                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                  <tr>
                                      <td align="center" style="border-radius: 5px; background-color: #FFCD02;">
                                          <a href="${link}" 
                                             style="display: inline-block; padding: 14px 30px; 
                                                    background-color: #FFCD02; 
                                                    color: #684C6B; 
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
                                  This link will expire in 24 hours.
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
      <meta charset="UTF-8">
      <title>Reset Password</title>
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
                                  Reset Your Password
                              </h1>
                              
                              <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                  We received a request to reset your password for your YourCloth account.<br>
                                  If you didn't make this request, just ignore this email. Otherwise, click the button below to change your password.
                              </p>

                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                  <tr>
                                      <td align="center" style="border-radius: 5px; background-color: #FFCD02;">
                                          <a href="${link}" 
                                             style="display: inline-block; padding: 14px 30px; 
                                                    background-color: #FFCD02; 
                                                    color: #684C6B; 
                                                    text-decoration: none; 
                                                    border-radius: 5px; 
                                                    font-size: 16px; 
                                                    font-weight: bold;
                                                    border: 1px solid #FFCD02;">
                                              Reset Password
                                          </a>
                                      </td>
                                  </tr>
                              </table>

                              <p style="color: #999999; font-size: 14px; margin-top: 30px;">
                                  This link will expire in 60 minutes.
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