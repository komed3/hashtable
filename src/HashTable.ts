import { Hasher } from './Hasher';

export type HashFn = ( str: string, seed?: number ) => number;
export type Hash = 'fasthash' | 'fnv1a' | 'murmur3' | HashFn;

export interface HashOptions {
    hash?: Hash;
    seed?: number | undefined;
    maxStrLen?: number;
    fifo?: boolean;
    maxSize?: number;
}


const DEFAULT_OPTIONS: HashOptions = {
    hash: 'fasthash',
    maxStrLen: 2048,
    fifo: true,
    maxSize: 10_000
};


export class HashTable {

    private readonly options: HashOptions;
    private readonly seed: number | undefined;
    private readonly maxStrLen: number;
    private readonly fifo: boolean;
    private readonly maxSize: number;
    private readonly hashFn: HashFn;

    private table = new Map< string, any > ();

    constructor ( options: HashOptions = {} ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.seed = this.options.seed;
        this.maxStrLen = this.options.maxStrLen!;
        this.fifo = this.options.fifo!;
        this.maxSize = this.options.maxSize!;

        try {
            this.hashFn = typeof this.options.hash === 'function'
                ? this.options.hash
                : Hasher[ this.options.hash as keyof Hasher ]
        } catch ( err ) {
            throw Error ( `Cannot set hash function`, { cause: err } )
        }

        try { this.hashFn( '', this.seed ) }
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

    public has ( key: string ) : boolean {
        return this.table.has( key );
    }

    public get< T = any > ( key: string ) : T | undefined {
        return this.table.get( key );
    }

    public set< T = any > ( key: string, entry: T, update: boolean = true ) : boolean {
        const has = this.table.has( key );
        if ( ! update && has ) return false;

        if ( ! has && this.table.size >= this.maxSize ) {
            if ( ! this.fifo ) return false;
            this.table.delete( this.table.keys().next().value! );
        }

        this.table.set( key, entry );
        return true;
    }

    public delete ( key: string ) : boolean {
        return this.table.delete( key );
    }

    public clear () : void {
        this.table.clear();
    }

    public size () : number {
        return this.table.size;
    }

}
