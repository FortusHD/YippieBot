/**
 * @fileoverview A simple caching utility for the application.
 * Provides in-memory caching with TTL (time-to-live) support to reduce the database load
 * and improve performance for frequently accessed data.
 *
 * @module util/cache
 */

/**
 * A simple in-memory cache with TTL support.
 */
class Cache {
    /**
     * Creates a new cache instance.
     *
     * @param {number} defaultTtl - Default time-to-live in milliseconds for cache entries
     */
    constructor(defaultTtl = 10 * 60 * 1000) { // Default TTL: 10 minute
        this.cache = new Map();
        this.defaultTtl = defaultTtl;
    }

    /**
     * Sets a value in the cache with an optional TTL.
     *
     * @param {string} key - The cache key
     * @param {*} value - The value to cache
     * @param {number} [ttl] - Time-to-live in milliseconds (defaults to the cache instance's defaultTtl)
     * @return {void}
     */
    set(key, value, ttl = this.defaultTtl) {
        const expiry = Date.now() + ttl;

        // Clear any existing timeout for this key
        if (this.cache.has(key)) {
            clearTimeout(this.cache.get(key).timeout);
        }

        // Set timeout to automatically remove the item when it expires
        const timeout = setTimeout(() => {
            this.delete(key);
        }, ttl);

        // Store the value, expiry time, and timeout reference
        this.cache.set(key, { value, expiry, timeout });
    }

    /**
     * Gets a value from the cache.
     *
     * @param {string} key - The cache key
     * @return {*} The cached value, or undefined if not found or expired
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return undefined;
        }

        // Check if the entry has expired
        if (entry.expiry < Date.now()) {
            this.delete(key);
            return undefined;
        }

        return entry.value;
    }

    /**
     * Deletes a value from the cache.
     *
     * @param {string} key - The cache key
     * @return {boolean} True if the item was found and deleted, false otherwise
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            clearTimeout(entry.timeout);
            return this.cache.delete(key);
        }
        return false;
    }

    /**
     * Clears all entries from the cache.
     *
     * @return {void}
     */
    clear() {
        // Clear all timeouts to prevent memory leaks
        for (const entry of this.cache.values()) {
            clearTimeout(entry.timeout);
        }
        this.cache.clear();
    }

    /**
     * Gets or sets a value in the cache using a provider function if the key is not found.
     *
     * @param {string} key - The cache key
     * @param {Function} provider - A function that returns the value to cache if not found
     * @param {number} [ttl] - Time-to-live in milliseconds (defaults to the cache instance's defaultTtl)
     * @return {Promise<*>} The cached or newly fetched value
     */
    async getOrSet(key, provider, ttl = this.defaultTtl) {
        const cachedValue = this.get(key);

        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // If not in cache, call the provider function to get the value
        const value = await provider();

        // Cache the value if it's not undefined or null
        if (value !== undefined && value !== null) {
            this.set(key, value, ttl);
        }

        return value;
    }
}

// Create a singleton instance with a default TTL of 10 minutes
const defaultCache = new Cache(10 * 60 * 1000);

module.exports = {
    Cache,
    defaultCache,
};
