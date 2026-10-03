// =====================================================================
//  PIXEL-SHOOTER – senkrecht scrollender Weltraum-Shooter als MakeCode-Erweiterung
//  Grafiken: assets.ts, Sounds: sounds.ts (beide generiert, siehe tools/).
//  Bis zu 4 Spieler gleichzeitig (am selben Gerät oder online über den
//  Mehrspieler-Modus von arcade.makecode.com). Blöcke: Kategorie "Pixel-Shooter".
//
//  Grafiken mit festen Namen im PROJEKT ersetzen die eingebauten
//  (shShip1, shFighter, shBoss, shSpaceFar, ...), siehe README.
// =====================================================================

namespace SpriteKind {
    export const ShEnemy = SpriteKind.create()
    export const ShShot = SpriteKind.create()
    export const ShEnemyShot = SpriteKind.create()
    export const ShBoss = SpriteKind.create()
    export const ShPowerUp = SpriteKind.create()
    export const ShFx = SpriteKind.create()
}

//% color="#7a3fb0" weight=99 icon="" block="Pixel-Shooter"
//% groups='["Start", "Stufen", "Einstellungen", "Ereignisse", "Werte"]'
namespace pixelshooter {
    /** Hintergrund einer Stufe */
    export enum Style {
        //% block="Weltall"
        Space = 0,
        //% block="Ozean"
        Sea = 1,
        //% block="Wüste"
        Desert = 2,
        //% block="Eismeer"
        Ice = 3
    }
    const STYLE_NAMES = ["Space", "Sea", "Desert", "Ice"]
    const STYLE_TITLES = ["Sternenfeld", "Inselmeer", "Duenenmeer", "Eismeer"]
    const ENEMY_NAMES = ["Fighter", "Zigzag", "Diver", "Turret"]
    const E_FIGHTER = 0, E_ZIGZAG = 1, E_DIVER = 2, E_TURRET = 3
    const P_POWER = 0, P_SHIELD = 1, P_BOMB = 2, P_LIFE = 3
    const MAX_PLAYERS = 4
    const MAX_STAGES = 9

    // ---------------------------------------------------------------- Einstellungen
    let title = "PIXEL-SHOOTER"
    let startLives = 3
    let startBombs = 2
    let maxPlayers = 4
    let enemySpeedPercent = 100
    let bossHp = 40
    let stageSeconds = 45
    let scrollSpeed = 30
    const stageStyles: number[] = [0, 1, 2, -1, -1, -1, -1, -1, -1]

    let enemyHandler: () => void = null
    let bossHandler: () => void = null
    let stageHandler: (stage: number) => void = null

    // ---------------------------------------------------------------- Assets (Projekt zuerst, sonst eingebaut)
    let shipFrames: Image[][] = []
    let enemyFrames: Image[][] = []
    let bossFrames: Image[] = null
    let bossHurtImg: Image = null
    let shotImg: Image = null, enemyShotImg: Image = null, shieldImg: Image = null
    let powerImgs: Image[] = []
    let explosionFrames: Image[] = null
    let bgFar: Image[] = [], bgNear: Image[] = []

    function projImg(name: string, fallback: Image): Image {
        const a = helpers.getImageByName(name)
        return a ? a : fallback
    }
    function projAnim(name: string, fallback: Image[]): Image[] {
        const a: Image[] = helpers.getAnimationByName(name)
        return a && a.length > 0 ? a : fallback
    }
    function resolveAssets() {
        for (let i = 0; i < MAX_PLAYERS; i++) shipFrames[i] = projAnim("shShip" + (i + 1), shooterGfx.ships[i])
        for (let i = 0; i < 4; i++) enemyFrames[i] = projAnim("sh" + ENEMY_NAMES[i], shooterGfx.enemies[i])
        bossFrames = projAnim("shBoss", shooterGfx.bossFly)
        bossHurtImg = projImg("shBossHurt", shooterGfx.bossHurt)
        shotImg = projImg("shShot", shooterGfx.shot)
        enemyShotImg = projImg("shEnemyShot", shooterGfx.enemyShot)
        shieldImg = projImg("shShieldRing", shooterGfx.shieldRing)
        powerImgs = [projImg("shPower", shooterGfx.power), projImg("shShield", shooterGfx.shield),
            projImg("shBomb", shooterGfx.bomb), projImg("shLife", shooterGfx.life)]
        explosionFrames = projAnim("shExplosion", shooterGfx.explosion)
        for (let s = 0; s < STYLE_NAMES.length; s++) {
            bgFar[s] = projImg("sh" + STYLE_NAMES[s] + "Far", shooterGfx.backgrounds[s][0])
            bgNear[s] = projImg("sh" + STYLE_NAMES[s] + "Near", shooterGfx.backgrounds[s][1])
        }
    }

