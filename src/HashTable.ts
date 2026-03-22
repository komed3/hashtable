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
    private readonly hashFn: HashFn;

    private table = new Map< string, any > ();

    constructor ( options: HashOptions = {} ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };

        try { this.hashFn = typeof this.options.hash === 'function' ? this.options.hash
            : this.options.hash = Hasher[ this.options.hash as keyof Hasher ] }
        catch ( err ) { throw Error ( `Cannot set hash function`, { cause: err } ) }

        try { this.hashFn( '' ) }
        catch ( err ) { throw Error ( `Cannot call hash function`, { cause: err } ) }
    }

}
