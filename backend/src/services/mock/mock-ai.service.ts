/**
 * Mock AI service. Picks meals from a small built-in library and returns a
 * deterministic placeholder image so dev work doesn't depend on Pollinations
 * or OpenRouter being reachable.
 *
 * `excludedTitles` is honoured so a host's pre-selected meal doesn't get
 * "regenerated" alongside itself.
 */

import { AssembledMeal, GeneratedMeal } from '../../types/ai.types';
import { ScaledIngredient } from '../../types/session.types';
import {
    MEAL_TEMPLATES,
    getMealTemplatesByVibe,
    filterMealsByDietaryRestrictions,
} from './mock-data';

function placeholder(title: string): string {
    const seed = encodeURIComponent(title);
    return `https://picsum.photos/seed/${seed}/1024/1024`;
}

/**
 * Cuisine-aware English cooking instructions. Mock data doesn't carry per-meal
 * recipes, so we pick a richer template based on the meal title + a fallback
 * "everything else" recipe. Verbose enough that the detail modal renders a
 * believable cookbook-style step list during demos. All units metric.
 */

const TEMPLATES: Record<string, string[]> = {
    italian: [
        'Fill a large pot with water, salt it generously, and bring to a rolling boil.',
        'Cook the pasta to al dente per the packet, reserving 250 ml of cooking water before draining.',
        'In a wide pan, warm 2 tbsp olive oil over medium heat. Sweat the finely chopped garlic until fragrant — do not brown.',
        'Add the main ingredients (tomatoes, mushrooms, ground meat, etc.) and cook for 6–8 min, seasoning with salt and pepper.',
        'Splash in some of the reserved pasta water to loosen the sauce into a glossy emulsion.',
        'Drain the pasta and add it straight to the pan. Toss thoroughly so every strand is coated.',
        'Off the heat, stir in a generous handful of freshly grated Parmesan and a tbsp of chopped parsley or basil.',
        'Serve immediately on warmed plates with extra cheese and cracked black pepper at the table.',
    ],
    asian: [
        'Rinse the rice under cold water until it runs clear, then cook per the packet.',
        'While the rice cooks, slice the vegetables thin and even — wok cooking is fast, so prep everything before turning on the heat.',
        'In a small bowl, whisk soy sauce, sesame oil, freshly grated ginger, and minced garlic — this is the seasoning base.',
        'Heat a wok (or a heavy non-stick pan) over high heat. Add 1 tbsp neutral oil and let it shimmer.',
        'Sear the protein (chicken, tofu, prawns) for 3–4 min until browned on all sides, then lift it out.',
        'Add hard veg first (carrots, broccoli) for 2–3 min, then softer veg (peppers, mushrooms) for another 2 min, tossing constantly.',
        'Return the protein to the wok, pour in the seasoning base, and toss vigorously until everything is glossy and coated.',
        'Serve over the rice, scattered with sesame seeds and finely chopped spring onion.',
    ],
    mexican: [
        'Wrap the tortillas in foil and warm them in a 100 °C oven while you prep.',
        'Finely chop the onion, garlic, and chillies — adjust the heat to taste.',
        'Heat a heavy pan (cast iron is best) over medium-high heat for 2 min, then add 1 tbsp oil.',
        'Sweat the onion for 3 min, then the garlic and chillies for a further 30 sec — until fragrant but not browned.',
        'Add the main ingredients (chicken, beans, mushrooms) and season with cumin, paprika, and salt.',
        'Cook for 8–10 min, stirring occasionally, until cooked through and lightly caramelised.',
        'Squeeze fresh lime over the top and fold in a handful of chopped coriander.',
        'Lay tortillas on plates, spoon the filling on top, and finish with avocado, salsa, and sour cream — let everyone roll their own.',
    ],
    american: [
        'Preheat the oven to 200 °C (fan).',
        'Heat a heavy pan (cast iron ideal) over medium-high heat and add 1 tbsp neutral oil.',
        'Season the main ingredient (burger patty, chicken breast, etc.) generously with salt and pepper, then place in the hot pan — do not move it for the first minute.',
        'Sear 3–4 min per side until a deep golden crust forms.',
        'If needed, transfer the pan to the oven and finish for 6–10 min until the internal temperature reads 70 °C.',
        'Cook the sides (fries, slaw, salad) in parallel, or have them ready ahead of time.',
        'Toast the buns briefly, add a generous swipe of sauce, then stack: lettuce, tomato, patty, cheese.',
        'Serve with a cold drink — and have napkins ready, this gets juicy.',
    ],
    comfort: [
        'Preheat the oven to 180 °C and lightly grease a ~25 cm baking dish.',
        'Cut the main ingredients into bite-sized pieces; have your spices and herbs ready to hand.',
        'In a heavy pot, melt 2 tbsp butter over medium heat. Sweat the onion for ~5 min until soft.',
        'Stir in 2 tbsp flour and cook for 1 min, then gradually pour in 250 ml stock or milk while whisking until smooth.',
        'Add the main ingredients, season with salt, pepper, and herbs, and simmer for 10 min.',
        'Pour the mixture into the baking dish and top with grated cheese or mashed potato.',
        'Bake for 25–30 min until the top is golden and bubbling.',
        'Rest for 5 min, then scatter with fresh herbs and serve — perfect for cold evenings.',
    ],
};

