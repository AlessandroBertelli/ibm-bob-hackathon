import axios from 'axios';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Fallback placeholder images for different meal types
const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // Salad
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // Pizza
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80', // Pancakes
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // Burger
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80', // Tacos
];

let placeholderIndex = 0;

export async function fetchFoodImage(mealName) {
    // If Unsplash API key is available, try to fetch from Unsplash
    if (UNSPLASH_ACCESS_KEY) {
        try {
            const response = await axios.get('https://api.unsplash.com/search/photos', {
                params: {
                    query: `${mealName} food`,
                    per_page: 1,
                    orientation: 'landscape'
                },
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                return response.data.results[0].urls.regular;
            }
        } catch (error) {
            console.log('Unsplash API error, using placeholder:', error.message);
        }
    }

    // Use placeholder images in rotation
    const image = PLACEHOLDER_IMAGES[placeholderIndex];
    placeholderIndex = (placeholderIndex + 1) % PLACEHOLDER_IMAGES.length;
    return image;
}

// Made with Bob
