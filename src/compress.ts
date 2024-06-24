import { DEFAULT_BPM } from './constants'
import { Channel, Tab } from './model'
import { emptyChannels } from './parse'

const LINE_SEPARATOR = '\n'
const CHANNEL_BORDER = '|'
const EMPTY_SYMBOL = '-'

const CHANNEL_SEPARATOR = 'a'
const ENTRY_SEPARATOR = 'b'
const COUNT_SEPARATOR = 'c'

export function decompress(input: string): string | null {
    const decompressed = input
        .split(CHANNEL_SEPARATOR)
        .filter(Boolean)
        .map((s) => s.split(ENTRY_SEPARATOR).filter(Boolean))
        .map((s) =>
            s
                .map((f) => {
                    let [count, c] = f.split(COUNT_SEPARATOR)
                    c = c ? `${c}${EMPTY_SYMBOL}` : EMPTY_SYMBOL
                    return c.repeat(parseInt(count, 10))
                })
                .join('')
        )
        .map((s) => `${CHANNEL_BORDER}${s}${CHANNEL_BORDER}`)
        .join(LINE_SEPARATOR)
    if (decompressed.length < 3) return null
    return decompressed
}

export function compress(input: string): string {
    return input
        .split(LINE_SEPARATOR)
        .filter(Boolean)
        .map((s) => s.split(CHANNEL_BORDER).join(''))
        .map((s) => {
            const symbols = []
            let symbol = ''
            for (const c of s) {
                if (c === EMPTY_SYMBOL) {
                    if (symbol) {
                        symbols.push(symbol)
                    } else {
                        symbols.push(null)
                    }
                    symbol = ''
                } else {
                    symbol += c
                }
            }
            if (symbol) {
                symbols.push(symbol)
            }

            return symbols
        })
        .map((s) => {
            if (!s.length) {
                return ''
            }
            const merged: string[] = []
            let prev = s[0]
            let count = 1
            for (let i = 1; i < s.length; i++) {
                const c = s[i]
                if (prev === c) {
                    count += 1
                } else {
                    merged.push(
                        prev === null ? `${count}` : `${count}${COUNT_SEPARATOR}${prev}`
                    )
                    prev = c
                    count = 1
                }
            }
            merged.push(
                prev === null ? `${count}` : `${count}${COUNT_SEPARATOR}${prev}`
            )
            return merged.join(ENTRY_SEPARATOR)
        })
        .join(CHANNEL_SEPARATOR)
}

export function compressTab(tab: Tab): string {
    return compress(
        tab.channels
            .map(
                (c) =>
                    `${CHANNEL_BORDER}${c.frets
                        .map((f) => (f === null ? EMPTY_SYMBOL : f.toString()))
                        .join('')}${CHANNEL_BORDER}`
            )
            .join(LINE_SEPARATOR)
    )
}

export function compressTabs(tabs: Tab[]): string {
    if (tabs.length === 0) {
        return ''
    }
    return compressTab(
        tabs.reduce((a, b) => ({
            ...b,
            channels: b.channels.map((c, i) => ({
                ...c,
                frets: a.channels[i].frets.concat(c.frets)
            }))
        }))
    )
}

export function decompressToTab(input: string): Tab | null {
    const decompressed = decompress(input)

    if (!decompressed) return null

    const channelsFrets = decompressed.split(LINE_SEPARATOR).map((s) =>
        s
            .split(CHANNEL_BORDER)
            .join('')
            .split('')
            .map((c) => (c === EMPTY_SYMBOL ? null : parseInt(c)))
    )
    const empty = emptyChannels()
    const channels: Channel[] = empty.map((c, i) => ({
        ...c,
        frets: channelsFrets[i]
    }))

    return {
        channels,
        bpm: DEFAULT_BPM
    }
}
