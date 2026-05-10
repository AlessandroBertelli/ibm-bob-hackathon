// Account service — currently just the deletion endpoint.

import api from './api';

export const deleteAccount = async (): Promise<void> => {
    await api.delete('/auth/account');
};

// Made with Bob
