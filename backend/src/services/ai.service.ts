/**
 * AI Service
 * Handles AI-powered meal generation using OpenAI API
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import {
    GeneratedMeal,
    MealWithImage,
    Ingredient,
    ScaledIngredient,
    ChatMessage,
    ImageGenerationOptions,
} from '../types/ai.types';
import { SessionStatus } from '../types/session.types';
import { firebaseService } from './service-factory';

/**
 * OpenAI client instance
 */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Configuration constants
 */
const CONFIG = {
    TEXT_MODEL: 'gpt-3.5-turbo', // Cost-effective option
    IMAGE_MODEL: 'dall-e-3',
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    TEXT_TIMEOUT_MS: 30000,
    IMAGE_TIMEOUT_MS: 60000,
    TEMPERATURE: 0.8, // Higher for more creative meals
    MAX_TOKENS: 2000,
    NUM_MEALS: 4,
};

/**
 * Exponential backoff delay
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = CONFIG.MAX_RETRIES,
    delayMs: number = CONFIG.RETRY_DELAY_MS
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) {
            throw error;
        }

        // Check if error is retryable
        const isRetryable =
            error?.status === 429 || // Rate limit
            error?.status === 500 || // Server error
            error?.status === 503 || // Service unavailable
            error?.code === 'ECONNRESET' ||
            error?.code === 'ETIMEDOUT';

        if (!isRetryable) {
            throw error;
        }

        console.log(`Retrying after ${delayMs}ms... (${retries} retries left)`);
        await delay(delayMs);
        return retryWithBackoff(fn, retries - 1, delayMs * 2);
    }
}

/**
 * Generate meal options using OpenAI
 * @param vibe - The theme or vibe for the meals
 * @param headcount - Number of people
 * @param dietaryRestrictions - Array of dietary restrictions
 * @returns Array of generated meals
 */
