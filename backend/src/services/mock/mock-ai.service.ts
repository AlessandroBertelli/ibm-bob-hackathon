/**
 * Mock AI Service
 * Provides deterministic meal generation for local testing without OpenAI API
 */

import crypto from 'crypto';
import {
    GeneratedMeal,
    MealWithImage,
    Ingredient,
    ScaledIngredient,
} from '../../types/ai.types';
import { SessionStatus } from '../../types/session.types';
import mockFirebaseService from './mock-firebase.service';
import { getMealTemplatesByVibe, filterMealsByDietaryRestrictions } from './mock-data';

/**
 * Configuration constants
 */
const CONFIG = {
    NUM_MEALS: 4,
    IMAGE_DELAY_MS: 100, // Simulate image generation delay
};

/**
 * Generate mock meal options based on vibe
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
    console.log(`[MOCK AI] Generating meals for vibe: "${vibe}", headcount: ${headcount}`);

    // Get meal templates based on vibe
    let meals = getMealTemplatesByVibe(vibe);

    // Filter by dietary restrictions
    if (dietaryRestrictions.length > 0) {
        console.log(`[MOCK AI] Applying dietary restrictions: ${dietaryRestrictions.join(', ')}`);
        meals = filterMealsByDietaryRestrictions(meals, dietaryRestrictions);
    }

    // If we don't have enough meals after filtering, add some back
    if (meals.length < CONFIG.NUM_MEALS) {
        console.log(`[MOCK AI] Not enough meals after filtering, using all available: ${meals.length}`);
        // Just use what we have
    } else {
        // Select NUM_MEALS meals deterministically based on vibe
        const hash = hashString(vibe);
        const startIndex = hash % (meals.length - CONFIG.NUM_MEALS + 1);
        meals = meals.slice(startIndex, startIndex + CONFIG.NUM_MEALS);
    }

    console.log(`[MOCK AI] Generated ${meals.length} meals`);
    return meals;
}

/**
 * Generate mock meal image URL
 * @param mealTitle - Title of the meal
 * @param mealDescription - Description of the meal
 * @returns Image URL from Unsplash
 */
export async function generateMealImage(
    mealTitle: string,
    mealDescription: string
): Promise<string> {
    // Simulate image generation delay
    await delay(CONFIG.IMAGE_DELAY_MS);

    // Extract key food terms for better Unsplash results
    const foodTerms = extractFoodTerms(mealTitle);
    const searchQuery = foodTerms.join(',');

    // Use Unsplash Source API with deterministic seed based on title
    const seed = hashString(mealTitle);
    const imageUrl = `https://source.unsplash.com/1024x1024/?food,${encodeURIComponent(searchQuery)}&sig=${seed}`;

    console.log(`[MOCK AI] Generated image URL for: ${mealTitle}`);
    return imageUrl;
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
    console.log(`[MOCK AI] Generating meals with images...`);

    // Generate meal options
    const generatedMeals = await generateMealOptions(vibe, headcount, dietaryRestrictions);

    // Generate images for all meals in parallel
    const mealsWithImagesPromises = generatedMeals.map(async (meal) => {
        const mealId = crypto.randomBytes(16).toString('hex');

        // Use image_url from mock data if available, otherwise generate one
        const imageUrl = meal.image_url || await generateMealImage(meal.title, meal.description);

        // Scale ingredients for the headcount
        const scaledIngredients = scaleIngredients(meal.ingredients, 1, headcount);

        return {
            id: mealId,
            title: meal.title,
            description: meal.description,
            ingredients: scaledIngredients,
            image_url: imageUrl,
        };
    });

    const mealsWithImages = await Promise.all(mealsWithImagesPromises);
    console.log(`[MOCK AI] Successfully generated ${mealsWithImages.length} meals with images`);

    return mealsWithImages;
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
    console.log(`[MOCK AI] Regenerating meals for session: ${sessionId}`);

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

    await mockFirebaseService.updateSession(sessionId, {
        meals: mealsObject,
        status: SessionStatus.VOTING,
    });

    // Get updated session
    const session = await mockFirebaseService.getSession(sessionId);
    const meals = await mockFirebaseService.getSessionMeals(sessionId);

    console.log(`[MOCK AI] Successfully regenerated meals for session: ${sessionId}`);

    return {
        session,
        meals,
    };
}

/**
 * Helper: Hash a string to a number for deterministic selection
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Helper: Extract food-related terms from meal title
 * @param title - Meal title
 * @returns Array of food terms
 */
function extractFoodTerms(title: string): string[] {
    // Remove common words and extract key food terms
    const commonWords = ['the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'classic', 'fresh', 'homemade'];
    const words = title.toLowerCase().split(/\s+/);

    const foodTerms = words.filter(word =>
        word.length > 3 && !commonWords.includes(word)
    );

    // Return first 2-3 terms for better search results
    return foodTerms.slice(0, 3);
}

/**
 * Helper: Delay execution
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock AI Service exports
 */
export default {
    generateMealOptions,
    generateMealImage,
    scaleIngredients,
    generateMealsWithImages,
    regenerateMealOptions,
};

// Made with Bob