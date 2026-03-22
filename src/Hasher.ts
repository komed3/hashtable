export class Hasher {

    public static FNV1a ( str: string ) : number {
        let hash = 0x811c9dc5;

        for ( let i = 0; i < str.length; i++ ) {
            hash ^= str.charCodeAt( i );
            hash = Math.imul( hash, 0x01000193 );
        }

        return hash >>> 0;
    }

    public static fastFNV1a ( str: string ) : number {
        const len = str.length;
        const limit = len & ~3;
        let hash = 0x811c9dc5;
        let i = 0;

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