export async function generateMealOptions(
    vibe: string,
    headcount: number,
    dietaryRestrictions: string[] = []
): Promise<GeneratedMeal[]> {
    try {
        const restrictionsText = dietaryRestrictions.length > 0
            ? dietaryRestrictions.join(', ')
            : 'none';

        const systemMessage: ChatMessage = {
            role: 'system',
            content: 'You are a creative chef and meal planner. Generate unique, appetizing meal ideas with realistic ingredients and quantities. Always respond with valid JSON only, no additional text.',
        };

        const userMessage: ChatMessage = {
            role: 'user',
            content: `Create ${CONFIG.NUM_MEALS} distinct meal options for:
- Vibe/Theme: ${vibe}
- Number of people: ${headcount}
- Dietary restrictions: ${restrictionsText}

Return ONLY a JSON array with this exact structure (no markdown, no code blocks, just raw JSON):
[
  {
    "title": "Catchy 3-6 word title",
    "description": "2-3 sentences describing the meal, make it appetizing and engaging",
    "ingredients": [
      {
        "name": "ingredient name",
        "base_quantity": 1.5,
        "unit": "cups"
      }
    ]
  }
]

Requirements:
- Make each option distinct in cuisine style (e.g., Italian, Asian, Mexican, American)
- Ensure ingredients are realistic and properly scaled for 1 person (base_quantity)
- Use common units: cups, lbs, oz, tbsp, tsp, whole, cloves, etc.
- Include 5-10 ingredients per meal
- Make descriptions appetizing and vivid
- Respect all dietary restrictions strictly`,
        };

        const completion = await retryWithBackoff(async () => {
            return await openai.chat.completions.create({
                model: CONFIG.TEXT_MODEL,
                messages: [systemMessage, userMessage],
                temperature: CONFIG.TEMPERATURE,
                max_tokens: CONFIG.MAX_TOKENS,
            });
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        console.log('OpenAI raw response:', content.substring(0, 200) + '...');

        // Parse the JSON response - handle markdown code blocks
        let meals: GeneratedMeal[];
        try {
            // Remove markdown code blocks if present
            let jsonContent = content.trim();
            if (jsonContent.startsWith('```')) {
                jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            }

            const parsed = JSON.parse(jsonContent);
            // Handle both direct array and object with meals/items/data property
            meals = Array.isArray(parsed)
                ? parsed
                : (parsed.meals || parsed.items || parsed.data || []);

            console.log(`Parsed ${meals.length} meals from OpenAI response`);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', content);
            throw new Error('Invalid JSON response from OpenAI');
        }

        // Validate meals structure
        if (!Array.isArray(meals) || meals.length === 0) {
            throw new Error('No meals generated');
        }

        // Validate each meal has required fields
        meals.forEach((meal, index) => {
            if (!meal.title || !meal.description || !Array.isArray(meal.ingredients)) {
                throw new Error(`Invalid meal structure at index ${index}`);
            }
        });

        console.log(`Successfully generated ${meals.length} meals for vibe: ${vibe}`);
        return meals;

    } catch (error: any) {
        console.error('Error generating meal options:', error);

        // Return fallback meals if generation fails
        if (error?.status === 400 && error?.message?.includes('content_policy')) {
            console.log('Content policy violation, generating alternative prompt...');
            // Retry with sanitized vibe
            const sanitizedVibe = vibe.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
            return generateMealOptions(sanitizedVibe, headcount, dietaryRestrictions);
        }

        throw new Error(`Failed to generate meals: ${error.message}`);
    }
}

/**
 * Generate meal image using DALL-E
 * @param mealTitle - Title of the meal
 * @param mealDescription - Description of the meal
 * @returns Image URL
 */
export async function generateMealImage(
    mealTitle: string,
    mealDescription: string
): Promise<string> {
    try {
        const prompt = `Professional food photography of ${mealTitle}. ${mealDescription}. 
Beautifully plated, appetizing presentation, natural lighting, 
high resolution, restaurant quality, overhead shot, vibrant colors, 
styled for a menu or cookbook`;

        const response = await retryWithBackoff(async () => {
            return await openai.images.generate({
                model: CONFIG.IMAGE_MODEL,
                prompt: prompt.substring(0, 1000), // DALL-E has prompt length limits
                size: '1024x1024',
                quality: 'standard', // Use 'hd' for better quality but higher cost
                style: 'vivid',
                n: 1,
            });
        });

        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) {
            throw new Error('No image URL received from OpenAI');
        }

        console.log(`Successfully generated image for: ${mealTitle}`);
        return imageUrl;

    } catch (error: any) {
        console.error(`Error generating image for ${mealTitle}:`, error);

        // Return placeholder image from Unsplash as fallback
        const fallbackUrl = `https://source.unsplash.com/1024x1024/?food,${encodeURIComponent(mealTitle)}`;
        console.log(`Using fallback image for: ${mealTitle}`);
        return fallbackUrl;
    }
}

/**
 * Scale ingredients based on headcount
 * @param ingredients - Base ingredients (for 1 person)
 * @param baseHeadcount - Base headcount (usually 1)
 * @param targetHeadcount - Target headcount
 * @returns Scaled ingredients
 */
export function scaleIngredients(
    ingredients: Ingredient[],
    baseHeadcount: number,
    targetHeadcount: number
): ScaledIngredient[] {
    const scaleFactor = targetHeadcount / baseHeadcount;

    return ingredients.map(ingredient => {
        let scaledQuantity = ingredient.base_quantity * scaleFactor;

        // Round to practical fractions
        if (scaledQuantity < 0.125) {
            scaledQuantity = 0.125; // Minimum 1/8
        } else if (scaledQuantity < 1) {
            // Round to nearest 1/4
            scaledQuantity = Math.round(scaledQuantity * 4) / 4;
        } else if (scaledQuantity < 10) {
            // Round to nearest 0.5
            scaledQuantity = Math.round(scaledQuantity * 2) / 2;
        } else {
            // Round to nearest whole number
            scaledQuantity = Math.round(scaledQuantity);
        }

        // Handle whole items (don't use fractions)
        if (ingredient.unit === 'whole' || ingredient.unit === 'cloves' ||
            ingredient.unit === 'pieces' || ingredient.unit === 'items') {
            scaledQuantity = Math.max(1, Math.round(ingredient.base_quantity * scaleFactor));
        }

        return {
            name: ingredient.name,
            quantity: scaledQuantity,
            unit: ingredient.unit,
        };
    });
}

/**
 * Generate meals with images for a session
 * @param vibe - The theme or vibe for the meals
 * @param headcount - Number of people
 * @param dietaryRestrictions - Array of dietary restrictions
 * @returns Array of meals with images
 */
export async function generateMealsWithImages(
    vibe: string,
    headcount: number,
    dietaryRestrictions: string[] = []
): Promise<MealWithImage[]> {
    try {
        // Generate meal options
        const generatedMeals = await generateMealOptions(vibe, headcount, dietaryRestrictions);

        // Generate images for all meals in parallel
        const mealsWithImagesPromises = generatedMeals.map(async (meal) => {
            const mealId = crypto.randomBytes(16).toString('hex');
            const imageUrl = await generateMealImage(meal.title, meal.description);

            // Scale ingredients for the headcount
            const scaledIngredients = meal.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.base_quantity * headcount,
                unit: ing.unit
            }));

            return {
                id: mealId,
                title: meal.title,
                description: meal.description,
                ingredients: scaledIngredients,
                image_url: imageUrl,
            };
        });

        const mealsWithImages = await Promise.all(mealsWithImagesPromises);
        console.log(`Successfully generated ${mealsWithImages.length} meals with images`);

        return mealsWithImages;

    } catch (error: any) {
        console.error('Error generating meals with images:', error);
        throw new Error(`Failed to generate meals with images: ${error.message}`);
    }
}

/**
 * Regenerate meal options for an existing session
 * @param sessionId - Session ID
 * @param vibe - The theme or vibe for the meals
 * @param headcount - Number of people
 * @param dietaryRestrictions - Array of dietary restrictions
 * @returns Updated session data
 */
export async function regenerateMealOptions(
    sessionId: string,
    vibe: string,
    headcount: number,
    dietaryRestrictions: string[] = []
): Promise<any> {
    try {
        // Generate new meals with images
        const newMeals = await generateMealsWithImages(vibe, headcount, dietaryRestrictions);

        // Update session in Firebase
        const mealsObject: { [key: string]: any } = {};
        newMeals.forEach(meal => {
            mealsObject[meal.id] = {
                title: meal.title,
                description: meal.description,
                image_url: meal.image_url,
                ingredients: meal.ingredients,
                created_at: Date.now(),
            };
        });

        await firebaseService.updateSession(sessionId, {
            meals: mealsObject,
            status: SessionStatus.VOTING,
        });

        // Get updated session
        const session = await firebaseService.getSession(sessionId);
        const meals = await firebaseService.getSessionMeals(sessionId);

        console.log(`Successfully regenerated meals for session: ${sessionId}`);

        return {
            session,
            meals,
        };

    } catch (error: any) {
        console.error('Error regenerating meal options:', error);
        throw new Error(`Failed to regenerate meals: ${error.message}`);
    }
}

/**
 * AI Service exports
 */
export default {
    generateMealOptions,
    generateMealImage,
    scaleIngredients,
    generateMealsWithImages,
    regenerateMealOptions,
};

// Made with Bob