    function play(p: music.Playable) { music.play(p, music.PlaybackMode.InBackground) }

    // ---------------------------------------------------------------- Zustand
    const ctrls = [controller.player1, controller.player2, controller.player3, controller.player4]
    const infos = [info.player1, info.player2, info.player3, info.player4]
    const ships: Sprite[] = [null, null, null, null]
    const shields: Sprite[] = [null, null, null, null]
    const weapon = [1, 1, 1, 1]
    const bombs = [0, 0, 0, 0]
    const nextShot = [0, 0, 0, 0]
    const invincibleUntil = [0, 0, 0, 0]
    const joined = [false, false, false, false]
    let running = false
    let started = false
    let stage = 0
    let stageCount = 3
    let stageStart = 0
    let nextWave = 0
    let waveNo = 0
    let style = 0
    let scrollY = 0
    let boss: Sprite = null
    let bossBar: StatusBarSprite = null
    let bossPhase = 0
    let bossNextShot = 0
    let bossFlashUntil = 0
    let pendingStage = -1

    // ---------------------------------------------------------------- Scrollender Hintergrund (2 Ebenen, nahtlos)
    scene.createRenderable(-10, function (target: Image, camera: scene.Camera) {
        if (!bgFar[style]) return
        const yf = Math.floor(scrollY * 0.5) % 120, yn = Math.floor(scrollY) % 120
        target.drawImage(bgFar[style], 0, yf)
        target.drawImage(bgFar[style], 0, yf - 120)
        target.drawTransparentImage(bgNear[style], 0, yn)
        target.drawTransparentImage(bgNear[style], 0, yn - 120)
    })

    // ---------------------------------------------------------------- Spieler
    function aliveCount(): number {
        let n = 0
        for (let i = 0; i < MAX_PLAYERS; i++) if (ships[i]) n++
        return n
    }

    function joinPlayer(i: number) {
        if (joined[i] || i >= maxPlayers || !running) return
        joined[i] = true
        const s = sprites.create(shipFrames[i][0], SpriteKind.Player)
        s.setPosition(30 + i * 33, 105)
        s.setStayInScreen(true)
        s.z = 10
        s.data["p"] = i
        animation.runImageAnimation(s, shipFrames[i], 80, true)
        ctrls[i].moveSprite(s, 90, 90)
        ships[i] = s
        weapon[i] = 1
        bombs[i] = startBombs
        infos[i].setLife(startLives)
        if (i > 0) infos[i].setScore(0)
        invincibleUntil[i] = game.runtime() + 1500
        play(shooterSounds.join)
    }

    function shoot(i: number) {
        const s = ships[i]
        const now = game.runtime()
        if (!s || now < nextShot[i]) return
        nextShot[i] = now + (weapon[i] >= 3 ? 140 : 170)
        const lvl = weapon[i]
        const xs = lvl == 1 ? [0] : lvl == 2 ? [-4, 4] : [-6, 0, 6]
        const vxs = lvl >= 3 ? [-40, 0, 40] : [0, 0, 0]
        for (let k = 0; k < xs.length; k++) {
            const b = sprites.create(shotImg, SpriteKind.ShShot)
            b.setPosition(s.x + xs[k], s.top)
            b.vy = -200
            b.vx = vxs[k]
            b.data["p"] = i
            b.setFlag(SpriteFlag.AutoDestroy, true)
        }
        if (Math.floor(now / 170) % 2 == 0) play(shooterSounds.shoot)
    }

