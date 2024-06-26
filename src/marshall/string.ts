import { DEFAULT_BPM } from "../constants"
import { Note, Tab, Tabs } from "../model"

const NOTE_HALF_STEPS_MAP: Record<string, number> = {
	A: 0,
	"A#": 1,
	B: 2,
	C: 3,
	"C#": 4,
	D: 5,
	"D#": 6,
	E: 7,
	F: 8,
	"F#": 9,
	G: 10,
	"G#": 11,
}

const HALF_STEPS_NOTE_MAP = Object.fromEntries(
	Object.entries(NOTE_HALF_STEPS_MAP).map(([a, b]) => [b, a])
)

function defaultHalfSteps(): number[] {
	return adjustOctaves(["E", "B", "G", "D", "A", "E"].map((n) => NOTE_HALF_STEPS_MAP[n]))
}

function halfStepsToNote(steps: number): string {
	const modSteps = ((steps % 12) + 12) % 12
	return HALF_STEPS_NOTE_MAP[modSteps] || "A"
}

function noteToHalfSteps(note: string): number {
	return NOTE_HALF_STEPS_MAP[note.toUpperCase()]
}

function adjustOctaves(steps: number[]): number[] {
	let diffs = Array.from({ length: steps.length }, () => 0)

	for (let i = 1; i < steps.length; i++) {
		if (steps[i] > steps[i - 1]) {
			diffs[i] = diffs[i - 1] - 12
		} else {
			diffs[i] = diffs[i - 1]
		}
	}

	const out = steps.map((step, i) => step + diffs[i])

	return out
}

const EMPTY_NOTE = "-"
const CHANNEL_WRAP = "|"

export function tabToString(tab: Tab): string {
	let out = ""
	for (const channel of tab.channels) {
		out += halfStepsToNote(channel.rootHalfStepsFromA4) + CHANNEL_WRAP
		let notes = ""
		for (const note of channel.notes) {
			notes += EMPTY_NOTE.repeat(Math.max(note.deltaTime - 1, 0))
			notes += note.halfStepsFromA4
		}
		notes = notes.padEnd(tab.noteCount, EMPTY_NOTE)
		out += notes
		out += CHANNEL_WRAP
		out += "\n"
	}
	return out
}

export function tabsToString(tabs: Tabs): string {
	if (tabs.version !== 1) throw new Error(`Unknown version ${tabs.version}`)

	return tabs.tabs.map(tabToString).join("\n\n")
}

function possibleChannel(s: string): boolean {
	const a = s.indexOf(CHANNEL_WRAP)
	const b = s.lastIndexOf(CHANNEL_WRAP)
	return a !== -1 && a !== b
}

function stringsToTab(ss: string[]): Tab {
	let validStringDeclaration = true
	const rawSteps: number[] = []
	const allNotes: Note[][] = []

	let noteCount = 0

	for (const channelString of ss) {
		const [a, ...rest] = channelString.split(CHANNEL_WRAP)

		if (!a || !validStringDeclaration) {
			validStringDeclaration = false
		} else {
			rawSteps.push(noteToHalfSteps(a))
		}

		const chars = rest
			.slice(0, rest.length - 1)
			.join("")
			.concat(EMPTY_NOTE)

		noteCount = Math.max(chars.length - 1, noteCount)

		let notes: Note[] = []

		let note = ""
		let delta = 0

		for (let i = 0; i < chars.length - 1; i++) {
			const c = chars[i]
			const isInt = !isNaN(parseInt(c))
			const isNextInt = !isNaN(parseInt(chars[i + 1]))

			if (!note) {
				delta++
			}

			if (isInt) {
				note += c
				if (!isNextInt) {
					notes.push({
						deltaTime: delta,
						halfStepsFromA4: parseInt(note),
					})
					note = ""
					delta = 0
				}
			}
		}

		allNotes.push(notes)
	}

	const adjustedSteps = validStringDeclaration ? adjustOctaves(rawSteps) : defaultHalfSteps()

	const channels = allNotes.map((notes, i) => ({
		notes,
		rootHalfStepsFromA4: adjustedSteps[i],
	}))

	return {
		channels,
		noteCount,
	}
}

export function stringToTabs(s: string): Tabs | null {
	const lines = s.split("\n")
	const onlyPossibleChannels = lines.map((l) => (possibleChannel(l) ? l : null))

	let tabsStrings: string[][] = []
	let channels: string[] = []

	for (const line of onlyPossibleChannels) {
		if (!line) {
			if (channels.length) {
				tabsStrings.push(channels)
				channels = []
			}
			continue
		}
		channels.push(line)
	}

	if (channels.length) {
		tabsStrings.push(channels)
	}

	const tabs = tabsStrings.map(stringsToTab)

	return {
		version: 1,
		bpm: DEFAULT_BPM,
		tabs,
	}
}
