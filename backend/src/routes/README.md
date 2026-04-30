# Routes

This directory contains Express route definitions.

## Routes to Implement

- **auth.routes.ts**: Authentication endpoints (magic link, verify token, logout)
- **group.routes.ts**: Group management (create, join, leave, list)
- **restaurant.routes.ts**: Restaurant data (fetch, search, AI recommendations)
- **swipe.routes.ts**: Swipe actions (submit swipe, get matches)
- **user.routes.ts**: User profile management

## Structure

Each route file should:
- Define route handlers using Express Router
- Import and use appropriate controllers
- Apply middleware (authentication, validation)
- Export the router as default

## Example

```typescript
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/magic-link', authController.sendMagicLink);
router.get('/verify', authController.verifyToken);
router.post('/logout', authMiddleware, authController.logout);

export default router;