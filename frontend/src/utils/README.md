# Utils

This directory contains utility functions and helper modules.

## Utility Files to Implement

- **constants.ts**: Application-wide constants
- **validators.ts**: Input validation functions
- **formatters.ts**: Data formatting utilities (dates, currency, etc.)
- **storage.ts**: LocalStorage/SessionStorage helpers
- **animations.ts**: Animation configuration for Framer Motion
- **helpers.ts**: General helper functions

## Best Practices

- Keep functions pure when possible
- Export individual functions, not default exports
- Include unit tests for complex utilities
- Document function parameters and return types
- Use descriptive function names

## Example

```typescript
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};