    function useBomb(i: number) {
        if (!ships[i] || bombs[i] <= 0 || !running) return
        bombs[i]--
        play(shooterSounds.bomb)
        scene.cameraShake(6, 500)
        for (const e of sprites.allOfKind(SpriteKind.ShEnemy)) killEnemy(e, i)
        sprites.destroyAllSpritesOfKind(SpriteKind.ShEnemyShot)
        if (boss) damageBoss(10, i)
    }

    function hurtPlayer(i: number) {
        const now = game.runtime()
        if (!ships[i] || now < invincibleUntil[i]) return
        if (shields[i]) {
            shields[i].destroy()
            shields[i] = null
            invincibleUntil[i] = now + 800
            play(shooterSounds.hit)
            return
        }
        explode(ships[i].x, ships[i].y)
        play(shooterSounds.explosion)
        scene.cameraShake(3, 300)
        weapon[i] = Math.max(1, weapon[i] - 1)
        invincibleUntil[i] = now + 2000
        infos[i].changeLifeBy(-1)
    }

    function playerDied(i: number) {
        if (!ships[i]) return
        explode(ships[i].x, ships[i].y)
        ships[i].destroy()
        ships[i] = null
        if (shields[i]) { shields[i].destroy(); shields[i] = null }
        if (aliveCount() == 0) {
            running = false
            pause(800)
            game.setGameOverMessage(false, "Game Over")
            game.over(false)
        }
    }
    info.player1.onLifeZero(function () { playerDied(0) })
    info.player2.onLifeZero(function () { playerDied(1) })
    info.player3.onLifeZero(function () { playerDied(2) })
    info.player4.onLifeZero(function () { playerDied(3) })

    // Tasten einzeln registrieren: der Web-Compiler erlaubt hier keine Controller aus einer Liste
    function pressA(k: number) { if (!joined[k]) joinPlayer(k) }
    controller.player1.A.onEvent(ControllerButtonEvent.Pressed, function () { pressA(0) })
    controller.player2.A.onEvent(ControllerButtonEvent.Pressed, function () { pressA(1) })
    controller.player3.A.onEvent(ControllerButtonEvent.Pressed, function () { pressA(2) })
    controller.player4.A.onEvent(ControllerButtonEvent.Pressed, function () { pressA(3) })
    controller.player1.B.onEvent(ControllerButtonEvent.Pressed, function () { useBomb(0) })
    controller.player2.B.onEvent(ControllerButtonEvent.Pressed, function () { useBomb(1) })
    controller.player3.B.onEvent(ControllerButtonEvent.Pressed, function () { useBomb(2) })
    controller.player4.B.onEvent(ControllerButtonEvent.Pressed, function () { useBomb(3) })

    // ---------------------------------------------------------------- Effekte
    function explode(x: number, y: number) {
        const fx = sprites.create(explosionFrames[0], SpriteKind.ShFx)
        fx.setPosition(x, y)
        fx.z = 20
        animation.runImageAnimation(fx, explosionFrames, 70, false)
        fx.lifespan = explosionFrames.length * 70
    }

    // Einblendung, die das Spiel nicht anhält (anders als game.splash)
    function banner(text: string, sub: string) {
        const img = image.create(160, sub ? 26 : 16)
        img.fill(15)
        img.drawRect(0, 0, 160, img.height, 1)
        img.printCenter(text, 4, 1, image.font8)
        if (sub) img.printCenter(sub, 15, 5, image.font5)
        const b = sprites.create(img, SpriteKind.ShFx)
        b.setFlag(SpriteFlag.RelativeToCamera, true)
        b.setFlag(SpriteFlag.Ghost, true)
        b.setPosition(80, 50)
        b.z = 100
        b.lifespan = 2500
    }

    // ---------------------------------------------------------------- Gegner
    function speed(v: number): number { return v * enemySpeedPercent / 100 * (1 + stage * 0.15) }

    function spawnEnemy(type: number, x: number, y: number): Sprite {
        const e = sprites.create(enemyFrames[type][0], SpriteKind.ShEnemy)
        e.setPosition(x, y)
        animation.runImageAnimation(e, enemyFrames[type], 120, true)
        e.data["t"] = type
        e.data["hp"] = type == E_TURRET ? 3 : type == E_ZIGZAG ? 2 : 1
        e.data["x0"] = x
        e.data["born"] = game.runtime()
        e.data["shot"] = game.runtime() + randint(600, 2200)
        e.setFlag(SpriteFlag.AutoDestroy, true)
        if (type == E_TURRET) { e.vy = scrollSpeed; e.z = -1 }
        else if (type == E_DIVER) e.vy = speed(45)
        else e.vy = speed(type == E_ZIGZAG ? 28 : 38)
        return e
    }

