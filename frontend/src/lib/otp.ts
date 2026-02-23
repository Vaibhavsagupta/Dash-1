import nodemailer from "nodemailer"

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTPEmail(userEmail: string, otp: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    await transporter.sendMail({
        from: `"AI Dashboard" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Your Verification OTP",
        text: `Your OTP for verification is ${otp}. It will expire in 10 minutes.`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Verification Required</h2>
        <p>Hello,</p>
        <p>Your OTP for verifying your account is:</p>
        <div style="background: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6B7280;">AI Dashboard System</p>
      </div>
    `,
    })
}
