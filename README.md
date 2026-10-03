# Pixel-Shooter

Senkrecht oder waagrecht scrollender Shooter für MakeCode Arcade, als Erweiterung mit eigenen Blöcken.
Grafiken und Sounds stammen aus dem [Arcade Asset Generator](https://theodorthg.github.io/arcade-asset-generator/).

- 1 bis 4 Spieler gleichzeitig: weitere Spieler steigen jederzeit mit **A** auf ihrem Controller ein,
  am selben Gerät oder online im Mehrspieler-Modus von arcade.makecode.com.
- **Flugrichtung:** Block `setze Flugrichtung auf nach oben (senkrecht) / nach rechts (waagrecht)`. Im waagrechten Modus dreht die Engine alle Figuren selbst um 90° – eigene Grafiken zeichnest du immer für „nach oben“.
- **A** halten = schießen, **B** = Bombe (räumt den Bildschirm, trifft den Boss).
- Gegner: Jäger, Untertassen im Zickzack, Sturzflieger, Geschütztürme am Boden.
- Power-ups: **P** stärkere Waffe (bis Dreifachschuss), **S** Schild, **B** Bombe, **L** Leben.
- Jede Stufe endet mit einem Endboss mit Energieleiste. Stile: Weltall, Ozean, Wüste, Eismeer.

```blocks
pixelshooter.setStage(1, pixelshooter.Style.Space)
pixelshooter.setStage(2, pixelshooter.Style.Sea)
pixelshooter.setStage(3, pixelshooter.Style.Desert)
pixelshooter.setMaxPlayers(2)
pixelshooter.startGame()
```

## Eigene Grafiken
Die Engine sucht zuerst im Projekt (Assets-Tab) nach diesen Namen, sonst nimmt sie die eingebauten:

| Was | Art | Name |
|---|---|---|
| Raumschiffe Spieler 1–4 | Animation | `shShip1` … `shShip4` |
| Gegner | Animation | `shFighter`, `shZigzag`, `shDiver`, `shTurret` |
| Endboss | Animation / Bild | `shBoss` / `shBossHurt` |
| Schüsse | Bild | `shShot`, `shEnemyShot` |
| Power-ups | Bild | `shPower`, `shShield`, `shBomb`, `shLife`, Schildring `shShieldRing` |
| Explosion | Animation | `shExplosion` |
| Hintergründe (160×120, nahtlos) | Bild | `shSpaceFar`/`shSpaceNear`, `shSeaFar`/`shSeaNear`, `shDesertFar`/…, `shIceFar`/… |

Einbinden: Erweiterungen → `github:theodorthg/pxt-pixelshooter`. Lizenz: MIT.

## Stil-Paletten (ab v0.3.0)

Jeder Stil bringt eine eigene 16-Farben-Palette mit; sie wird beim Laden gesetzt. Weiß, Rot, Gelb, Beige, Braun und Schwarz bleiben gleich. Abschalten mit dem Block „Stil-Paletten aus“ (`pixelshooter.useStylePalettes(false)`), dann gilt die Palette des Projekts. Farben: `generator/assetgen.js` (GENRE_PALETTES), neu erzeugen mit `node tools/build-palettes.js`.
