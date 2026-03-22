import { Hasher } from './Hasher';

export type HashFn = ( str: string, seed?: number ) => number;
export type Hash = 'fasthash' | 'fnv1a' | 'murmur3' | HashFn;

export interface HashOptions {
    hash?: Hash;
    seed?: number;
    maxStrLen?: number;
    fifo?: boolean;
    maxSize?: number;
}


const DEFAULT_OPTIONS : HashOptions = {
    hash: 'fasthash',
    maxStrLen: 2048,
    fifo: true,
    maxSize: 10_000
};


export class HashTable {

    private readonly options: HashOptions;
    private readonly seed: number | undefined;
    private readonly maxStrLen: number;
    private readonly hashFn: HashFn;

    private table = new Map< string, any > ();

    constructor ( options: HashOptions = {} ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.seed = this.options.seed;
        this.maxStrLen = this.options.maxStrLen ?? 2048;

        try { this.hashFn = typeof this.options.hash === 'function' ? this.options.hash
            : this.options.hash = Hasher[ this.options.hash as keyof Hasher ] }
        catch ( err ) { throw Error ( `Cannot set hash function`, { cause: err } ) }

        try { this.hashFn( '' ) }
        catch ( err ) { throw Error ( `Cannot call hash function`, { cause: err } ) }
    }

    protected keygen ( strs: string[], pfx?: string, sfx?: string, sorted: boolean = false ) : string | false {
        const seed = this.seed, maxLen = this.maxStrLen, n = strs.length;
        const hashes: number[] = new Array( n );

        for ( let i = 0; i < n; i++ ) {
            const s = strs[ i ];
            if ( s.length > maxLen ) return false;
            hashes[ i ] = this.hashFn( s, seed );
        }

        if ( sorted ) hashes.sort( ( a, b ) => a - b );

        return pfx + hashes.join( '-' ) + sfx;
    }

    public key ( strs: string[], pfx?: string, sfx?: string, sorted: boolean = false ) : string | false {
        return this.keygen( strs, pfx, sfx, sorted );
    }

}
