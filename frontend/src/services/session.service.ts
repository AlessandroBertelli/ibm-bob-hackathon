// Session service — wraps the backend /api/sessions endpoints.

import api from './api';
import type { MySession, SessionWithMeals } from '../types';

export interface CreateSessionInput {
    vibe: string;
    headcount: number;
    dietary: string[];
    selected_saved_meal_ids: string[];
}

export const createSession = async (input: CreateSessionInput): Promise<SessionWithMeals> => {
    const { data } = await api.post<{ session: SessionWithMeals }>('/sessions', input);
    return data.session;
};

export const getSession = async (id: string): Promise<SessionWithMeals> => {
    const { data } = await api.get<{ session: SessionWithMeals }>(`/sessions/${id}`);
    return data.session;
};

export const getSessionByToken = async (token: string): Promise<SessionWithMeals> => {
    const { data } = await api.get<{ session: SessionWithMeals }>(`/sessions/token/${token}`);
    return data.session;
};

export const regenerateSession = async (id: string): Promise<SessionWithMeals> => {
    const { data } = await api.post<{ session: SessionWithMeals }>(`/sessions/${id}/regenerate`);
    return data.session;
};

export const listMySessions = async (): Promise<MySession[]> => {
    const { data } = await api.get<{ sessions: MySession[] }>('/sessions/mine');
    return data.sessions;
};

// Made with Bob
