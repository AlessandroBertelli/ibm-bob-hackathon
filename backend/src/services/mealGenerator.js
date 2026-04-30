import { v4 as uuidv4 } from 'uuid';
import { fetchFoodImage } from './imageService.js';

// Predefined meal templates for MVP (no OpenAI needed)
const MEAL_TEMPLATES = {
    fancy: [
        {
            title: 'Truffle Risotto',
            description: 'Creamy arborio rice with wild mushrooms and black truffle oil',
            baseIngredients: ['arborio rice', 'mushrooms', 'truffle oil', 'parmesan', 'white wine', 'vegetable broth', 'butter', 'onion']
        },
        {
            title: 'Pan-Seared Salmon',
            description: 'Atlantic salmon with lemon butter sauce and asparagus',
            baseIngredients: ['salmon fillets', 'asparagus', 'lemon', 'butter', 'garlic', 'white wine', 'olive oil', 'herbs']
        },
        {
            title: 'Beef Wellington',
            description: 'Tender beef wrapped in puff pastry with mushroom duxelles',
            baseIngredients: ['beef tenderloin', 'puff pastry', 'mushrooms', 'pâté', 'egg', 'thyme', 'mustard']
        }
    ],
    casual: [
        {
            title: 'Gourmet Burgers',
            description: 'Juicy beef patties with caramelized onions and special sauce',
            baseIngredients: ['ground beef', 'burger buns', 'cheddar cheese', 'lettuce', 'tomato', 'onions', 'pickles', 'special sauce']
        },
        {
            title: 'BBQ Chicken Pizza',
            description: 'Homemade pizza with BBQ sauce, grilled chicken, and red onions',
            baseIngredients: ['pizza dough', 'BBQ sauce', 'chicken breast', 'mozzarella', 'red onions', 'cilantro']
        },
        {
            title: 'Loaded Nachos',
            description: 'Crispy tortilla chips with melted cheese, jalapeños, and all the fixings',
            baseIngredients: ['tortilla chips', 'cheddar cheese', 'ground beef', 'jalapeños', 'sour cream', 'guacamole', 'salsa', 'black beans']
        }
    ],
    healthy: [
        {
            title: 'Buddha Bowl',
            description: 'Quinoa bowl with roasted vegetables, chickpeas, and tahini dressing',
            baseIngredients: ['quinoa', 'chickpeas', 'sweet potato', 'kale', 'avocado', 'tahini', 'lemon', 'olive oil']
        },
        {
            title: 'Grilled Chicken Salad',
            description: 'Mixed greens with grilled chicken, berries, and balsamic vinaigrette',
            baseIngredients: ['chicken breast', 'mixed greens', 'strawberries', 'walnuts', 'feta cheese', 'balsamic vinegar', 'olive oil']
        },
        {
            title: 'Veggie Stir-Fry',
            description: 'Colorful vegetables with tofu in a ginger-soy sauce',
            baseIngredients: ['tofu', 'broccoli', 'bell peppers', 'carrots', 'snap peas', 'ginger', 'soy sauce', 'sesame oil', 'rice']
        }
    ],
    comfort: [
        {
            title: 'Mac and Cheese',
            description: 'Creamy three-cheese pasta with crispy breadcrumb topping',
            baseIngredients: ['pasta', 'cheddar cheese', 'mozzarella', 'parmesan', 'milk', 'butter', 'flour', 'breadcrumbs']
        },
        {
            title: 'Chicken Pot Pie',
            description: 'Flaky pastry filled with chicken and vegetables in creamy sauce',
            baseIngredients: ['chicken', 'puff pastry', 'carrots', 'peas', 'potatoes', 'cream', 'chicken broth', 'butter', 'flour']
        },
        {
            title: 'Spaghetti Bolognese',
            description: 'Classic Italian pasta with rich meat sauce',
            baseIngredients: ['spaghetti', 'ground beef', 'tomatoes', 'onion', 'garlic', 'red wine', 'basil', 'parmesan']
        }
    ],
    mexican: [
        {
            title: 'Street Tacos',
            description: 'Authentic corn tortillas with seasoned meat, cilantro, and lime',
            baseIngredients: ['corn tortillas', 'beef or chicken', 'cilantro', 'onions', 'lime', 'salsa', 'avocado']
        },
        {
            title: 'Chicken Enchiladas',
            description: 'Rolled tortillas with chicken, cheese, and red enchilada sauce',
            baseIngredients: ['flour tortillas', 'chicken', 'enchilada sauce', 'cheese', 'sour cream', 'black beans', 'rice']
        },
        {
            title: 'Fajita Platter',
            description: 'Sizzling peppers and onions with your choice of protein',
            baseIngredients: ['bell peppers', 'onions', 'chicken or beef', 'tortillas', 'fajita seasoning', 'lime', 'guacamole', 'salsa']
        }
    ]
};

