# Controllers

This directory contains request handlers that process business logic.

## Controllers to Implement

- **auth.controller.ts**: Handle authentication logic
- **group.controller.ts**: Handle group operations
- **restaurant.controller.ts**: Handle restaurant data operations
- **swipe.controller.ts**: Handle swipe actions and matching
- **user.controller.ts**: Handle user profile operations

## Structure

Each controller should:
- Export functions that handle specific requests
- Use services for business logic
- Return appropriate HTTP responses
- Handle errors gracefully
- Use TypeScript types for request/response

## Example

```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  sendMagicLink: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await authService.sendMagicLink(email);
      res.status(200).json({ message: 'Magic link sent' });
    } catch (error) {
      next(error);
    }
  },
  // ... other methods
};