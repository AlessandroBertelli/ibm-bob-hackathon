# Middleware

This directory contains Express middleware functions.

## Middleware to Implement

- **auth.middleware.ts**: JWT token verification and user authentication
- **validation.middleware.ts**: Request body/params validation
- **error.middleware.ts**: Centralized error handling
- **rateLimit.middleware.ts**: API rate limiting
- **logger.middleware.ts**: Request/response logging

## Structure

Each middleware should:
- Follow Express middleware signature: (req, res, next)
- Call next() to pass control to next middleware
- Handle errors appropriately
- Be reusable across routes

## Example

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};