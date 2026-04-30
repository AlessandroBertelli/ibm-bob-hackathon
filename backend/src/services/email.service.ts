/**
 * Email Service
 * Handles sending emails using nodemailer
 */

import nodemailer, { Transporter } from 'nodemailer';
import { InternalServerError } from '../utils/errors.util';

/**
 * Email configuration interface
 */
interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

/**
 * Email service class
 */
class EmailService {
    private transporter: Transporter | null = null;
    private fromEmail: string;

    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@groupfoodtinder.com';
        this.initializeTransporter();
    }

    /**
     * Initialize nodemailer transporter
     */
    private initializeTransporter(): void {
        try {
            const config: EmailConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER || '',
                    pass: process.env.SMTP_PASS || '',
                },
            };

            if (!config.auth.user || !config.auth.pass) {
                console.warn('Email service not configured. SMTP credentials missing.');
                return;
            }

            this.transporter = nodemailer.createTransport(config);

            // Verify connection
            this.transporter.verify((error) => {
                if (error) {
                    console.error('Email service verification failed:', error);
                } else {
                    console.log('✅ Email service is ready');
                }
            });
        } catch (error) {
            console.error('Failed to initialize email service:', error);
        }
    }

    /**
     * Send magic link email
     * @param email - Recipient email address
     * @param token - Magic link token
     * @returns Promise<boolean> - true if email sent successfully
     */
    async sendMagicLink(email: string, token: string): Promise<boolean> {
        if (!this.transporter) {
            throw new InternalServerError('Email service is not configured');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const magicLink = `${frontendUrl}/auth/verify?token=${token}`;

        const htmlContent = this.getMagicLinkTemplate(magicLink);

        try {
            const info = await this.transporter.sendMail({
                from: `"Group Food Tinder" <${this.fromEmail}>`,
                to: email,
                subject: 'Your Magic Link to Sign In',
                html: htmlContent,
                text: `Click this link to sign in: ${magicLink}\n\nThis link will expire in 15 minutes.`,
            });

            console.log('Magic link email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send magic link email:', error);
            throw new InternalServerError('Failed to send email');
        }
    }

    /**
     * Get HTML template for magic link email
     * @param magicLink - The magic link URL
     * @returns HTML string
     */
    private getMagicLinkTemplate(magicLink: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In to Group Food Tinder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
        }
        p {
            color: #555;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍕</div>
            <h1>Sign In to Group Food Tinder</h1>
        </div>
        
        <p>Hello!</p>
        
        <p>You requested to sign in to Group Food Tinder. Click the button below to access your account:</p>
        
        <div style="text-align: center;">
            <a href="${magicLink}" class="button">Sign In Now</a>
        </div>
        
        <div class="warning">
            <p><strong>⏰ This link expires in 15 minutes</strong></p>
        </div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${magicLink}</p>
        
        <div class="footer">
            <p>If you didn't request this email, you can safely ignore it.</p>
            <p>© ${new Date().getFullYear()} Group Food Tinder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Send session invitation email (optional feature)
     * @param email - Recipient email address
     * @param sessionLink - Session share link
     * @param hostName - Name of the host
     * @returns Promise<boolean> - true if email sent successfully
     */
    async sendSessionInvitation(
        email: string,
        sessionLink: string,
        hostName: string = 'A friend'
    ): Promise<boolean> {
        if (!this.transporter) {
            throw new InternalServerError('Email service is not configured');
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join Food Voting Session</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🍕</div>
            <h1 style="color: #2c3e50; font-size: 24px;">You're Invited to Vote!</h1>
        </div>
        
        <p>${hostName} has invited you to help choose what to eat!</p>
        
        <p>Join the voting session and swipe through delicious meal options:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${sessionLink}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Join Voting Session</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} Group Food Tinder</p>
    </div>
</body>
</html>
        `.trim();

        try {
            const info = await this.transporter.sendMail({
                from: `"Group Food Tinder" <${this.fromEmail}>`,
                to: email,
                subject: `${hostName} invited you to vote on food!`,
                html: htmlContent,
                text: `${hostName} has invited you to help choose what to eat! Join here: ${sessionLink}`,
            });

            console.log('Session invitation email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send session invitation email:', error);
            throw new InternalServerError('Failed to send email');
        }
    }
}

// Export singleton instance
export default new EmailService();

// Made with Bob
