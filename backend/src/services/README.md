# Services

This directory contains business logic and external service integrations.

## Services to Implement

- **auth.service.ts**: Authentication logic (magic links, JWT tokens)
- **firebase.service.ts**: Firebase Admin SDK initialization and operations
- **email.service.ts**: Email sending via Nodemailer
- **openai.service.ts**: OpenAI API integration for restaurant recommendations
- **group.service.ts**: Group management business logic
- **restaurant.service.ts**: Restaurant data fetching and processing
- **swipe.service.ts**: Swipe matching algorithm

## Structure

Each service should:
- Contain pure business logic
- Be independent of HTTP layer (no req/res)
- Handle external API calls
- Throw errors that controllers can catch
- Export functions or a service object

## Example

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  sendMagicLink: async (email: string, token: string) => {
    const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Magic Link - Group Food Tinder',
      html: `<p>Click <a href="${magicLink}">here</a> to sign in.</p>`,
    });
  },
};