function pickTemplate(title: string): string[] {
    const t = title.toLowerCase();
    if (/pizza|pasta|risotto|fettuccine|alfredo|parmesan|carbonara/.test(t)) return TEMPLATES.italian;
    if (/pho|pad thai|teriyaki|bibimbap|noodle|ramen|sushi|wok|stir fry/.test(t)) return TEMPLATES.asian;
    if (/taco|burrito|enchilada|quesadilla|fajita|chipotle|salsa/.test(t)) return TEMPLATES.mexican;
    if (/burger|wing|bbq|pulled pork|mac|cheese steak|cheeseburger/.test(t)) return TEMPLATES.american;
    return TEMPLATES.comfort;
}

function syntheticInstructions(title: string): string[] {
    return pickTemplate(title);
}

function scale(ingredients: GeneratedMeal['ingredients'], headcount: number): ScaledIngredient[] {
    return ingredients.map((i) => ({
        name: i.name,
        unit: i.unit,
        quantity: Math.round(i.base_quantity * headcount * 4) / 4,
    }));
}

function normTitle(s: string): string {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function pickMeals(
    vibe: string,
    dietary: string[],
    count: number,
    excludedTitles: string[]
): GeneratedMeal[] {
    const blocked = new Set(excludedTitles.map(normTitle));
    const exclude = (pool: GeneratedMeal[]) => pool.filter((m) => !blocked.has(normTitle(m.title)));

    let pool = exclude(filterMealsByDietaryRestrictions(getMealTemplatesByVibe(vibe), dietary));

    if (pool.length < count) {
        // Widen to all cuisines, still respecting diet + exclusions.
        const all = exclude(
            filterMealsByDietaryRestrictions(Object.values(MEAL_TEMPLATES).flat(), dietary)
        );
        pool = all.length >= count ? all : exclude(Object.values(MEAL_TEMPLATES).flat());
    }

    return pool.slice(0, count);
}

export async function generateAssembledMeals(opts: {
    sessionId: string;
    vibe: string;
    headcount: number;
    dietary: string[];
    count?: number;
    excludedTitles?: string[];
}): Promise<AssembledMeal[]> {
    const count = opts.count ?? 4;
    if (count === 0) return [];

    // Tiny delay so the UI's loading state is visible in dev.
    await new Promise((r) => setTimeout(r, 600));

    const picked = pickMeals(opts.vibe, opts.dietary, count, opts.excludedTitles ?? []);
    return picked.map((m) => ({
        title: m.title,
        description: m.description,
        image_url: m.image_url ?? placeholder(m.title),
        ingredients: scale(m.ingredients, opts.headcount),
        instructions: m.instructions ?? syntheticInstructions(m.title),
    }));
}

export { scaleIngredients } from '../ai.service';

// Made with Bob
