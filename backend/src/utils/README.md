# Utils

This directory contains utility functions and helper modules.

## Utility Files to Implement

- **constants.ts**: Application-wide constants
- **validators.ts**: Input validation functions
- **jwt.utils.ts**: JWT token generation and verification helpers
- **crypto.utils.ts**: Encryption and hashing utilities
- **date.utils.ts**: Date formatting and manipulation
- **logger.ts**: Custom logging utility

## Best Practices

- Keep functions pure when possible
- Export individual functions
- Include JSDoc comments
- Use TypeScript types
- Write unit tests for complex utilities

## Example

```typescript
import jwt from 'jsonwebtoken';

export const generateToken = (payload: object, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};