# Services

This directory contains API service modules for communicating with the backend.

## Services to Implement

- **api.ts**: Base Axios configuration and interceptors
- **authService.ts**: Authentication API calls (login, logout, verify token)
- **groupService.ts**: Group CRUD operations
- **restaurantService.ts**: Restaurant data fetching and AI recommendations
- **swipeService.ts**: Submit swipe decisions and check for matches
- **userService.ts**: User profile management

## Structure

Each service should:
- Export functions for specific API operations
- Handle errors appropriately
- Use TypeScript types for request/response data
- Include JSDoc comments for documentation

## Example

```typescript
import api from './api';

export const authService = {
  sendMagicLink: async (email: string) => {
    const response = await api.post('/auth/magic-link', { email });
    return response.data;
  },
  // ... other methods
};