export class Hasher {

    public static fnv1a ( str: string ) : number {
        let hash = 0x811c9dc5;

        for ( let i = 0; i < str.length; i++ ) {
            hash ^= str.charCodeAt( i );
            hash = Math.imul( hash, 0x01000193 );
        }

        return hash >>> 0;
    }

    public static murmur3 ( str: string ) : number {
        const len = str.length, limit = len & ~3;
        let hash = 0, i = 0;

        for ( ; i < limit; i += 4 ) {
            let chunk = str.charCodeAt( i ) |
                ( str.charCodeAt( i + 1 ) << 8 ) |
                ( str.charCodeAt( i + 2 ) << 16 ) |
                ( str.charCodeAt( i + 3 ) << 24 );

            chunk = Math.imul( chunk, 0xcc9e2d51 );
            chunk = ( chunk << 15 ) | ( chunk >>> 17 );
            chunk = Math.imul( chunk, 0x1b873593 );

            hash ^= chunk;
            hash = ( hash << 13 ) | ( hash >>> 19 );
            hash = Math.imul( hash, 5 ) + 0xe6546b64;
        }

        for ( ; i < len; i++ ) {
            let k = str.charCodeAt( i );

            k = Math.imul( k, 0xcc9e2d51 );
            k = ( k << 15 ) | ( k >>> 17 );
            k = Math.imul( k, 0x1b873593 );

            hash ^= k;
        }

        hash ^= len;
        hash ^= hash >>> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    public static fasthash ( str: string ) : number {
        const len = str.length, limit = len & ~3;
        let hash = 0x811c9dc5, i = 0;

        for ( ; i < limit; i += 4 ) {
            const chunk = str.charCodeAt( i ) |
                ( str.charCodeAt( i + 1 ) << 8 ) |
                ( str.charCodeAt( i + 2 ) << 16 ) |
                ( str.charCodeAt( i + 3 ) << 24 );

            hash ^= chunk;
            hash = Math.imul( hash, 0x01000193 );
        }

        for ( ; i < len; i++ ) {
            hash ^= str.charCodeAt( i );
            hash = Math.imul( hash, 0x01000193 );
        }

        hash ^= hash >>> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

}