    function nearestShip(x: number, y: number): Sprite {
        let best: Sprite = null, bd = 99999
        for (let i = 0; i < MAX_PLAYERS; i++) {
            const s = ships[i]
            if (!s) continue
            const d = Math.abs(s.x - x) + Math.abs(s.y - y)
            if (d < bd) { bd = d; best = s }
        }
        return best
    }

    function aimShot(from: Sprite, v: number) {
        const t = nearestShip(from.x, from.y)
        const b = sprites.create(enemyShotImg, SpriteKind.ShEnemyShot)
        b.setPosition(from.x, from.bottom)
        b.setFlag(SpriteFlag.AutoDestroy, true)
        if (t) {
            const dx = t.x - from.x, dy = t.y - from.y, len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
            b.vx = dx / len * v
            b.vy = dy / len * v
        } else b.vy = v
        play(shooterSounds.enemyShoot)
    }

    function updateEnemies(now: number) {
        for (const e of sprites.allOfKind(SpriteKind.ShEnemy)) {
            const t = e.data["t"]
            const age = (now - e.data["born"]) / 1000
            if (t == E_ZIGZAG) e.x = e.data["x0"] + Math.sin(age * 2.2) * 40
            else if (t == E_DIVER && !e.data["locked"] && e.y > 30) {
                const s = nearestShip(e.x, e.y)
                if (s) { e.vx = Math.sign(s.x - e.x) * speed(35); e.vy = speed(75) }
                e.data["locked"] = true
            }
            if (now > e.data["shot"] && e.y > 0 && e.y < 90) {
                e.data["shot"] = now + Math.max(700, randint(1600, 3200) - stage * 300)
                if (t != E_DIVER) aimShot(e, t == E_TURRET ? 70 : 55)
            }
        }
    }

    function killEnemy(e: Sprite, by: number) {
        if (e.data["dead"]) return
        e.data["dead"] = true
        explode(e.x, e.y)
        const t = e.data["t"]
        if (by >= 0) infos[by].changeScoreBy(t == E_TURRET ? 50 : t == E_ZIGZAG ? 30 : 20)
        if (Math.percentChance(12)) dropPowerUp(e.x, e.y)
        e.destroy()
        play(shooterSounds.explosion)
        if (enemyHandler) enemyHandler()
    }

    function dropPowerUp(x: number, y: number) {
        const r = randint(0, 99)
        const kind = r < 45 ? P_POWER : r < 70 ? P_SHIELD : r < 92 ? P_BOMB : P_LIFE
        const p = sprites.create(powerImgs[kind], SpriteKind.ShPowerUp)
        p.setPosition(x, y)
        p.vy = 25
        p.data["k"] = kind
        p.setFlag(SpriteFlag.AutoDestroy, true)
    }

    // Wellen: Formationen je nach Zufall, mit der Stufe dichter und gemischter
    function spawnWave() {
        waveNo++
        const r = randint(0, 99)
        const maxType = Math.min(4, 2 + stage)
        const kind = randint(0, maxType - 1)
        if (kind == 0) {
            const n = 4 + Math.min(2, stage)
            for (let k = 0; k < n; k++) spawnEnemy(E_FIGHTER, 20 + k * (120 / (n - 1)), -8 - (k % 2) * 10)
        } else if (kind == 1) {
            const x = randint(50, 110)
            for (let k = 0; k < 3 + stage; k++) spawnEnemy(E_ZIGZAG, x, -8 - k * 18)
        } else if (kind == 2) {
            for (let k = 0; k < 2 + stage; k++) spawnEnemy(E_DIVER, randint(15, 145), -8 - k * 14)
        } else {
            spawnEnemy(E_TURRET, randint(16, 60), -10)
            if (r < 50 + stage * 15) spawnEnemy(E_TURRET, randint(100, 144), -24)
        }
    }

