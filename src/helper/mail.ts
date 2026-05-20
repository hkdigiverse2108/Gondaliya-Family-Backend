"use strict"
import nodemailer from 'nodemailer';

const option: any = {
    service: "gmail",
    host: 'smtp.gmail.com',
    port: 465,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PASSWORD,
    },
}
const transPorter = nodemailer.createTransport(option)

export const email_verification_mail = async (user: any, otp: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mailOptions = {
                from: process.env.MAIL,
                to: user.email,
                subject: "Verify your Email - Zazzi App",
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
                        table { border-spacing: 0; width: 100%; }
                        td { padding: 0; }
                        img { border: 0; }
                        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
                        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: 'Inter', sans-serif; color: #4a4a4a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                        .header { background-color: #F43939; text-align: center; padding: 40px 0; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; }
                        .content { padding: 40px 30px; text-align: center; }
                        .content h2 { color: #1a1a1a; font-size: 24px; font-weight: 700; margin-bottom: 20px; }
                        .content p { font-size: 16px; line-height: 1.6; color: #5a5a5a; margin-bottom: 30px; }
                        .otp-container { background-color: #fff1f1; border: 2px dashed #F43939; border-radius: 10px; padding: 25px; margin: 30px 0; display: inline-block; min-width: 250px; }
                        .otp-code { font-size: 42px; font-weight: 800; color: #F43939; letter-spacing: 8px; font-family: 'Inter', sans-serif; }
                        .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #eeeeee; }
                        .footer p { font-size: 13px; color: #999999; margin: 0; line-height: 1.5; }
                        .footer .social-links { margin-top: 15px; }
                        .expiry-text { font-size: 14px; color: #F43939; font-weight: 600; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <center class="wrapper">
                        <table class="main" width="100%">
                            <tr>
                                <td class="header">
                                    <h1>Zazzi App</h1>
                                </td>
                            </tr>
                            <tr>
                                <td class="content">
                                    <h2>Email Verification</h2>
                                    <p>Hi ${user.firstName || 'User'},</p>
                                    <p>Thank you for choosing Zazzi App. Use the following One-Time Password (OTP) to complete your verification process.</p>
                                    
                                    <div class="otp-container">
                                        <div class="otp-code">${otp}</div>
                                        <div class="expiry-text">Valid for 10 minutes</div>
                                    </div>

                                    <p style="margin-top: 30px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
                                </td>
                            </tr>
                            <tr>
                                <td class="footer">
                                    <p>&copy; 2026 Zazzi App Inc. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>
                    </center>
                </body>
                </html>
                `
            };
            await transPorter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log(err)
                    reject(err)
                } else {
                    resolve(`Email has been sent to ${user.email}, kindly follow the instructions`)
                }
            })
        } catch (error) {
            console.log(error)
            reject(error)
        }
    });
}
