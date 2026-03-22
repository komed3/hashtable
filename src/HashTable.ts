import { Hasher } from './Hasher';

export type HashFn = ( str: string, seed?: number ) => number;
export type Hash = 'fasthash' | 'fnv1a' | 'murmur3' | HashFn;

export interface HashOptions {
    hash?: Hash;
}


const DEFAULT_OPTIONS : HashOptions = {
    hash: 'fasthash'
};


export class HashTable {

    private readonly options: HashOptions;
    private readonly hash: HashFn;
    private table = new Map< string, any > ();

    constructor ( options: HashOptions = {} ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };

        try { this.hash = typeof this.options.hash === 'function' ? this.options.hash
            : this.options.hash = Hasher[ this.options.hash as keyof Hasher ] }
        catch ( err ) { throw Error ( `Cannot set hasher function`, { cause: err } ) }
    }

}
