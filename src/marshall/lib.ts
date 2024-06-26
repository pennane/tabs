import { Tabs, Channel, Tab } from "../model"

export function bufferToBase64(buffer: ArrayBuffer): string {
	const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

	const byteLength = buffer.byteLength
	const bufferView = new Uint8Array(buffer)
	const remainingBytesCount = byteLength % 3
	const mainLength = byteLength - remainingBytesCount

	let string = ""
	let i = 0

	for (; i < mainLength; i += 3) {
		const chunk = (bufferView[i] << 16) | (bufferView[i + 1] << 8) | bufferView[i + 2]
		string += base64Chars[(chunk & 0b111111000000000000000000) >> 18]
		string += base64Chars[(chunk & 0b000000111111000000000000) >> 12]
		string += base64Chars[(chunk & 0b000000000000111111000000) >> 6]
		string += base64Chars[chunk & 0b000000000000000000111111]
	}

	if (remainingBytesCount === 2) {
		const chunk = (bufferView[i] << 16) | (bufferView[i + 1] << 8)
		string += base64Chars[(chunk & 0b111111000000000000000000) >> 18]
		string += base64Chars[(chunk & 0b000000111111000000000000) >> 12]
		string += base64Chars[(chunk & 0b000000000000111111000000) >> 6]
		string += "="
	} else if (remainingBytesCount === 1) {
		const chunk = bufferView[i] << 16
		string += base64Chars[(chunk & 0b111111000000000000000000) >> 18]
		string += base64Chars[(chunk & 0b000000111111000000000000) >> 12]
		string += "=="
	}

	return string
}

export function base64ToBuffer(base64: string): ArrayBuffer {
	const binaryString = atob(base64)
	const length = binaryString.length
	const bytes = new Uint8Array(length)

	for (let i = 0; i < length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}

	return bytes.buffer
}

export function mergeTabs(tabs: Tabs): Tabs {
	let totalNoteCount = 0

	const mergedChannels = new Map<number, Channel>()

	for (const { channels, noteCount } of tabs.tabs) {
		for (const channel of channels) {
			if (!mergedChannels.has(channel.rootHalfStepsFromA4)) {
				const totalTime = channel.notes.reduce((time, note) => time + note.deltaTime, 0)
				const firstNote = channel.notes[0]

				if (!totalNoteCount || !firstNote) {
					mergedChannels.set(channel.rootHalfStepsFromA4, { ...channel })
					continue
				}

				const missingDelta = totalNoteCount - totalTime

				mergedChannels.set(channel.rootHalfStepsFromA4, {
					...channel,
					notes: channel.notes.with(0, {
						...firstNote,
						deltaTime: firstNote.deltaTime + missingDelta,
					}),
				})
				continue
			}
			const merged = mergedChannels.get(channel.rootHalfStepsFromA4)!
			const totalTime = merged.notes.reduce((time, note) => time + note.deltaTime, 0)
			const missingDelta = totalNoteCount - totalTime
			const [firstNote, ...notes] = channel.notes

			if (firstNote) {
				merged.notes = merged.notes
					.concat([{ ...firstNote, deltaTime: firstNote.deltaTime + missingDelta }])
					.concat(notes)
			}
		}
		totalNoteCount += noteCount
	}

	const mergedTab: Tab = {
		channels: [...mergedChannels.values()].toSorted(
			(a, b) => b.rootHalfStepsFromA4 - a.rootHalfStepsFromA4
		),
		noteCount: totalNoteCount,
	}

	const mergedTabs: Tabs = {
		...tabs,
		tabs: [mergedTab],
	}


	return mergedTabs
}
