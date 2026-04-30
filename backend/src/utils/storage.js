// In-memory storage for parties and guests
const parties = new Map();
const guests = new Map();

export const storage = {
    // Party operations
    createParty(party) {
        parties.set(party.id, party);
        return party;
    },

    getParty(id) {
        return parties.get(id);
    },

    updateParty(id, updates) {
        const party = parties.get(id);
        if (party) {
            const updated = { ...party, ...updates };
            parties.set(id, updated);
            return updated;
        }
        return null;
    },

    deleteParty(id) {
        return parties.delete(id);
    },

    getAllParties() {
        return Array.from(parties.values());
    },

    // Guest operations
    addGuest(guest) {
        guests.set(guest.id, guest);
        return guest;
    },

    getGuest(id) {
        return guests.get(id);
    },

    getGuestsByParty(partyId) {
        return Array.from(guests.values()).filter(g => g.partyId === partyId);
    },

    removeGuest(id) {
        return guests.delete(id);
    },

    // Vote operations
    recordVote(partyId, mealId, guestId, vote) {
        const party = parties.get(partyId);
        if (!party) return null;

        const meal = party.meals.find(m => m.id === mealId);
        if (!meal) return null;

        if (!meal.votes) {
            meal.votes = {};
        }

        meal.votes[guestId] = vote;
        parties.set(partyId, party);
        return party;
    },

    // Winner detection
    checkForWinner(partyId) {
        const party = parties.get(partyId);
        if (!party) return null;

        const guestCount = this.getGuestsByParty(partyId).length;
        if (guestCount === 0) return null;

        for (const meal of party.meals) {
            if (!meal.votes) continue;

            const votes = Object.values(meal.votes);
            const yesVotes = votes.filter(v => v === 'yes').length;

            // Unanimous winner
            if (yesVotes === guestCount && yesVotes > 0) {
                return meal;
            }
        }

        return null;
    }
};

// Made with Bob
