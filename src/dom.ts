import { serialize } from "./marshall/binary"
import { DEFAULT_BPM } from "./constants"
import { Tabs } from "./model"
import { playTab } from "./audio/play"
import { tabToString } from "./marshall/string"

export function copyToClipboard(input: HTMLInputElement) {
	input.select()
	input.setSelectionRange(0, 99999)
	try {
		document.execCommand("copy")
	} catch {}
}

export function createOutputElement(): HTMLDivElement {
	const output = document.createElement("div")
	output.classList.add("output")
	return output
}

export function createInputElement(): HTMLTextAreaElement {
	return document.createElement("textarea")
}

export function createBpmInput() {
	const wrapper = document.createElement("div")
	wrapper.classList.add("bpm-wrapper")

	const heading = document.createElement("span")
	heading.textContent = "bpm"

	const bpmInput = document.createElement("input")
	bpmInput.type = "number"
	bpmInput.max = "1000"
	bpmInput.min = "1"
	bpmInput.inputMode = "numeric"
	bpmInput.defaultValue = DEFAULT_BPM.toString()

	wrapper.appendChild(heading)
	wrapper.appendChild(bpmInput)

	return { bpmInput, bpmInputWrapper: wrapper }
}

export function createTabElements(tabs: Tabs): HTMLDivElement {
	const out = document.createElement("div")
	out.classList.add("tabs-wrapper")

	tabs.tabs.forEach((tab) => {
		const wrapper = document.createElement("div")
		wrapper.classList.add("wrapper")
		const view = document.createElement("pre")
		view.textContent = tabToString(tab)
		const playButton = document.createElement("button")
		playButton.textContent = "play"
		playButton.addEventListener("click", () => playTab(tab, tabs.bpm))

		wrapper.appendChild(view)
		wrapper.appendChild(playButton)
		out.appendChild(wrapper)
	})

	return out
}

export function createShareLink(tabs: Tabs): HTMLDivElement {
	const compressed = serialize(tabs)
	const url = new URL(window.location.href)
	url.searchParams.set("tab", compressed)

	const str = url.toString()

	const wrapper = document.createElement("div")
	wrapper.classList.add("sharelink-wrapper")

	const shareLink = document.createElement("input")
	shareLink.classList.add("sharelink")
	shareLink.type = "text"
	shareLink.readOnly = true
	shareLink.value = str

	const button = document.createElement("button")
	button.textContent = "copy link"
	button.addEventListener("click", () => copyToClipboard(shareLink))

	wrapper.appendChild(shareLink)
	wrapper.appendChild(button)

	return wrapper
}
