# AI Service Documentation

## Overview
The AI Service provides AI-powered meal generation using OpenAI's GPT-3.5-turbo for text generation and DALL-E 3 for image generation.

## Features

### 1. Meal Generation
- Generates 4 unique meal options based on vibe, headcount, and dietary restrictions
- Uses GPT-3.5-turbo for cost-effective generation
- Includes realistic ingredients with proper quantities
- Ensures variety in cuisine styles

### 2. Image Generation
- Creates high-quality food photography using DALL-E 3
- Professional presentation with natural lighting
- Fallback to Unsplash placeholder images on failure

### 3. Ingredient Scaling
- Scales ingredients from base (1 person) to target headcount
- Rounds to practical fractions (1/4, 1/2, 3/4)
- Handles different units appropriately
- Special handling for whole items

### 4. Error Handling
- Retry logic with exponential backoff
- Rate limit handling
- Content policy violation handling
- Graceful fallbacks

## API Endpoints

### POST /api/ai/generate-meals
Generate meal options (public endpoint).

**Request:**
```json
{
  "vibe": "Fancy Taco Tuesday",
  "headcount": 6,
  "dietary_restrictions": ["vegan", "gluten-free"]
}
```

**Response:**
```json
{
  "success": true,
  "meals": [
    {
      "id": "meal_id",
      "title": "Spicy Vegan Tacos",
      "description": "Delicious plant-based tacos...",
      "image_url": "https://...",
      "ingredients": [
        {
          "name": "black beans",
          "base_quantity": 0.5,
          "unit": "cups"
        }
      ]
    }
  ]
}
```

### POST /api/ai/regenerate-meals/:sessionId
Regenerate meals for existing session (requires authentication).

**Response:**
```json
{
  "success": true,
  "message": "Meals regenerated successfully",
  "session": {...},
  "meals": [...]
}
```

### GET /api/ai/health
Check AI service health and configuration.

**Response:**
```json
{
  "success": true,
  "ai_service": {
    "configured": true,
    "model": "gpt-3.5-turbo",
    "image_model": "dall-e-3",
    "status": "ready"
  }
}
```

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-your_api_key_here
```

### Service Configuration
```typescript
const CONFIG = {
    TEXT_MODEL: 'gpt-3.5-turbo',
    IMAGE_MODEL: 'dall-e-3',
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    TEXT_TIMEOUT_MS: 30000,
    IMAGE_TIMEOUT_MS: 60000,
    TEMPERATURE: 0.8,
    MAX_TOKENS: 2000,
    NUM_MEALS: 4,
};
```

## Integration with Session Creation

When a session is created:
1. Session is created with status "generating"
2. AI service generates meals asynchronously
3. Images are generated in parallel for all meals
4. Ingredients are scaled based on headcount
5. Meals are added to session in Firebase
6. Session status is updated to "voting"

## Prompt Engineering

### Meal Generation Prompt
```
System: You are a creative chef and meal planner. Generate unique, appetizing meal ideas with realistic ingredients and quantities.

User: Create 4 distinct meal options for:
- Vibe/Theme: {vibe}
- Number of people: {headcount}
- Dietary restrictions: {restrictions}

Return JSON array with structure:
[
  {
    "title": "Catchy 3-6 word title",
    "description": "2-3 sentences describing the meal",
    "ingredients": [
      {
        "name": "ingredient name",
        "base_quantity": number,
        "unit": "cups/lbs/oz/etc"
      }
    ]
  }
]
```

### Image Generation Prompt
```
Professional food photography of {mealTitle}. {mealDescription}. 
Beautifully plated, appetizing presentation, natural lighting, 
high resolution, restaurant quality, overhead shot, vibrant colors
```

## Error Handling

### Retryable Errors
- Rate limit (429)
- Server errors (500, 503)
- Network timeouts
- Connection resets

### Non-Retryable Errors
- Invalid API key (401)
- Bad request (400)
- Content policy violations

### Fallback Strategies
- Image generation failure → Unsplash placeholder
- Content policy violation → Sanitize and retry
- All retries failed → User-friendly error message

## Performance Optimization

### Parallel Processing
```typescript
const mealsWithImagesPromises = generatedMeals.map(async (meal) => {
    const imageUrl = await generateMealImage(meal.title, meal.description);
    return { ...meal, image_url: imageUrl };
});

const mealsWithImages = await Promise.all(mealsWithImagesPromises);
```

### Cost Optimization
- Use GPT-3.5-turbo instead of GPT-4
- Standard quality for DALL-E images
- Limit to 4 meals per session
- Cache results when possible

## Testing

### Manual Testing
```bash
# Test meal generation
curl -X POST http://localhost:3000/api/ai/generate-meals \
  -H "Content-Type: application/json" \
  -d '{
    "vibe": "Italian Night",
    "headcount": 4,
    "dietary_restrictions": ["vegetarian"]
  }'

# Test AI health
curl http://localhost:3000/api/ai/health
```

### Test Cases
1. Generate meals with various vibes
2. Test with different dietary restrictions
3. Test with different headcounts (1-50)
4. Test error scenarios (invalid API key, rate limits)
5. Test ingredient scaling accuracy
6. Test image generation fallback

## Monitoring

### Logs to Monitor
- Meal generation success/failure
- Image generation success/failure
- Retry attempts
- API response times
- Cost per request

### Metrics to Track
- Average generation time
- Success rate
- Retry rate
- Cost per session
- User satisfaction with generated meals

## Future Enhancements

1. **Caching**: Cache generated meals for similar vibes
2. **User Preferences**: Learn from user voting patterns
3. **Recipe Details**: Add cooking instructions
4. **Nutritional Info**: Include calories and macros
5. **Shopping Lists**: Generate formatted shopping lists
6. **Cost Estimates**: Estimate meal costs
7. **Seasonal Ingredients**: Suggest seasonal alternatives
8. **Batch Generation**: Generate multiple sessions in parallel

## Troubleshooting

### Issue: Meals not generating
- Check OPENAI_API_KEY is set
- Verify API key is valid
- Check API rate limits
- Review logs for errors

### Issue: Images not loading
- Check DALL-E API status
- Verify image URLs are accessible
- Check fallback to Unsplash is working

### Issue: Slow generation
- Check network latency
- Verify parallel processing is working
- Consider using GPT-3.5-turbo-16k for faster responses

### Issue: Content policy violations
- Review vibe text for inappropriate content
- Implement content filtering
- Sanitize user input

## Support

For issues or questions:
1. Check logs in console
2. Review error messages
3. Test with /api/ai/health endpoint
4. Verify environment variables
5. Check OpenAI API status

## Made with Bob