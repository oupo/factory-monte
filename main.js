'use strict';

const PRNG = require('./Pokemon-Showdown/sim/prng');
global.Dex = require('./Pokemon-Showdown/sim/dex');
const common = require('./Pokemon-Showdown/test/common');

function main() {
    let prng = new PRNG();
    let count = 0;
    let n = 100;
    let start = Date.now();
    for (let i = 0; i < n; i ++) {
        let battle = common.gen(4).createBattle({}, [
            [{species: "Charizard", level: 20, ability: 'overgrow', moves: ['flamethrower']}],
            [{species: "Bulbasaur", level: 50, ability: 'blaze', moves: ['magicalleaf']}],
        ], prng);
        while (!battle.winner) {
            battle.commitDecisions();
            battle.choose('p1', 'move 1');
            battle.choose('p2', 'move 1');
        }
        if (battle.winner == "Guest 1") {
            count ++;
        }
    }
    console.log(count / n);
    console.log(Date.now() - start);
}

main();