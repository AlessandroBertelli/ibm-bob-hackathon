// Status service — fetches the live-services indicators rendered on Landing.

import api from './api';

export type ServiceOutcome = 'ok' | 'rate_limited' | 'error';

export interface ServiceStatus {
    key: string;
    label: string;
    outcome: ServiceOutcome;
    last_attempt_at: string | null;
}

export const fetchStatus = async (): Promise<ServiceStatus[]> => {
    const { data } = await api.get<{ services: ServiceStatus[] }>('/status');
    return data.services;
};

// Made with Bob
