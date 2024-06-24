import { DEFAULT_INPUT_VALUE } from './constants'
import { Tab } from './model'
import { parseTabs } from './parse'
import { playTab } from './play'
import './style.css'

const app = document.getElementById("app")!
const output = document.createElement('div')
output.classList.add("output")
const input = document.createElement('textarea')

input.value = DEFAULT_INPUT_VALUE

function insertTabs(tabs: Tab[]) {
    output.innerHTML = ""

    const wrapper = document.createElement('div')
    wrapper.classList.add("wrapper")
    const playButton = document.createElement('button')
    playButton.textContent = "play all combined"
    playButton.addEventListener('click', () => playTab(tabs.reduce((a, b) =>
    ({
        ...b,
        channels: b.channels.map((c, i) => ({
            ...c,
            frets: a.channels[i].frets.concat(c.frets)
        }))
    })
    )))

    wrapper.appendChild(playButton)
    output.appendChild(wrapper)


    for (const tab of tabs) {
        const wrapper = document.createElement('div')
        wrapper.classList.add("wrapper")
        const view = document.createElement('pre')
        view.textContent = tab.channels.map(c => c.frets.map(f => f === null ? "-" : f.toString()).join('')).join('\n')
        const playButton = document.createElement('button')
        playButton.textContent = "play"
        playButton.addEventListener('click', () => playTab(tab))

        wrapper.appendChild(view)
        wrapper.appendChild(playButton)
        output.appendChild(wrapper)
    }
}


const parseButton = document.createElement('button')
parseButton.textContent = "parse"
parseButton.addEventListener('click', () => {
    const tabs = parseTabs(input.value)
    insertTabs(tabs)
})


app.appendChild(input)
app.appendChild(parseButton)
app.appendChild(output)
