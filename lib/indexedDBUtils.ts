/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenerationRecord {
    id: string;
    timestamp: number;
    originalImageUrl: string;
    generatedImages: Record<string, string>; // decade -> blob URL
    metadata?: {
        fileName?: string;
        notes?: string;
    };
}

const DB_NAME = 'PastForwardDB';
const DB_VERSION = 1;
const STORE_NAME = 'generations';

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initializeDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * Save a generation record to IndexedDB
 */
export async function saveGeneration(record: GenerationRecord): Promise<void> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(record);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all generation records from IndexedDB
 */
export async function getAllGenerations(): Promise<GenerationRecord[]> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const records = request.result as GenerationRecord[];
            // Sort by timestamp descending (newest first)
            resolve(records.sort((a, b) => b.timestamp - a.timestamp));
        };
    });
}

/**
 * Get a specific generation record by ID
 */
export async function getGeneration(id: string): Promise<GenerationRecord | null> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Delete a generation record by ID
 */
export async function deleteGeneration(id: string): Promise<void> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Clear all generation records from IndexedDB
 */
export async function clearAllGenerations(): Promise<void> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get the count of generation records
 */
export async function getGenerationCount(): Promise<number> {
    const database = await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Clean up blob URLs from a generation record
 */
export function cleanupGenerationBlobUrls(record: GenerationRecord): void {
    Object.values(record.generatedImages).forEach(url => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    });
    if (record.originalImageUrl && record.originalImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(record.originalImageUrl);
    }
}

