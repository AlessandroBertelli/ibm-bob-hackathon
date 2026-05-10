/**
 * Mock Data
 * Pre-defined meal templates for mock AI service
 */

import { GeneratedMeal } from '../../types/ai.types';

/**
 * Meal templates organized by cuisine type
 */
export const MEAL_TEMPLATES: { [key: string]: GeneratedMeal[] } = {
    italian: [
        {
            title: 'Classic Margherita Pizza',
            description: 'A timeless Italian favorite with fresh mozzarella, ripe tomatoes, and fragrant basil on a crispy thin crust. Simple ingredients come together to create pure pizza perfection.',
            image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'pizza dough', base_quantity: 0.25, unit: 'lbs' },
                { name: 'tomato sauce', base_quantity: 0.25, unit: 'cups' },
                { name: 'fresh mozzarella', base_quantity: 3, unit: 'oz' },
                { name: 'fresh basil leaves', base_quantity: 5, unit: 'whole' },
                { name: 'olive oil', base_quantity: 1, unit: 'tbsp' },
                { name: 'garlic', base_quantity: 1, unit: 'cloves' },
                { name: 'salt', base_quantity: 0.5, unit: 'tsp' },
            ],
        },
        {
            title: 'Creamy Fettuccine Alfredo',
            description: 'Rich and indulgent pasta tossed in a velvety parmesan cream sauce. This Roman classic is comfort food at its finest, perfect for a cozy dinner.',
            image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'fettuccine pasta', base_quantity: 4, unit: 'oz' },
                { name: 'heavy cream', base_quantity: 0.5, unit: 'cups' },
                { name: 'parmesan cheese', base_quantity: 2, unit: 'oz' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'garlic', base_quantity: 2, unit: 'cloves' },
                { name: 'black pepper', base_quantity: 0.25, unit: 'tsp' },
                { name: 'fresh parsley', base_quantity: 1, unit: 'tbsp' },
            ],
        },
        {
            title: 'Chicken Parmesan',
            description: 'Crispy breaded chicken cutlets topped with marinara sauce and melted mozzarella. A hearty Italian-American classic that never disappoints.',
            image_url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken breast', base_quantity: 6, unit: 'oz' },
                { name: 'breadcrumbs', base_quantity: 0.25, unit: 'cups' },
                { name: 'marinara sauce', base_quantity: 0.5, unit: 'cups' },
                { name: 'mozzarella cheese', base_quantity: 2, unit: 'oz' },
                { name: 'parmesan cheese', base_quantity: 1, unit: 'oz' },
                { name: 'eggs', base_quantity: 1, unit: 'whole' },
                { name: 'olive oil', base_quantity: 2, unit: 'tbsp' },
                { name: 'Italian seasoning', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Risotto alla Milanese',
            description: 'Luxurious saffron-infused risotto with a creamy texture and golden hue. This Northern Italian specialty is elegant yet comforting.',
            image_url: 'https://images.unsplash.com/photo-1476124369491-c4f9c6c6c8c6?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'arborio rice', base_quantity: 0.5, unit: 'cups' },
                { name: 'chicken broth', base_quantity: 2, unit: 'cups' },
                { name: 'white wine', base_quantity: 0.25, unit: 'cups' },
                { name: 'saffron threads', base_quantity: 0.125, unit: 'tsp' },
                { name: 'parmesan cheese', base_quantity: 1.5, unit: 'oz' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
                { name: 'olive oil', base_quantity: 1, unit: 'tbsp' },
            ],
        },
    ],
    asian: [
        {
            title: 'Pad Thai Noodles',
            description: 'Sweet, tangy, and savory stir-fried rice noodles with shrimp, peanuts, and fresh lime. This iconic Thai street food is bursting with flavor and texture.',
            image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'rice noodles', base_quantity: 4, unit: 'oz' },
                { name: 'shrimp', base_quantity: 4, unit: 'oz' },
                { name: 'eggs', base_quantity: 1, unit: 'whole' },
                { name: 'bean sprouts', base_quantity: 0.5, unit: 'cups' },
                { name: 'peanuts', base_quantity: 2, unit: 'tbsp' },
                { name: 'tamarind paste', base_quantity: 1, unit: 'tbsp' },
                { name: 'fish sauce', base_quantity: 1, unit: 'tbsp' },
                { name: 'lime', base_quantity: 0.5, unit: 'whole' },
                { name: 'green onions', base_quantity: 2, unit: 'whole' },
            ],
        },
        {
            title: 'Chicken Teriyaki Bowl',
            description: 'Tender glazed chicken over fluffy rice with steamed vegetables. This Japanese-inspired dish is both healthy and satisfying with its perfect sweet-savory balance.',
            image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken thighs', base_quantity: 6, unit: 'oz' },
                { name: 'jasmine rice', base_quantity: 0.5, unit: 'cups' },
                { name: 'soy sauce', base_quantity: 2, unit: 'tbsp' },
                { name: 'mirin', base_quantity: 1, unit: 'tbsp' },
                { name: 'brown sugar', base_quantity: 1, unit: 'tbsp' },
                { name: 'broccoli', base_quantity: 1, unit: 'cups' },
                { name: 'sesame seeds', base_quantity: 1, unit: 'tsp' },
                { name: 'ginger', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Vietnamese Pho',
            description: 'Aromatic beef noodle soup with fresh herbs and spices. This comforting Vietnamese classic features a deeply flavorful broth that warms the soul.',
            image_url: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'rice noodles', base_quantity: 4, unit: 'oz' },
                { name: 'beef sirloin', base_quantity: 4, unit: 'oz' },
                { name: 'beef broth', base_quantity: 2, unit: 'cups' },
                { name: 'star anise', base_quantity: 2, unit: 'whole' },
                { name: 'cinnamon stick', base_quantity: 1, unit: 'whole' },
                { name: 'fresh basil', base_quantity: 0.25, unit: 'cups' },
                { name: 'bean sprouts', base_quantity: 0.5, unit: 'cups' },
                { name: 'lime', base_quantity: 0.5, unit: 'whole' },
                { name: 'sriracha', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Korean Bibimbap',
            description: 'Colorful rice bowl topped with seasoned vegetables, beef, and a fried egg. Mix it all together with spicy gochujang for an explosion of flavors and textures.',
            image_url: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'white rice', base_quantity: 0.75, unit: 'cups' },
                { name: 'ground beef', base_quantity: 4, unit: 'oz' },
                { name: 'spinach', base_quantity: 1, unit: 'cups' },
                { name: 'carrots', base_quantity: 0.5, unit: 'cups' },
                { name: 'mushrooms', base_quantity: 0.5, unit: 'cups' },
                { name: 'eggs', base_quantity: 1, unit: 'whole' },
                { name: 'gochujang', base_quantity: 1, unit: 'tbsp' },
                { name: 'sesame oil', base_quantity: 1, unit: 'tsp' },
                { name: 'soy sauce', base_quantity: 1, unit: 'tbsp' },
            ],
        },
    ],
    mexican: [
        {
            title: 'Chicken Tacos al Pastor',
            description: 'Marinated chicken with pineapple, cilantro, and onions in warm corn tortillas. These vibrant tacos bring the flavors of Mexico City street food to your table.',
            image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken breast', base_quantity: 6, unit: 'oz' },
                { name: 'corn tortillas', base_quantity: 3, unit: 'whole' },
                { name: 'pineapple', base_quantity: 0.5, unit: 'cups' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
                { name: 'cilantro', base_quantity: 0.25, unit: 'cups' },
                { name: 'lime', base_quantity: 1, unit: 'whole' },
                { name: 'chipotle peppers', base_quantity: 1, unit: 'whole' },
                { name: 'cumin', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Beef Enchiladas',
            description: 'Rolled tortillas filled with seasoned beef and smothered in rich red sauce and melted cheese. A comforting Mexican classic that\'s perfect for sharing.',
            image_url: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'ground beef', base_quantity: 5, unit: 'oz' },
                { name: 'flour tortillas', base_quantity: 3, unit: 'whole' },
                { name: 'enchilada sauce', base_quantity: 1, unit: 'cups' },
                { name: 'cheddar cheese', base_quantity: 3, unit: 'oz' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
                { name: 'black beans', base_quantity: 0.5, unit: 'cups' },
                { name: 'sour cream', base_quantity: 2, unit: 'tbsp' },
                { name: 'cumin', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Shrimp Fajitas',
            description: 'Sizzling shrimp with colorful peppers and onions served with warm tortillas. These fajitas are light, flavorful, and fun to assemble at the table.',
            image_url: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'shrimp', base_quantity: 6, unit: 'oz' },
                { name: 'bell peppers', base_quantity: 1, unit: 'whole' },
                { name: 'onion', base_quantity: 0.5, unit: 'whole' },
                { name: 'flour tortillas', base_quantity: 3, unit: 'whole' },
                { name: 'lime', base_quantity: 1, unit: 'whole' },
                { name: 'fajita seasoning', base_quantity: 1, unit: 'tbsp' },
                { name: 'olive oil', base_quantity: 2, unit: 'tbsp' },
                { name: 'cilantro', base_quantity: 2, unit: 'tbsp' },
            ],
        },
        {
            title: 'Chicken Quesadillas',
            description: 'Crispy tortillas filled with melted cheese and seasoned chicken. These golden quesadillas are simple, satisfying, and always a crowd-pleaser.',
            image_url: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken breast', base_quantity: 4, unit: 'oz' },
                { name: 'flour tortillas', base_quantity: 2, unit: 'whole' },
                { name: 'monterey jack cheese', base_quantity: 3, unit: 'oz' },
                { name: 'bell peppers', base_quantity: 0.5, unit: 'whole' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
                { name: 'salsa', base_quantity: 0.25, unit: 'cups' },
                { name: 'sour cream', base_quantity: 2, unit: 'tbsp' },
                { name: 'cumin', base_quantity: 0.5, unit: 'tsp' },
            ],
        },
    ],
    american: [
        {
            title: 'Classic Cheeseburger',
            description: 'Juicy beef patty with melted cheddar, crisp lettuce, tomato, and special sauce on a toasted bun. An all-American favorite that never goes out of style.',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'ground beef', base_quantity: 6, unit: 'oz' },
                { name: 'burger buns', base_quantity: 1, unit: 'whole' },
                { name: 'cheddar cheese', base_quantity: 2, unit: 'oz' },
                { name: 'lettuce', base_quantity: 2, unit: 'whole' },
                { name: 'tomato', base_quantity: 2, unit: 'whole' },
                { name: 'onion', base_quantity: 2, unit: 'whole' },
                { name: 'pickles', base_quantity: 3, unit: 'whole' },
                { name: 'mayonnaise', base_quantity: 1, unit: 'tbsp' },
                { name: 'ketchup', base_quantity: 1, unit: 'tbsp' },
            ],
        },
        {
            title: 'BBQ Pulled Pork Sandwich',
            description: 'Tender slow-cooked pork shoulder in tangy BBQ sauce on a soft bun with coleslaw. This Southern classic is messy, delicious, and worth every napkin.',
            image_url: 'https://images.unsplash.com/photo-1619221882018-1c6e0f6e39f8?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'pork shoulder', base_quantity: 6, unit: 'oz' },
                { name: 'BBQ sauce', base_quantity: 0.25, unit: 'cups' },
                { name: 'burger buns', base_quantity: 1, unit: 'whole' },
                { name: 'coleslaw', base_quantity: 0.5, unit: 'cups' },
                { name: 'apple cider vinegar', base_quantity: 1, unit: 'tbsp' },
                { name: 'brown sugar', base_quantity: 1, unit: 'tbsp' },
                { name: 'paprika', base_quantity: 1, unit: 'tsp' },
            ],
        },
        {
            title: 'Buffalo Chicken Wings',
            description: 'Crispy fried wings tossed in spicy buffalo sauce with cool ranch dressing. Perfect for game day or any time you crave bold, tangy flavors.',
            image_url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken wings', base_quantity: 8, unit: 'oz' },
                { name: 'buffalo sauce', base_quantity: 0.25, unit: 'cups' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'ranch dressing', base_quantity: 2, unit: 'tbsp' },
                { name: 'celery sticks', base_quantity: 3, unit: 'whole' },
                { name: 'garlic powder', base_quantity: 0.5, unit: 'tsp' },
                { name: 'cayenne pepper', base_quantity: 0.25, unit: 'tsp' },
            ],
        },
        {
            title: 'Mac and Cheese',
            description: 'Creamy, cheesy pasta baked to golden perfection. This ultimate comfort food features a rich cheese sauce and crispy breadcrumb topping.',
            image_url: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'elbow macaroni', base_quantity: 4, unit: 'oz' },
                { name: 'cheddar cheese', base_quantity: 4, unit: 'oz' },
                { name: 'milk', base_quantity: 0.75, unit: 'cups' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'flour', base_quantity: 2, unit: 'tbsp' },
                { name: 'breadcrumbs', base_quantity: 2, unit: 'tbsp' },
                { name: 'paprika', base_quantity: 0.25, unit: 'tsp' },
            ],
        },
    ],
    comfort: [
        {
            title: 'Chicken Pot Pie',
            description: 'Flaky pastry crust filled with tender chicken and vegetables in a creamy sauce. This homestyle classic is the definition of comfort in a dish.',
            image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'chicken breast', base_quantity: 5, unit: 'oz' },
                { name: 'pie crust', base_quantity: 0.25, unit: 'lbs' },
                { name: 'carrots', base_quantity: 0.5, unit: 'cups' },
                { name: 'peas', base_quantity: 0.5, unit: 'cups' },
                { name: 'potatoes', base_quantity: 0.5, unit: 'cups' },
                { name: 'chicken broth', base_quantity: 1, unit: 'cups' },
                { name: 'heavy cream', base_quantity: 0.25, unit: 'cups' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'flour', base_quantity: 2, unit: 'tbsp' },
            ],
        },
        {
            title: 'Beef Stew',
            description: 'Hearty chunks of beef with root vegetables in a rich, savory broth. This warming stew gets better with time and fills your home with amazing aromas.',
            image_url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'beef chuck', base_quantity: 6, unit: 'oz' },
                { name: 'potatoes', base_quantity: 1, unit: 'cups' },
                { name: 'carrots', base_quantity: 0.75, unit: 'cups' },
                { name: 'onion', base_quantity: 0.5, unit: 'whole' },
                { name: 'beef broth', base_quantity: 2, unit: 'cups' },
                { name: 'tomato paste', base_quantity: 1, unit: 'tbsp' },
                { name: 'red wine', base_quantity: 0.25, unit: 'cups' },
                { name: 'thyme', base_quantity: 1, unit: 'tsp' },
                { name: 'bay leaves', base_quantity: 1, unit: 'whole' },
            ],
        },
        {
            title: 'Meatloaf with Mashed Potatoes',
            description: 'Classic seasoned meatloaf with a tangy glaze served alongside creamy mashed potatoes. This nostalgic dinner is pure comfort food bliss.',
            image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826d1e5?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'ground beef', base_quantity: 6, unit: 'oz' },
                { name: 'breadcrumbs', base_quantity: 0.25, unit: 'cups' },
                { name: 'eggs', base_quantity: 1, unit: 'whole' },
                { name: 'ketchup', base_quantity: 2, unit: 'tbsp' },
                { name: 'potatoes', base_quantity: 2, unit: 'whole' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'milk', base_quantity: 0.25, unit: 'cups' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
            ],
        },
        {
            title: 'Grilled Cheese and Tomato Soup',
            description: 'Crispy, buttery grilled cheese sandwich paired with creamy tomato soup. This iconic duo is the ultimate comfort food combination.',
            image_url: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&h=600&fit=crop',
            ingredients: [
                { name: 'bread', base_quantity: 2, unit: 'whole' },
                { name: 'cheddar cheese', base_quantity: 3, unit: 'oz' },
                { name: 'butter', base_quantity: 2, unit: 'tbsp' },
                { name: 'canned tomatoes', base_quantity: 1, unit: 'cups' },
                { name: 'heavy cream', base_quantity: 0.25, unit: 'cups' },
                { name: 'onion', base_quantity: 0.25, unit: 'whole' },
                { name: 'garlic', base_quantity: 2, unit: 'cloves' },
                { name: 'basil', base_quantity: 1, unit: 'tsp' },
            ],
        },
    ],
};

