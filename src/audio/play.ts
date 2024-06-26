import { Tab } from "../model"

function halfStepsToFrequency(steps: number): number {
	return 440 * Math.pow(2, steps / 12)
}

let audioCtx: AudioContext | null = null

export async function playTab(tab: Tab, bpm: number) {
	if (audioCtx) {
		await audioCtx.close()
	}
	audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

	const buffer = 0.5
	const startTime = audioCtx.currentTime + buffer
	const beatLength = 60 / bpm
	const sixteenthLength = beatLength / 4
	const noteDuration = 0.5

	const channels = tab.channels

	const precomputedOffsets = channels.map(
		(_, j) => (sixteenthLength / (channels.length * 2)) * (channels.length - j)
	)

	for (let j = 0; j < channels.length; j++) {
		const channel = channels[j]
		const rootSteps = channel.rootHalfStepsFromA4

		let last = 1
		for (let i = 0; i < channel.notes.length; i++) {
			const note = channel.notes[i]

			const frequency = halfStepsToFrequency(rootSteps + note.halfStepsFromA4)
			last += note.deltaTime
			const start = startTime + last * sixteenthLength + precomputedOffsets[j]
			const end = start + noteDuration

			const oscillator = audioCtx.createOscillator()
			oscillator.frequency.setValueAtTime(frequency, start)
			oscillator.type = "sawtooth"

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
