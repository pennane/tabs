import "./style.css"
import { DEFAULT_BPM, DEFAULT_INPUT_VALUE } from "./constants"
import {
	createOutputElement,
	createInputElement,
	createBpmInput,
	createShareLink,
	createTabElements,
} from "./dom"
import { deserialize } from "./marshall/binary"
import { stringToTabs, tabsToString } from "./marshall/string"

function init() {
	const app = document.getElementById("app")!
	const output = createOutputElement()
	const input = createInputElement()
	const { bpmInput, bpmInputWrapper } = createBpmInput()

	parseUrl(input, bpmInput)

	let timeout: number | undefined = undefined
	const updatingInputs = [input, bpmInput]

	updatingInputs.forEach((inputElement) =>
		inputElement.addEventListener("input", () => {
			clearTimeout(timeout)
			timeout = setTimeout(() => parseInputs(input, bpmInput, output), 300)
		})
	)

	parseInputs(input, bpmInput, output)

	app.appendChild(input)
	app.appendChild(bpmInputWrapper)
	app.appendChild(output)
}

function parseUrl(input: HTMLTextAreaElement, bpmInput: HTMLInputElement) {
	const params = new URLSearchParams(window.location.search)

	const serialized = params.get("tab")
	const tabs = serialized && deserialize(serialized)

	if (!tabs) {
		input.value = DEFAULT_INPUT_VALUE
		bpmInput.value = DEFAULT_BPM.toString()
		return
	}

	input.value = tabsToString(tabs) || DEFAULT_INPUT_VALUE
	bpmInput.value = String(tabs?.bpm || DEFAULT_BPM)
}

function parseInputs(
	input: HTMLTextAreaElement,
	bpmInput: HTMLInputElement,
	output: HTMLDivElement
) {
	const tabs = stringToTabs(input.value)
	output.innerHTML = ""
	if (!tabs) return
	tabs.bpm = parseInt(bpmInput.value) || DEFAULT_BPM
	output.appendChild(createShareLink(tabs))
	output.appendChild(createTabElements(tabs))
}

init()
