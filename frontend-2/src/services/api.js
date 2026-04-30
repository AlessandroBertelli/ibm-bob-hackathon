import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'bytematch.authToken';
const HOST_EMAIL_KEY = 'bytematch.hostEmail';

const getStoredToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

const setStoredToken = (token) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        /* ignore */
    }
};

const getStoredHostEmail = () => {
    try {
        return localStorage.getItem(HOST_EMAIL_KEY);
    } catch {
        return null;
    }
};

const setStoredHostEmail = (email) => {
    try {
        localStorage.setItem(HOST_EMAIL_KEY, email);
    } catch {
        /* ignore */
    }
};

api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const ensureDevAuth = async (email) => {
    const targetEmail =
        email || getStoredHostEmail() || `host-${Date.now()}@bytematch.dev`;
    const res = await api.post('/auth/dev-login', { email: targetEmail });
    setStoredToken(res.data.token);
    setStoredHostEmail(targetEmail);
    return res.data.token;
};

const formatIngredient = (ingredient) => {
    if (!ingredient) return '';
    if (typeof ingredient === 'string') return ingredient;
    const { name, quantity, unit, base_quantity } = ingredient;
    const qty = quantity ?? base_quantity;
    if (qty != null && unit && name) return `${qty} ${unit} ${name}`;
    if (qty != null && name) return `${qty} ${name}`;
    return name || '';
};

const adaptMeal = (meal, mealStats) => {
    const stats = mealStats?.[meal.id] ?? null;
    const voters = stats?.voters || {};
    const votesObj = {};
    for (const guestId of Object.keys(voters)) {
        votesObj[guestId] = voters[guestId];
    }
    const rawIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    return {
        id: meal.id,
        title: meal.title,
        description: meal.description,
        imageUrl: meal.image_url || meal.imageUrl,
        ingredients: rawIngredients.map(formatIngredient).filter(Boolean),
        rawIngredients: rawIngredients.map((i) =>
            typeof i === 'string'
                ? { name: i, quantity: 1, unit: 'whole' }
                : {
                      name: i.name,
                      quantity: i.quantity ?? i.base_quantity ?? 1,
                      unit: i.unit || 'whole',
                  }
        ),
        votes: votesObj,
        yesCount: stats?.yes_votes ?? 0,
        noCount: stats?.no_votes ?? 0,
        totalVotes: stats?.total_votes ?? 0,
    };
};

const adaptParty = (session, votingStatus, shareToken) => {
    if (!session) return null;
    const meals = session.meals || [];
    return {
        id: session.id,
        vibe: session.vibe,
        headcount: session.headcount,
        dietaryRestrictions: session.dietary_restrictions || [],
        status: session.status,
        shareToken,
        shareLink: session.share_link,
        meals: meals.map((m) => adaptMeal(m, votingStatus?.meal_stats)),
        progress: votingStatus?.progress || null,
        winner: votingStatus?.winner || null,
        guests: votingStatus?.guests || [],
        createdAt: session.created_at,
        expiresAt: session.expires_at,
    };
};

const fetchVotingStatusSafe = async (sessionId) => {
    try {
        const res = await api.get(`/sessions/${sessionId}/voting-status`);
        return res.data;
    } catch {
        return null;
    }
};

export const partyAPI = {
    createParty: async (data) => {
        await ensureDevAuth();

        const dietary = [];
        if (data.dietaryRestrictions?.vegan) dietary.push('vegan');
        if (data.dietaryRestrictions?.glutenFree) dietary.push('gluten-free');

        const created = await api.post('/sessions', {
            vibe: data.vibe,
            headcount: data.headcount,
            dietary_restrictions: dietary,
        });
        const sessionId = created.data.session.id;

        const shareRes = await api.post(`/sessions/${sessionId}/share-link`);

        return {
            partyId: sessionId,
            shareToken: shareRes.data.share_token,
            shareLink: shareRes.data.share_link,
        };
    },

    getParty: async (id) => {
        const res = await api.get(`/sessions/${id}`);
        const session = res.data.session;
        const votingStatus = await fetchVotingStatusSafe(id);
        const shareToken =
            session.share_link?.split('/vote/')[1] || undefined;
        return { party: adaptParty(session, votingStatus, shareToken) };
    },

    getPartyByShareToken: async (shareToken) => {
        const res = await api.get(`/sessions/token/${shareToken}`);
        const session = res.data.session;
        const votingStatus = await fetchVotingStatusSafe(session.id);
        return { party: adaptParty(session, votingStatus, shareToken) };
    },

    getPartyStatus: async (id) => {
        const res = await api.get(`/sessions/${id}/voting-status`);
        return res.data;
    },

    joinAsGuest: async (sessionId, guestName) => {
        const res = await api.post(`/sessions/${sessionId}/join`, {
            guest_name: guestName,
        });
        return {
            guestId: res.data.guest_id,
            session: res.data.session,
        };
    },

    submitVote: async ({ sessionId, guestId, mealId, vote }) => {
        const res = await api.post('/votes', {
            session_id: sessionId,
            guest_id: guestId,
            meal_id: mealId,
            vote_type: vote,
        });
        return res.data;
    },
};

export const recipeAPI = {
    generateRecipe: async ({ title, description, ingredients, headcount }) => {
        const cleanIngredients = (ingredients || [])
            .map((i) => {
                if (typeof i === 'string') {
                    const match = i.match(/^([\d./]+)\s*(\S+)?\s*(.*)$/);
                    if (match) {
                        const qty = parseFloat(match[1]);
                        return {
                            name: (match[3] || match[2] || i).trim(),
                            quantity: Number.isFinite(qty) ? qty : 1,
                            unit: match[3] ? match[2] || 'whole' : 'whole',
                        };
                    }
                    return { name: i, quantity: 1, unit: 'whole' };
                }
                return {
                    name: i.name,
                    quantity: i.quantity ?? i.base_quantity ?? 1,
                    unit: i.unit || 'whole',
                };
            })
            .filter((i) => i.name);

        const res = await api.post('/ai/generate-recipe', {
            title,
            description,
            headcount,
            ingredients: cleanIngredients,
        });
        return res.data.recipe;
    },
};

export const authAPI = {
    devLogin: ensureDevAuth,
    getStoredToken,
    getStoredEmail: getStoredHostEmail,
};
