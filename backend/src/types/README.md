# Types

This directory contains TypeScript type definitions and interfaces.

## Type Files to Implement

- **user.types.ts**: User-related types
- **group.types.ts**: Group and session types
- **restaurant.types.ts**: Restaurant data types
- **swipe.types.ts**: Swipe action and match types
- **auth.types.ts**: Authentication types (tokens, payloads)
- **api.types.ts**: API request/response types
- **express.types.ts**: Extended Express types

## Best Practices

- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Export all types for use across the application
- Keep types DRY (Don't Repeat Yourself)
- Document complex types with JSDoc

## Example

```typescript
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  members: string[];
  sessionActive: boolean;
  createdAt: Date;
}

export type SwipeDirection = 'left' | 'right';

export interface SwipeAction {
  userId: string;
  groupId: string;
  restaurantId: string;
  direction: SwipeDirection;
  timestamp: Date;
}