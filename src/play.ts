import { Note, Pitch, Tab } from './model'

function pitchToHalfStepsFromA4(pitch: Pitch): number {
    const { note, octave } = pitch
    const halfStepsFromA4 = (octave - 4) * 12 + note - 9
    return halfStepsFromA4
}

function halfStepsToFrequency(steps: number): number {
    const frequency = 440 * Math.pow(2, steps / 12)
    return frequency
}

let audioCtx: AudioContext

export async function playTab(tab: Tab) {
    if (audioCtx) {
        audioCtx.close()
    }
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buffer = 0.5
    const startTime = audioCtx.currentTime + buffer
    const beatLength = 60 / tab.bpm / 2
    const halfBeatLength = beatLength / 2
    const noteDuration = halfBeatLength * 6

    const precomputedOffsets = new Array(tab.channels.length)
    for (let j = 0; j < tab.channels.length; j++) {
        precomputedOffsets[j] =
            (beatLength / (tab.channels.length * 2)) * (tab.channels.length - j)
    }

    for (let j = 0; j < tab.channels.length; j++) {
        const channel = tab.channels[j]
        const rootSteps = pitchToHalfStepsFromA4(channel.root)

        for (let i = 0; i < channel.frets.length; i++) {
            const fret = channel.frets[i]
            if (fret === null) continue


            const frequency = halfStepsToFrequency(rootSteps + fret)
            const offset =
                (beatLength / (tab.channels.length * 2)) *
                (tab.channels.length - j)
            const start = startTime + i * beatLength + offset
            const end = start + noteDuration + offset

            const oscillator = audioCtx.createOscillator()
            oscillator.frequency.setValueAtTime(frequency, start)
            oscillator.type = 'sawtooth'

            const gainNode = audioCtx.createGain()
            gainNode.gain.setValueAtTime(0.025, start)
            gainNode.gain.linearRampToValueAtTime(0, end)

            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            oscillator.start(start)
            oscillator.stop(end)
        }
    }
}