function selectMealCategory(vibe) {
    const vibeLower = vibe.toLowerCase();

    if (vibeLower.includes('fancy') || vibeLower.includes('elegant') || vibeLower.includes('upscale')) {
        return 'fancy';
    } else if (vibeLower.includes('healthy') || vibeLower.includes('light') || vibeLower.includes('fresh')) {
        return 'healthy';
    } else if (vibeLower.includes('comfort') || vibeLower.includes('cozy') || vibeLower.includes('homey')) {
        return 'comfort';
    } else if (vibeLower.includes('taco') || vibeLower.includes('mexican') || vibeLower.includes('fiesta')) {
        return 'mexican';
    } else {
        return 'casual';
    }
}

function scaleIngredients(ingredients, headcount) {
    // Simple scaling logic - multiply quantities
    const baseServings = 4;
    const multiplier = headcount / baseServings;

    return ingredients.map(ingredient => {
        // For MVP, just add quantity prefix
        if (multiplier <= 1) {
            return ingredient;
        } else if (multiplier <= 2) {
            return `${Math.ceil(multiplier)}x ${ingredient}`;
        } else {
            return `${Math.ceil(multiplier)}x ${ingredient}`;
        }
    });
}

function filterByDietaryRestrictions(meals, restrictions) {
    if (!restrictions) return meals;

    return meals.filter(meal => {
        const title = meal.title.toLowerCase();
        const ingredients = meal.baseIngredients.join(' ').toLowerCase();

        // Simple filtering logic
        if (restrictions.vegan) {
            if (ingredients.includes('beef') || ingredients.includes('chicken') ||
                ingredients.includes('salmon') || ingredients.includes('cheese') ||
                ingredients.includes('egg') || ingredients.includes('milk')) {
                return false;
            }
        }

        if (restrictions.glutenFree) {
            if (ingredients.includes('pasta') || ingredients.includes('flour') ||
                ingredients.includes('bread') || ingredients.includes('tortilla')) {
                return false;
            }
        }

        return true;
    });
}

export async function generateMeals(vibe, headcount, dietaryRestrictions = {}) {
    const category = selectMealCategory(vibe);
    let availableMeals = [...MEAL_TEMPLATES[category]];

    // Filter by dietary restrictions
    availableMeals = filterByDietaryRestrictions(availableMeals, dietaryRestrictions);

    // If no meals left after filtering, use all from category
    if (availableMeals.length === 0) {
        availableMeals = [...MEAL_TEMPLATES[category]];
    }

    // Select 3-5 random meals
    const numMeals = Math.min(availableMeals.length, Math.floor(Math.random() * 3) + 3);
    const selectedMeals = [];
    const usedIndices = new Set();

    while (selectedMeals.length < numMeals && selectedMeals.length < availableMeals.length) {
        const index = Math.floor(Math.random() * availableMeals.length);
        if (!usedIndices.has(index)) {
            usedIndices.add(index);
            selectedMeals.push(availableMeals[index]);
        }
    }

    // Generate meal objects with images
    const meals = await Promise.all(
        selectedMeals.map(async (template) => {
            const imageUrl = await fetchFoodImage(template.title);

            return {
                id: uuidv4(),
                title: template.title,
                description: template.description,
                imageUrl,
                ingredients: scaleIngredients(template.baseIngredients, headcount),
                votes: {}
            };
        })
    );

    return meals;
}

// Made with Bob
