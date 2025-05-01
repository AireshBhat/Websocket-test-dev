import { TestKey } from '../types';

/**
 * Fetch all available test keys from the server
 */
async function fetchTestKeys(): Promise<TestKey[]> {
  try {
    const response = await fetch('http://localhost:8080/api/dev/test-keys');
    if (!response.ok) {
      throw new Error(`Failed to fetch test keys: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching test keys:', error);
    throw error;
  }
}

/**
 * Fetch a pre-generated authentication message for a specific key
 */
async function fetchAuthMessage(keyIndex: number): Promise<any> {
  try {
    const response = await fetch(`http://localhost:8080/api/dev/test-auth-message/${keyIndex}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch auth message: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching auth message:', error);
    throw error;
  }
}

export const testKeysService = {
  fetchTestKeys,
  fetchAuthMessage
};