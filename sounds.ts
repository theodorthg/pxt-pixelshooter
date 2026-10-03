// AUTOMATISCH ERZEUGT von tools/build-assets.js – Sounds in tools/config.js ändern.
namespace shooterSounds {
    export const shoot = music.createSoundEffect(WaveShape.Square, 1908, 364, 126, 0, 138, SoundExpressionEffect.None, InterpolationCurve.Linear)
    export const enemyShoot = music.createSoundEffect(WaveShape.Sawtooth, 1697, 276, 115, 0, 108, SoundExpressionEffect.None, InterpolationCurve.Logarithmic)
    export const explosion = music.createSoundEffect(WaveShape.Noise, 379, 65, 222, 0, 550, SoundExpressionEffect.Tremolo, InterpolationCurve.Curve)
    export const hit = music.createSoundEffect(WaveShape.Noise, 902, 141, 140, 0, 86, SoundExpressionEffect.None, InterpolationCurve.Logarithmic)
    export const power = music.createSoundEffect(WaveShape.Triangle, 368, 1577, 136, 24, 364, SoundExpressionEffect.Vibrato, InterpolationCurve.Curve)
    export const bomb = music.createSoundEffect(WaveShape.Noise, 382, 44, 238, 0, 485, SoundExpressionEffect.Tremolo, InterpolationCurve.Logarithmic)
    export const join = music.createSoundEffect(WaveShape.Sine, 1063, 1063, 80, 0, 52, SoundExpressionEffect.None, InterpolationCurve.Linear)
    export const startTune = music.melodyPlayable(new music.Melody("d#4:2-166 g4:2 a#4:2 d#5:2 r:1 c5:2 d#5:8"))
    export const stageTune = music.melodyPlayable(new music.Melody("f5:1-187 a#5:1 d6:1 f6:5"))
    export const winTune = music.melodyPlayable(new music.Melody("d#4:2-156 d#4:1 d#4:1 a#4:4 g4:2 a#4:2 c5:6 r:1 a#4:1 d#5:8"))
    export const endTune = music.melodyPlayable(new music.Melody("d#5:3-97 c5:3 a4:3 g#4:3 g3:10"))
    export const bossTune = music.melodyPlayable(new music.Melody("a3:2-130 a3:2 c4:2 a3:4 a3:2 a3:2 c4:2 a3:4 e4:2 e4:2 a#3:6"))
}
