/**
 * Mock Email Service
 * Provides console logging for emails in local testing mode
 */

/**
 * Sent email record interface
 */
interface SentEmail {
    to: string;
    subject: string;
    text: string;
    html: string;
    messageId: string;
    sentAt: number;
}

/**
 * In-memory store for sent emails
 */
const sentEmails: SentEmail[] = [];

/**
 * Mock Email service class
 */
class MockEmailService {
    private fromEmail: string;
    private messageIdCounter: number = 1;

    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@groupfoodtinder.com';
        console.log('✅ Mock Email service initialized (console logging mode)');
    }

    /**
     * Send magic link email (mock version - logs to console)
     * @param email - Recipient email address
     * @param token - Magic link token
     * @returns Promise<boolean> - true if email "sent" successfully
     */
    async sendMagicLink(email: string, token: string): Promise<boolean> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const magicLink = `${frontendUrl}/verify?token=${token}`;

        const subject = 'Your Magic Link to Sign In';
        const text = `Click this link to sign in: ${magicLink}\n\nThis link will expire in 15 minutes.`;
        const html = this.getMagicLinkTemplate(magicLink);

        // Generate mock message ID
        const messageId = this.generateMessageId();

        // Store sent email
        const sentEmail: SentEmail = {
            to: email,
            subject,
            text,
            html,
            messageId,
            sentAt: Date.now(),
        };
        sentEmails.push(sentEmail);

        // Log to console with prominent formatting
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║  🔐 MOCK EMAIL - Magic Link Generated                                     ║');
        console.log('╠════════════════════════════════════════════════════════════════════════════╣');
        console.log(`║  To: ${email.padEnd(68)}║`);
        console.log(`║  Subject: ${subject.padEnd(63)}║`);
        console.log('║                                                                            ║');
        console.log('║  📧 Magic Link (click or copy):                                           ║');
        console.log(`║  ${magicLink}`);
        console.log('║                                                                            ║');
        console.log('║  💡 Tip: Click the link above or copy it to your browser                  ║');
        console.log('║  ⏰ Link expires in 15 minutes                                            ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

        return true;
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
     * Send session invitation email (mock version - logs to console)
     * @param email - Recipient email address
     * @param sessionLink - Session share link
     * @param hostName - Name of the host
     * @returns Promise<boolean> - true if email "sent" successfully
     */
    async sendSessionInvitation(
        email: string,
        sessionLink: string,
        hostName: string = 'A friend'
    ): Promise<boolean> {
        const subject = `${hostName} invited you to vote on food!`;
        const text = `${hostName} has invited you to help choose what to eat! Join here: ${sessionLink}`;
        const html = this.getSessionInvitationTemplate(sessionLink, hostName);

        // Generate mock message ID
        const messageId = this.generateMessageId();

        // Store sent email
        const sentEmail: SentEmail = {
            to: email,
            subject,
            text,
            html,
            messageId,
            sentAt: Date.now(),
        };
        sentEmails.push(sentEmail);

        // Log to console with prominent formatting
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║  🎉 MOCK EMAIL - Session Invitation Sent                                  ║');
        console.log('╠════════════════════════════════════════════════════════════════════════════╣');
        console.log(`║  To: ${email.padEnd(68)}║`);
        console.log(`║  Subject: ${subject.padEnd(63)}║`);
        console.log(`║  Host: ${hostName.padEnd(66)}║`);
        console.log('║                                                                            ║');
        console.log('║  🔗 Session Link (click or copy):                                         ║');
        console.log(`║  ${sessionLink}`);
        console.log('║                                                                            ║');
        console.log('║  💡 Tip: Click the link above or copy it to your browser                  ║');
        console.log('║  👥 Share this link with others to join the voting session                ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

        return true;
    }

    /**
     * Get HTML template for session invitation email
     * @param sessionLink - Session share link
     * @param hostName - Name of the host
     * @returns HTML string
     */
    private getSessionInvitationTemplate(sessionLink: string, hostName: string): string {
        return `
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
    }

    /**
     * Generate a mock message ID
     * @returns Mock message ID
     */
    private generateMessageId(): string {
        const id = `mock-${this.messageIdCounter}-${Date.now()}@groupfoodtinder.com`;
        this.messageIdCounter++;
        return id;
    }

    /**
     * Get all sent emails (useful for testing/verification)
     * @returns Array of sent emails
     */
    getSentEmails(): SentEmail[] {
        return [...sentEmails];
    }

    /**
     * Get sent emails for a specific recipient
     * @param email - Recipient email address
     * @returns Array of sent emails
     */
    getSentEmailsTo(email: string): SentEmail[] {
        return sentEmails.filter(e => e.to === email);
    }

    /**
     * Clear sent emails history (useful for testing)
     */
    clearSentEmails(): void {
        sentEmails.length = 0;
        console.log('[MOCK EMAIL] Cleared sent emails history');
    }

    /**
     * Get stats about sent emails
     */
    getStats(): { totalSent: number; uniqueRecipients: number } {
        const uniqueRecipients = new Set(sentEmails.map(e => e.to)).size;
        return {
            totalSent: sentEmails.length,
            uniqueRecipients,
        };
    }
}

// Export singleton instance
export default new MockEmailService();

// Made with Bob