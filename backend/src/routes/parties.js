import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/storage.js';
import { generateMeals } from '../services/mealGenerator.js';

const router = express.Router();

// Create a new party
router.post('/', async (req, res) => {
    try {
        const { vibe, headcount, dietaryRestrictions } = req.body;

        // Validation
        if (!vibe || !headcount) {
            return res.status(400).json({ error: 'Vibe and headcount are required' });
        }

        if (headcount < 2 || headcount > 20) {
            return res.status(400).json({ error: 'Headcount must be between 2 and 20' });
        }

        // Generate meals
        const meals = await generateMeals(vibe, headcount, dietaryRestrictions);

        // Create party
        const party = {
            id: uuidv4(),
            vibe,
            headcount,
            dietaryRestrictions: dietaryRestrictions || {},
            meals,
            createdAt: new Date().toISOString(),
            status: 'voting'
        };

        storage.createParty(party);

        res.json({
            partyId: party.id,
            party
        });
    } catch (error) {
        console.error('Error creating party:', error);
        res.status(500).json({ error: 'Failed to create party' });
    }
});

// Get party details
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const party = storage.getParty(id);

        if (!party) {
            return res.status(404).json({ error: 'Party not found' });
        }

        res.json({ party });
    } catch (error) {
        console.error('Error fetching party:', error);
        res.status(500).json({ error: 'Failed to fetch party' });
    }
});

// Get party status (for checking winner)
router.get('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const party = storage.getParty(id);

        if (!party) {
            return res.status(404).json({ error: 'Party not found' });
        }

        const winner = storage.checkForWinner(id);
        const guests = storage.getGuestsByParty(id);

        res.json({
            status: party.status,
            guestCount: guests.length,
            winner: winner || null
        });
    } catch (error) {
        console.error('Error fetching party status:', error);
        res.status(500).json({ error: 'Failed to fetch party status' });
    }
});

export default router;

// Made with Bob
