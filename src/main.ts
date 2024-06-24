import { compress, compressTab, compressTabs, decompress, decompressToTab } from './compress'
import { DEFAULT_INPUT_VALUE } from './constants'
import { Tab } from './model'
import { parseTabs } from './parse'
import { playTab } from './play'
import './style.css'

const app = document.getElementById("app")!
const output = document.createElement('div')
output.classList.add("output")
const input = document.createElement('textarea')

const u = new URLSearchParams(window.location.search)
if (u.has("tab")) {
    input.value = decompress(u.get("tab")!) || DEFAULT_INPUT_VALUE
} else {
    input.value = DEFAULT_INPUT_VALUE
}


function handleParse() {
    const tabs = parseTabs(input.value)
    output.innerHTML = ""
    output.appendChild(createShareLink(tabs))
    output.appendChild(createTabElements(tabs))
}

function createTabElements(tabs: Tab[]) {
    const out = document.createElement('div')
    out.classList.add("tabs-wrapper")

    if (tabs.length > 1) {
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
        out.appendChild(wrapper)
    }


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
        out.appendChild(wrapper)
    }
    return out
}

function createShareLink(tabs: Tab[]) {
    const compressed = compressTabs(tabs)
    const u = new URL(window.location.href)
    u.searchParams.set("tab", compressed)

    const str = u.toString()

    const wrapper = document.createElement('div')
    wrapper.classList.add("sharelink-wrapper")

    const shareLink = document.createElement('input')
    shareLink.classList.add('sharelink')
    shareLink.type = "text"
    shareLink.readOnly = true
    shareLink.value = str

    const button = document.createElement('button')
    button.textContent = "copy link"
    button.addEventListener('click', () => {
        const copyText = shareLink
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        try {
            document.execCommand("copy")
        } catch { }
    })

    wrapper.appendChild(shareLink)
    wrapper.appendChild(button)

    return wrapper

}


const parseButton = document.createElement('button')
parseButton.textContent = "parse"
parseButton.addEventListener('click', handleParse)

handleParse()

app.appendChild(input)
app.appendChild(parseButton)
app.appendChild(output)