    // ---------------------------------------------------------------- Endboss
    function spawnBoss() {
        play(shooterSounds.bossTune)
        banner("WARNUNG!", "Endboss naht")
        boss = sprites.create(bossFrames[0], SpriteKind.ShBoss)
        boss.setPosition(80, -20)
        boss.vy = 20
        boss.z = 5
        animation.runImageAnimation(boss, bossFrames, 150, true)
        const players = Math.max(1, aliveCount())
        bossBar = statusbars.create(60, 4, StatusBarKind.EnemyHealth)
        bossBar.max = Math.round(bossHp * (1 + stage * 0.5) * (1 + (players - 1) * 0.5))
        bossBar.value = bossBar.max
        bossBar.setColor(2, 15)
        bossBar.setBarBorder(1, 1)
        bossBar.attachToSprite(boss, 3, 0)
        bossPhase = 0
        bossNextShot = game.runtime() + 1500
    }

    function updateBoss(now: number) {
        if (!boss) return
        if (boss.y >= 26 && boss.vy > 0) { boss.vy = 0; boss.vx = speed(30) }
        if (boss.vy == 0) {
            if (boss.x < 26) boss.vx = Math.abs(boss.vx)
            if (boss.x > 134) boss.vx = -Math.abs(boss.vx)
        }
        if (now < bossFlashUntil) { animation.stopAnimation(animation.AnimationTypes.All, boss); boss.setImage(bossHurtImg) }
        else if (boss.image == bossHurtImg) animation.runImageAnimation(boss, bossFrames, 150, true)
        if (boss.vy == 0 && now > bossNextShot) {
            const angry = bossBar.value < bossBar.max / 2
            bossPhase = (bossPhase + 1) % 3
            if (bossPhase == 0) aimShot(boss, 80)
            else {
                const n = angry ? 7 : 5
                for (let k = 0; k < n; k++) {
                    const b = sprites.create(enemyShotImg, SpriteKind.ShEnemyShot)
                    b.setPosition(boss.x, boss.bottom - 4)
                    const a = (k - (n - 1) / 2) * 0.32
                    b.vx = Math.sin(a) * 60
                    b.vy = Math.cos(a) * 60
                    b.setFlag(SpriteFlag.AutoDestroy, true)
                }
                play(shooterSounds.enemyShoot)
            }
            bossNextShot = now + (angry ? 700 : 1100) - stage * 80
        }
    }

    function damageBoss(n: number, by: number) {
        if (!boss || boss.vy > 0) return
        bossBar.value -= n
        bossFlashUntil = game.runtime() + 60
        if (bossBar.value <= 0) {
            const x = boss.x, y = boss.y
            for (let k = 0; k < 5; k++) explode(x + randint(-14, 14), y + randint(-12, 12))
            play(shooterSounds.explosion)
            scene.cameraShake(6, 800)
            if (by >= 0) infos[by].changeScoreBy(1000)
            bossBar.destroy()
            bossBar = null
            boss.destroy()
            boss = null
            sprites.destroyAllSpritesOfKind(SpriteKind.ShEnemyShot)
            if (bossHandler) bossHandler()
            pendingStage = stage + 1
        }
    }