/**
 * Get meal templates based on vibe keywords
 * @param vibe - The vibe/theme string
 * @returns Array of meal templates
 */
export function getMealTemplatesByVibe(vibe: string): GeneratedMeal[] {
    const vibeLower = vibe.toLowerCase();

    // Check for cuisine keywords
    if (vibeLower.includes('italian') || vibeLower.includes('pasta') || vibeLower.includes('pizza')) {
        return MEAL_TEMPLATES.italian;
    }
    if (vibeLower.includes('asian') || vibeLower.includes('chinese') || vibeLower.includes('japanese') ||
        vibeLower.includes('thai') || vibeLower.includes('korean') || vibeLower.includes('vietnamese')) {
        return MEAL_TEMPLATES.asian;
    }
    if (vibeLower.includes('mexican') || vibeLower.includes('taco') || vibeLower.includes('burrito')) {
        return MEAL_TEMPLATES.mexican;
    }
    if (vibeLower.includes('american') || vibeLower.includes('burger') || vibeLower.includes('bbq')) {
        return MEAL_TEMPLATES.american;
    }
    if (vibeLower.includes('comfort') || vibeLower.includes('cozy') || vibeLower.includes('homestyle')) {
        return MEAL_TEMPLATES.comfort;
    }

    // Default: return a mix from all cuisines
    return [
        ...MEAL_TEMPLATES.italian.slice(0, 1),
        ...MEAL_TEMPLATES.asian.slice(0, 1),
        ...MEAL_TEMPLATES.mexican.slice(0, 1),
        ...MEAL_TEMPLATES.american.slice(0, 1),
    ];
}

