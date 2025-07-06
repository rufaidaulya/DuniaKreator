// This file simulates a backend service for retrieving API keys.
// In a real-world scenario, this would be a secure server endpoint.

const apiKeys = {
  server1: 'AIzaSyBYvrJX_oC25mMzkMTKohiLIjFL7wOIZEA',
  server2: 'AIzaSyD7jLgJEHiJ4gfZwxIRa5jqVNSHUQaBlWM',
  server3: 'AIzaSyCsaD6Yx6vpSO786nNJOvGsuqMckd3Ious',
  server4: 'AIzaSyDtQkPz-3nH0x_o7j0LOzv-3cZbx80vB3E',
  server5: 'AIzaSyBf4gVxnKDpRm4kgiZFPnLKwfwzM6hMhFw',
};

export type ServerId = keyof typeof apiKeys;

export const ALL_SERVERS: ServerId[] = ['server1', 'server2', 'server3', 'server4', 'server5'];

/**
 * Simulates fetching an API key from a backend.
 * In a real application, this would be an HTTP request.
 * @param serverId The identifier for the server ('server1', 'server2', 'server3').
 * @returns The API key string or null if not found.
 */
export const getApiKeyFromServer = (serverId: ServerId): string | null => {
  return apiKeys[serverId] || null;
};