    // ---------------------------------------------------------------- Kollisionen
    sprites.onOverlap(SpriteKind.ShShot, SpriteKind.ShEnemy, function (b, e) {
        const by = b.data["p"]
        b.destroy()
        e.data["hp"] = e.data["hp"] - 1
        if (e.data["hp"] <= 0) killEnemy(e, by)
        else play(shooterSounds.hit)
    })
    sprites.onOverlap(SpriteKind.ShShot, SpriteKind.ShBoss, function (b, bo) {
        const by = b.data["p"]
        b.destroy()
        damageBoss(1, by)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.ShEnemy, function (p, e) {
        if (e.data["t"] != E_TURRET) killEnemy(e, -1)
        hurtPlayer(p.data["p"])
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.ShEnemyShot, function (p, b) {
        b.destroy()
        hurtPlayer(p.data["p"])
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.ShBoss, function (p, b) {
        hurtPlayer(p.data["p"])
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.ShPowerUp, function (p, u) {
        const i: number = p.data["p"]
        const k: number = u.data["k"]
        u.destroy()
        play(shooterSounds.power)
        if (k == P_POWER) weapon[i] = Math.min(3, weapon[i] + 1)
        else if (k == P_BOMB) bombs[i]++
        else if (k == P_LIFE) infos[i].changeLifeBy(1)
        else if (!shields[i]) {
            const sh = sprites.create(shieldImg, SpriteKind.ShFx)
            sh.z = 11
            shields[i] = sh
        }
        infos[i].changeScoreBy(10)
    })

    // ---------------------------------------------------------------- Stufen
    function styleOf(i: number): number { return stageStyles[i] >= 0 ? stageStyles[i] : i % STYLE_NAMES.length }
    function countStages(): number {
        let n = 0
        while (n < MAX_STAGES && stageStyles[n] >= 0) n++
        return Math.max(1, n)
    }

    function startStage(i: number) {
        stage = i
        style = styleOf(i)
        boss = null
        sprites.destroyAllSpritesOfKind(SpriteKind.ShEnemy)
        sprites.destroyAllSpritesOfKind(SpriteKind.ShEnemyShot)
        sprites.destroyAllSpritesOfKind(SpriteKind.ShPowerUp)
        banner("Stufe " + (i + 1) + ": " + STYLE_TITLES[style], i == 0 && maxPlayers > 1 ? "Weitere Spieler: A druecken" : "")
        stageStart = game.runtime()
        nextWave = stageStart + 1500
        waveNo = 0
        if (stageHandler) stageHandler(i + 1)
    }

    forever(function () {
        if (pendingStage < 0) return
        const next = pendingStage
        pendingStage = -1
        pause(1200)
        if (next >= stageCount) {
            running = false
            game.setGameOverMessage(true, "Galaxis gerettet!")
            game.over(true)
        } else {
            music.play(shooterSounds.stageTune, music.PlaybackMode.UntilDone)
            startStage(next)
        }
    })

    // ---------------------------------------------------------------- Spielschleife
    game.onUpdate(function () {
        if (!running) return
        const now = game.runtime()
        scrollY += scrollSpeed / 30
        for (let i = 0; i < MAX_PLAYERS; i++) {
            const s = ships[i]
            if (!s) continue
            if (ctrls[i].A.isPressed()) shoot(i)
            s.setFlag(SpriteFlag.Invisible, now < invincibleUntil[i] && Math.floor(now / 80) % 2 == 0)
            if (shields[i]) shields[i].setPosition(s.x, s.y)
        }
        if (!boss && pendingStage < 0) {
            if (now - stageStart > stageSeconds * 1000) {
                if (sprites.allOfKind(SpriteKind.ShEnemy).length == 0) spawnBoss()
            } else if (now > nextWave) {
                spawnWave()
                nextWave = now + Math.max(1200, 2800 - stage * 400) * (1 - 0.15 * (aliveCount() - 1))
            }
        }
        updateEnemies(now)
        updateBoss(now)
    })

    // ================================================================ Blöcke

    /**
     * Startet das Spiel mit Titelbild. Einstellungen vorher setzen.
     */
    //% blockId=ps_start block="starte Pixel-Shooter"
    //% group="Start" weight=100
    export function startGame() {
        if (started) return
        started = true
        control.runInParallel(function () {
            resolveAssets()
            stageCount = countStages()
            game.setGameOverPlayable(true, shooterSounds.winTune, false)
            game.setGameOverPlayable(false, shooterSounds.endTune, false)
            style = styleOf(0)
            info.setScore(0)
            play(shooterSounds.startTune)
            game.splash(title, "A = schiessen, B = Bombe")
            running = true
            joinPlayer(0)
            startStage(0)
        })
    }

    //% blockId=ps_title block="setze Titel auf $text"
    //% text.defl="PIXEL-SHOOTER"
    //% group="Start" weight=90
    export function setTitle(text: string) { title = text }

    /**
     * Legt fest, welcher Hintergrund in einer Stufe erscheint. Die Anzahl der
     * Stufen ergibt sich aus den belegten Stufen 1, 2, 3 ... ohne Lücke.
     */
    //% blockId=ps_set_stage block="Stufe $n Stil $s"
    //% n.min=1 n.max=9 n.defl=1
    //% group="Stufen" weight=100
    export function setStage(n: number, s: Style) {
        stageStyles[Math.clamp(1, MAX_STAGES, n) - 1] = s
    }

    //% blockId=ps_stage_count block="setze Anzahl Stufen auf $n"
    //% n.min=1 n.max=9 n.defl=3
    //% group="Stufen" weight=90
    export function setStageCount(n: number) {
        n = Math.clamp(1, MAX_STAGES, n)
        for (let i = 0; i < MAX_STAGES; i++) {
            if (i < n && stageStyles[i] < 0) stageStyles[i] = i % STYLE_NAMES.length
            if (i >= n) stageStyles[i] = -1
        }
    }

    //% blockId=ps_stage_seconds block="setze Stufen-Dauer auf $sec Sekunden"
    //% sec.min=10 sec.max=300 sec.defl=45
    //% group="Stufen" weight=80
    export function setStageSeconds(sec: number) { stageSeconds = Math.max(5, sec) }

    //% blockId=ps_lives block="setze Leben auf $n"
    //% n.min=1 n.max=9 n.defl=3
    //% group="Einstellungen" weight=100
    export function setLives(n: number) { startLives = n }

    //% blockId=ps_bombs block="setze Bomben am Start auf $n"
    //% n.min=0 n.max=9 n.defl=2
    //% group="Einstellungen" weight=95
    export function setBombs(n: number) { startBombs = n }

    /**
     * Wie viele Spieler mitspielen dürfen (1 bis 4). Weitere Spieler steigen
     * jederzeit mit A auf ihrem Controller ein – auch online im Mehrspieler-Modus.
     */
    //% blockId=ps_max_players block="erlaube bis zu $n Spieler"
    //% n.min=1 n.max=4 n.defl=2
    //% group="Einstellungen" weight=90
    export function setMaxPlayers(n: number) { maxPlayers = Math.clamp(1, MAX_PLAYERS, n) }

    //% blockId=ps_enemy_speed block="setze Gegner-Tempo auf $percent \\%"
    //% percent.min=25 percent.max=300 percent.defl=100
    //% group="Einstellungen" weight=80
    export function setEnemySpeed(percent: number) { enemySpeedPercent = percent }

    //% blockId=ps_boss_hp block="setze Boss-Energie auf $hp"
    //% hp.min=5 hp.max=500 hp.defl=40
    //% group="Einstellungen" weight=70
    export function setBossEnergy(hp: number) { bossHp = hp }

    //% blockId=ps_scroll block="setze Scroll-Tempo auf $speed"
    //% speed.min=0 speed.max=120 speed.defl=30
    //% group="Einstellungen" weight=60
    export function setScrollSpeed(speed: number) { scrollSpeed = speed }

    //% blockId=ps_on_enemy block="wenn Gegner zerstört"
    //% group="Ereignisse" weight=100
    export function onEnemyDestroyed(handler: () => void) { enemyHandler = handler }

    //% blockId=ps_on_stage block="wenn Stufe $stage beginnt"
    //% draggableParameters="reporter"
    //% group="Ereignisse" weight=90
    export function onStageStart(handler: (stage: number) => void) { stageHandler = handler }

    //% blockId=ps_on_boss block="wenn Endboss besiegt"
    //% group="Ereignisse" weight=80
    export function onBossDefeated(handler: () => void) { bossHandler = handler }

    //% blockId=ps_ship block="Raumschiff von Spieler $n"
    //% n.min=1 n.max=4 n.defl=1
    //% group="Werte" weight=100
    export function shipOf(n: number): Sprite { return ships[Math.clamp(1, MAX_PLAYERS, n) - 1] }

    //% blockId=ps_current_stage block="aktuelle Stufe"
    //% group="Werte" weight=90
    export function currentStage(): number { return stage + 1 }

    //% blockId=ps_weapon block="Waffenstufe von Spieler $n"
    //% n.min=1 n.max=4 n.defl=1
    //% group="Werte" weight=80
    export function weaponLevel(n: number): number { return weapon[Math.clamp(1, MAX_PLAYERS, n) - 1] }
}
