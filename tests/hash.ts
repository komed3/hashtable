import { HashTable } from '../src/HashTable.ts';

const table = new HashTable( { hash: 'fnv1a' } );
const arr = [ 'Hello World', 'Some test', 'Another test', 'Hello World' ];

for ( const str of arr ) {
    const key = table.key( [ str ] );
    if ( key && table.has( key ) ) console.log( 'Duplicate:', str );
    else if ( key ) table.set( key, str );
}

console.log( table.size() );
