import nodemailer from "nodemailer";

interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

function createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }

    // Development fallback / test transport if SMTP is not configured
    return null;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const transporter = createTransporter();
    const fromAddress =
        process.env.SMTP_FROM ||
        (process.env.SMTP_USER ? `"Resume Management System" <${process.env.SMTP_USER}>` : '"Resume Management System" <noreply@resumemanagement.local>');

    if (!transporter) {
        if (process.env.NODE_ENV !== "production") {
            console.log("==================================================");
            console.log("DEV EMAIL SERVICE (SMTP not configured):");
            console.log("To:", options.to);
            console.log("Subject:", options.subject);
            console.log("Content:", options.text);
            console.log("==================================================");
        }
        return true;
    }

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || `<p>${options.text.replace(/\n/g, "<br/>")}</p>`,
        });
        return true;
    } catch (error) {
        console.error("Failed to send email via SMTP:", error);
        return false;
    }
}

export async function sendPasswordResetOTPEmail(
    toEmail: string,
    otp: string
): Promise<boolean> {
    const subject = "Your Password Reset OTP - Resume Management System";
    const text = `Hello,\n\nYou requested a password reset for your account.\n\nYour 6-digit verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. If you did not make this request, you can safely ignore this email.\n\nRegards,\nResume Management System Team`;
    
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">Hello,</p>
        <p style="color: #475569; font-size: 15px;">You requested to reset your password. Use the verification code below:</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong> (maximum 5 attempts). Do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">If you did not request this password reset, please ignore this email.</p>
    </div>
    `;

    return sendEmail({
        to: toEmail,
        subject,
        text,
        html,
    });
}
