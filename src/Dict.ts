/**
 * Dict is a high-performance hash table implementation for caching and data storage.
 * 
 * It supports customizable hashing algorithms, seedable hashes, and eviction policies
 * (like FIFO) to manage memory usage efficiently. Key generation is optimized through
 * internal caching of hash-to-string conversions.
 * 
 * @author Paul Köhler
 * @license MIT
 */

'use strict';

import { Hasher } from './Hasher';

/** Function type for custom hash functions. */
export type HashFn = ( str: string, seed?: number ) => number;

/** Supported built-in hash algorithms or a custom hash function. */
export type Hash = 'fasthash' | 'fnv1a' | 'murmur3' | HashFn;

/** Configuration options for the Dict. */
export interface HashOptions {
    hash?: Hash;
    seed?: number;
    maxStrLen?: number;
    maxSize?: number;
    maxCacheSize?: number;
    fifo?: boolean;
}


/** Default configuration options for the Dict. */
const DEFAULT_OPTIONS: HashOptions = {
    hash: 'fasthash',
    maxStrLen: 2048,
    maxSize: 10_000,
    maxCacheSize: 100_000,
    fifo: true
};


/** The main Dict class providing storage and retrieval of data via hashed keys. */
export class Dict {

    /** Internal configuration and state. */
    private readonly options: HashOptions;
    private readonly seed: number | undefined;
    private readonly maxStrLen: number;
    private readonly maxSize: number;
    private readonly maxCacheSize: number;
    private readonly fifo: boolean;

    /** The hash function to use for hashing keys. */
    private readonly hashFn: HashFn;

    /** The actual storage dictionary and an internal cache for generated hash strings. */
    private dictionary = new Map< string, any > ();
    private hashCache = new Map< number, string > ();

    /**
     * Creates a new instance of Dict with the given options.
     * 
     * @param {HashOptions} [options={}] - Configuration options for the dict.
     * @throws {Error} If the specified hash function cannot be initialized or called.
     */
    constructor ( options: HashOptions = {} ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.seed = this.options.seed;
        this.maxStrLen = this.options.maxStrLen!;
        this.maxCacheSize = this.options.maxCacheSize!;
        this.maxSize = this.options.maxSize!;
        this.fifo = this.options.fifo!;

        // Set the hash function
        try {
            this.hashFn = typeof this.options.hash === 'function'
                ? this.options.hash
                : Hasher[ this.options.hash as keyof Hasher ]
        } catch ( err ) {
            throw Error ( `Cannot set hash function`, { cause: err } )
        }

        // Test the hash function
        try { this.hashFn( '', this.seed ) }
        catch ( err ) { throw Error ( `Cannot call hash function`, { cause: err } ) }
    }

    /**
     * Generates a composite key from an array of strings.
     * 
     * Use `protected override keygen(...)` to override this method within a subclass
     * to change the key generation strategy for your purpose.
     * 
     * @param {string[]} strs - An array of strings to be hashed into a single key.
     * @param {string} [pfx] - An optional prefix for the generated key.
     * @param {string} [sfx] - An optional suffix for the generated key.
     * @param {boolean} [sorted=false] - Whether to sort the hashes before concatenation (ensures order-independent keys).
     * @returns {string | false} The generated key string, or false if an input string exceeds maxStrLen.
     */
    protected keygen ( strs: string[], pfx?: string, sfx?: string, sorted: boolean = false ) : string | false {
        const seed = this.seed, len = this.maxStrLen, size = this.maxCacheSize, n = strs.length;
        const hashes: number[] = new Array( n );

        // Hash each string and store the hash
        for ( let i = 0; i < n; i++ ) {
            const s = strs[ i ];
            if ( s.length > len ) return false;
            hashes[ i ] = this.hashFn( s, seed );
        }

        // Sort hashes if needed
        if ( sorted && n > 1 ) {
            if ( n === 2 ) { if ( hashes[ 0 ] > hashes[ 1 ] ) {
                const tmp = hashes[ 0 ];
                hashes[ 0 ] = hashes[ 1 ];
                hashes[ 1 ] = tmp;
            } } else hashes.sort( ( a, b ) => a - b );
        }

        // Clear cache if full
        if ( this.hashCache.size > size ) this.hashCache.clear();

        // Generate key (use cache if available)
        let key = pfx ?? '', h, s;
        for ( let i = 0; i < n; i++ ) {
            s = this.hashCache.get( h = hashes[ i ] );

            if ( s === undefined ) {
                s = h.toString( 36 ).padStart( 8, '0' );
                this.hashCache.set( h, s );
            }

            key += s;
        }

        return key + ( sfx ?? '' );
    }

    /**
     * Public wrapper for the keygen method to generate a key from string components.
     * 
     * @param {string[]} strs - An array of strings to hash.
     * @param {string} [pfx] - Optional prefix.
     * @param {string} [sfx] - Optional suffix.
     * @param {boolean} [sorted=false] - If true, sort the component hashes.
     * @returns {string | false} The generated key or false.
     */
    public key ( strs: string[], pfx?: string, sfx?: string, sorted: boolean = false ) : string | false {
        return this.keygen( strs, pfx, sfx, sorted );
    }

    /**
     * Checks if a key exists in the dict.
     * 
     * @param {string} key - The key to check.
     * @returns {boolean} True if the key exists, false otherwise.
     */
    public has ( key: string ) : boolean {
        return this.dictionary.has( key );
    }

    /**
     * Retrieves the entry associated with the given key.
     * 
     * @param {string} key - The key to retrieve.
     * @returns {T | undefined} The associated value, or undefined if not found.
     */
    public get< T = any > ( key: string ) : T | undefined {
        return this.dictionary.get( key );
    }

    /**
     * Stores an entry in the dict. If the dict is full, it handles eviction
     * based on the configured policy.
     * 
     * @param {string} key - The key to store the entry under.
     * @param {T} entry - The value to store.
     * @param {boolean} [update=true] - Whether to overwrite an existing entry for the key.
     * @returns {boolean} True if the entry was stored, false if storage was rejected (e.g. dict full and FIFO disabled).
     */
    public set< T = any > ( key: string, entry: T, update: boolean = true ) : boolean {
        const has = this.dictionary.has( key );
        if ( ! update && has ) return false;

        // Handle eviction if dict is full
        if ( ! has && this.dictionary.size >= this.maxSize ) {
            if ( ! this.fifo ) return false;

            const first = this.dictionary.keys().next();
            if ( ! first.done ) this.dictionary.delete( first.value );
        }

        this.dictionary.set( key, entry );
        return true;
    }

    /**
     * Removes an entry from the dict.
     * 
     * @param {string} key - The key to delete.
     * @returns {boolean} True if the entry was deleted, false if it didn't exist.
     */
    public delete ( key: string ) : boolean {
        return this.dictionary.delete( key );
    }

    /**
     * Clears all entries from the dict.
     */
    public clear () : void {
        this.dictionary.clear();
    }

    /**
     * Clears the internal hash-to-string conversion cache.
     */
    public clearCache () : void {
        this.hashCache.clear();
    }

    /**
     * Returns the current number of entries in the dict.
     * 
     * @returns {number} The size of the dict.
     */
    public size () : number {
        return this.dictionary.size;
    }

}
