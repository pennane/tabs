export type Note = {
	halfStepsFromA4: number
	deltaTime: number
}

export type Channel = {
	rootHalfStepsFromA4: number
	notes: Note[]
}

export type Tab = {
	noteCount: number
	channels: Channel[]
}

export type Tabs = {
	version: 1
	bpm: number
	tabs: Tab[]
}
