import { Hasher } from '../src/Hasher.ts';

let start = process.hrtime.bigint();
for ( let i = 0; i < 1e6; i++ ) Hasher.fnv1a( 'test_' + i );
console.log( 'FNV-1a', Number( process.hrtime.bigint() - start ) / 1e6, 'ns' );

start = process.hrtime.bigint();
for ( let i = 0; i < 1e6; i++ ) Hasher.fasthash( 'test_' + i );
console.log( 'Fast hash:', Number( process.hrtime.bigint() - start ) / 1e6, 'ns' );

start = process.hrtime.bigint();
for ( let i = 0; i < 1e6; i++ ) Hasher.murmur3( 'test_' + i );
console.log( 'Murmur3', Number( process.hrtime.bigint() - start ) / 1e6, 'ns' );
