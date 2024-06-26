/**
Version = uint8
Bpm = uint16
Tab = LengthVLQ NoteCount TabString+
TabString = LengthVLQ RootHalfStepsFromA4 Note+
Note = HalfStepsFromA4 DeltaTime

TabBinary = Version Bpm Tab+

LengthVLQ = 1*3(OCTET)  
RootHalfStepsFromA4 = int8
HalfStepsFromA4 = int8
DeltaTime = uint16
NoteLength = uint32

uint8 = OCTET 
uint16 = 2OCTET ;
int8 = OCTET 
**/

import { Channel, Note, Tab, Tabs } from "../model"
import { base64ToBuffer, bufferToBase64 } from "./lib"

const VERSION_BYTES = 1
const BPM_BYTES = 2
const DELTA_TIME_BYTES = 2
const HALF_STEPS_BYTES = 1
const NOTE_COUNT_BYTES = 4
const NOTE_BYTES = HALF_STEPS_BYTES + DELTA_TIME_BYTES

function encodeVlq(value: number): { bytes: number[] } {
	const vlq: number[] = []
	do {
		let byte = value & 0x7f
		value >>= 7
		if (value > 0) {
			byte |= 0x80
		}
		vlq.push(byte)
	} while (value > 0)
	return { bytes: vlq }
}

function decodeVlq(dataView: DataView, offset: number): { value: number; length: number } {
	let value = 0
	let length = 0
	let byte: number
	let shift = 0

	do {
		byte = dataView.getUint8(offset + length)
		value |= (byte & 0x7f) << shift
		shift += 7
		length += 1
	} while (byte & 0x80)

	return { value, length }
}

export function serialize(tabs: Tabs): string {
	let bufferSize = VERSION_BYTES + BPM_BYTES

	const tabVlqs = []

	for (const tab of tabs.tabs) {
		let tabSize = NOTE_COUNT_BYTES
		for (const channel of tab.channels) {
			let channelSize = HALF_STEPS_BYTES + channel.notes.length * NOTE_BYTES
			let vlq = encodeVlq(channelSize)
			tabSize += channelSize + vlq.bytes.length
		}
		let tabVlq = encodeVlq(tabSize)
		tabVlqs.push(tabVlq)
		bufferSize += tabVlq.bytes.length + tabSize
	}

	const buffer = new ArrayBuffer(bufferSize)
	const dataView = new DataView(buffer)

	let offset = 0

	dataView.setUint8(offset, tabs.version)
	offset += VERSION_BYTES

	dataView.setUint16(offset, tabs.bpm)
	offset += BPM_BYTES

	for (const [i, tab] of tabs.tabs.entries()) {
		const tabVlq = tabVlqs[i]
		for (const byte of tabVlq.bytes) {
			dataView.setUint8(offset, byte)
			offset += 1
		}

		dataView.setUint32(offset, tab.noteCount)
		offset += NOTE_COUNT_BYTES

		for (const channel of tab.channels) {
			const channelSize = HALF_STEPS_BYTES + channel.notes.length * NOTE_BYTES
			const channelSizeVlq = encodeVlq(channelSize)
			for (const byte of channelSizeVlq.bytes) {
				dataView.setUint8(offset, byte)
				offset += 1
			}

			dataView.setInt8(offset, channel.rootHalfStepsFromA4)
			offset += HALF_STEPS_BYTES

			for (const note of channel.notes) {
				dataView.setInt8(offset, note.halfStepsFromA4)
				offset += HALF_STEPS_BYTES
				dataView.setUint16(offset, note.deltaTime)
				offset += DELTA_TIME_BYTES
			}
		}
	}

	if (offset !== bufferSize) {
		throw new Error("Failed to fill the buffer")
	}

	const a = bufferToBase64(buffer)

	return a
}

export function deserialize(base64: string): Tabs {
	const buffer = base64ToBuffer(base64)
	const dataView = new DataView(buffer)
	let offset = 0

	const version = dataView.getUint8(offset)

	if (version !== 1) throw new Error(`Unknown version ${version}`)

	offset += VERSION_BYTES

	const bpm = dataView.getUint16(offset)
	offset += BPM_BYTES

	const tabs: Tab[] = []

	while (offset < buffer.byteLength) {
		const channels: Channel[] = []

		const { value: tabSize, length: tabVlqLength } = decodeVlq(dataView, offset)
		offset += tabVlqLength

		const tabEnd = offset + tabSize

		const noteCount = dataView.getUint32(offset)
		offset += NOTE_COUNT_BYTES

		while (offset < tabEnd) {
			const { value: channelSize, length: channelVlqLength } = decodeVlq(dataView, offset)
			offset += channelVlqLength

			const notesEnd = offset + channelSize
			const notes: Note[] = []

			const rootHalfStepsFromA4 = dataView.getInt8(offset)
			offset += HALF_STEPS_BYTES

			while (offset < notesEnd) {
				const halfStepsFromA4 = dataView.getInt8(offset)
				offset += HALF_STEPS_BYTES
				const deltaTime = dataView.getUint16(offset)
				offset += DELTA_TIME_BYTES
				notes.push({ halfStepsFromA4, deltaTime })
			}

			channels.push({ rootHalfStepsFromA4, notes })
		}
		tabs.push({ noteCount, channels })
	}

	return { version, bpm, tabs }
}
