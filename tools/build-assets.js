// Erzeugt assets.ts (eingebaute Grafiken = Fallback) und sounds.ts mit dem Arcade Asset Generator.
// Aufruf: node tools/build-assets.js
const fs = require('fs'), path = require('path');
const G = require('../../generator/assetgen.js');
const S = require('../../generator/soundgen.js');
const C = require('./config.js');
const cap = s => s[0].toUpperCase() + s.slice(1);
const I = '    ';
let ts = '// AUTOMATISCH ERZEUGT von tools/build-assets.js – nicht von Hand bearbeiten.\nnamespace shooterGfx {\n';
const bg = [];
C.styles.forEach(st => {
    const b = G.shooterBackground(st, C.bgSeed);
    ts += G.imageToTS('bg' + cap(st) + 'Far', b.far) + G.imageToTS('bg' + cap(st) + 'Near', b.near);
    bg.push(`[bg${cap(st)}Far, bg${cap(st)}Near]`);
});
ts += `${I}export const backgrounds: Image[][] = [${bg.join(', ')}]\n`;
C.shipColors.forEach((c, i) => ts += G.framesToTS('ship' + (i + 1), G.shooterShip(c, C.shipSeed)));
ts += `${I}export const ships: Image[][] = [${C.shipColors.map((c, i) => 'ship' + (i + 1)).join(', ')}]\n`;
C.enemies.forEach(e => ts += G.framesToTS(e, G.shooterEnemy(e, C.enemySeed)));
ts += `${I}export const enemies: Image[][] = [${C.enemies.join(', ')}]\n`;
const boss = G.shooterBoss(C.bossSeed);
ts += G.framesToTS('bossFly', boss.fly) + G.imageToTS('bossHurt', boss.hurt);
const it = G.shooterItems(C.itemSeed);
['shot', 'enemyShot', 'power', 'shield', 'bomb', 'life', 'shieldRing'].forEach(k => ts += G.imageToTS(k, it[k]));
ts += G.framesToTS('explosion', it.explosion);
ts += '}\n';
fs.writeFileSync(path.join(__dirname, '../assets.ts'), ts);
console.log('assets.ts', Math.round(ts.length / 1024) + ' KB');
let snd = '// AUTOMATISCH ERZEUGT von tools/build-assets.js – Sounds in tools/config.js ändern.\nnamespace shooterSounds {\n';
for (const k in C.sfx) snd += S.sfxToTS(k, S.sfx(C.sfx[k][0], C.sfx[k][1]));
for (const k in C.melodies) snd += S.melodyToTS(k, S.melody(C.melodies[k][0], C.melodies[k][1]));
snd += '}\n';
fs.writeFileSync(path.join(__dirname, '../sounds.ts'), snd);
console.log('sounds.ts');
