# Types

This directory contains TypeScript type definitions and interfaces.

## Type Files to Implement

- **user.types.ts**: User-related types (User, UserProfile, AuthState)
- **group.types.ts**: Group-related types (Group, GroupMember, GroupSession)
- **restaurant.types.ts**: Restaurant types (Restaurant, RestaurantDetails, Cuisine)
- **swipe.types.ts**: Swipe-related types (SwipeAction, SwipeResult, Match)
- **api.types.ts**: API request/response types
- **common.types.ts**: Shared utility types

## Best Practices

- Use interfaces for object shapes
- Use type aliases for unions and complex types
- Export all types for use across the application
- Document complex types with JSDoc comments
- Keep types DRY (Don't Repeat Yourself)

## Example

```typescript
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export type SwipeDirection = 'left' | 'right';