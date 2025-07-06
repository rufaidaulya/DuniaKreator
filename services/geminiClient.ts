// This file simulates a backend service for retrieving API keys.
// In a real-world scenario, this would be a secure server endpoint.

import { getApiKeyFromServer, ServerId } from '../backend/api';

/**
 * Retrieves the user-selected API key for all AI tasks.
 * Throws an error if the server is not set.
 * @returns The AI API key string.
 */
const getApiKey = (): string => {
    const selectedServer = localStorage.getItem('selectedServer') as ServerId | null;
    if (!selectedServer) {
        // Default to server1 if nothing is selected, so the app works on first load.
        const defaultServer = 'server1';
        localStorage.setItem('selectedServer', defaultServer);
        const apiKey = getApiKeyFromServer(defaultServer);
        if (apiKey) return apiKey;
        throw new Error("Server AI belum dipilih dan server default gagal dimuat. Silakan pilih server di Pengaturan.");
    }
    const apiKey = getApiKeyFromServer(selectedServer);
    if (!apiKey) {
        throw new Error(`Kunci API tidak ditemukan untuk server yang dipilih: ${selectedServer}. Silakan pilih server lain di Pengaturan.`);
    }
    return apiKey;
};

export const getTextApiKey = (): string => {
    return getApiKey();
};

export const getImageApiKey = (): string => {
    return getApiKey();
};