/**
 * Filter meals by dietary restrictions
 * @param meals - Array of meals
 * @param restrictions - Array of dietary restrictions
 * @returns Filtered meals
 */
export function filterMealsByDietaryRestrictions(
    meals: GeneratedMeal[],
    restrictions: string[]
): GeneratedMeal[] {
    if (!restrictions || restrictions.length === 0) {
        return meals;
    }

    return meals.filter(meal => {
        const mealText = `${meal.title} ${meal.description} ${meal.ingredients.map(i => i.name).join(' ')}`.toLowerCase();

        for (const restriction of restrictions) {
            const restrictionLower = restriction.toLowerCase();

            // Vegetarian check
            if (restrictionLower.includes('vegetarian')) {
                if (mealText.includes('chicken') || mealText.includes('beef') ||
                    mealText.includes('pork') || mealText.includes('shrimp') ||
                    mealText.includes('fish') || mealText.includes('meat')) {
                    return false;
                }
            }

            // Vegan check
            if (restrictionLower.includes('vegan')) {
                if (mealText.includes('chicken') || mealText.includes('beef') ||
                    mealText.includes('pork') || mealText.includes('shrimp') ||
                    mealText.includes('fish') || mealText.includes('meat') ||
                    mealText.includes('cheese') || mealText.includes('milk') ||
                    mealText.includes('cream') || mealText.includes('egg') ||
                    mealText.includes('butter')) {
                    return false;
                }
            }

            // Gluten-free check
            if (restrictionLower.includes('gluten')) {
                if (mealText.includes('pasta') || mealText.includes('bread') ||
                    mealText.includes('flour') || mealText.includes('noodle') ||
                    mealText.includes('crust') || mealText.includes('tortilla')) {
                    return false;
                }
            }

            // Dairy-free check
            if (restrictionLower.includes('dairy')) {
                if (mealText.includes('cheese') || mealText.includes('milk') ||
                    mealText.includes('cream') || mealText.includes('butter')) {
                    return false;
                }
            }
        }

        return true;
    });
}

// Made with Bob