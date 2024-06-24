import { Note, Pitch, Tab } from "./model";

function pitchToFrequency(pitch: Pitch): number {
    const { note, octave } = pitch;
    const halfStepsFromA4 = (octave - 4) * 12 + note - Note.A;
    return 440 * Math.pow(2, halfStepsFromA4 / 12);
}

let audioCtx: AudioContext

export async function playTab(tab: Tab) {
    if (audioCtx) {
        audioCtx.close()
    }
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buffer = 1;
    const startTime = audioCtx.currentTime + buffer
    const beatLength = (60 / tab.bpm) / 2

    for (let j = 0; j < tab.channels.length; j++) {
        const channel = tab.channels[j]

        const root: Pitch = {
            note: channel.root.note,
            octave: channel.root.octave
        }
        for (let i = 0; i < channel.frets.length; i++) {
            const fret = channel.frets[i]
            if (fret === null) continue
            let untilNext = 0
            for (let j = i + 1; j < channel.frets.length; j++) {
                if (channel.frets[j] !== null) {
                    break
                }
                untilNext += 1
            }

            const newNote = (root.note + fret) % 12
            const newOctave = root.octave + Math.floor((root.note + fret) / 12)

            const pitch: Pitch = {
                note: newNote as Note,
                octave: newOctave
            }

            const frequency = pitchToFrequency(pitch)
            const offset = (beatLength / (tab.channels.length * 2) * (tab.channels.length - j))
            const start = startTime + i * beatLength + offset
            const end = start + beatLength * 6 + offset

            const oscillator = audioCtx.createOscillator()
            oscillator.frequency.setValueAtTime(frequency, start)
            oscillator.type = "sawtooth"

            const gainNode = audioCtx.createGain()
            gainNode.gain.setValueAtTime(.025, start)
            gainNode.gain.linearRampToValueAtTime(0, end)

            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            oscillator.start(start)
            oscillator.stop(end)
        }
    }
}


