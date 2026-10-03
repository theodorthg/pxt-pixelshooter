// Gemeinsame Einstellungen für build-assets.js (eingebaute Grafiken/Sounds) und build-game.js.
module.exports = {
    styles: ['space', 'sea', 'desert', 'ice'],     // Reihenfolge = pixelshooter.Style
    bgSeed: '1', shipSeed: '1', enemySeed: '3', bossSeed: '2', itemSeed: '1',
    shipColors: [8, 2, 7, 5],                      // Spieler 1–4
    enemies: ['fighter', 'zigzag', 'diver', 'turret'],
    sfx: { shoot: ['laser', '2'], enemyShoot: ['laser', '6'], explosion: ['explosion', '1'], hit: ['hit', '2'], power: ['powerup', '2'], bomb: ['explosion', '5'], join: ['blip', '1'] },
    melodies: { startTune: ['start', '3'], stageTune: ['level', '2'], winTune: ['win', '2'], endTune: ['gameover', '2'], bossTune: ['boss', '2'] },
};
