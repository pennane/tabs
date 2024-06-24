import { Channel, Fret, Note, Tab } from "./model";

function emptyChannels(): Channel[] {
    return [
        {
            root: { note: Note.E, octave: 4 },
            frets: []
        },
        {
            root: { note: Note.B, octave: 3 },
            frets: []
        },
        {
            root: { note: Note.G, octave: 3 },
            frets: []
        },
        {
            root: { note: Note.D, octave: 3 },
            frets: []
        },
        {
            root: { note: Note.A, octave: 2 },
            frets: []
        },
        {
            root: { note: Note.E, octave: 2 },
            frets: []
        }
    ]
}

export function parseTabs(tab: string): Tab[] {
    const lines = tab.split("\n")
    const stripped = lines.map(line => {
        const dashIndex = line.indexOf('|')

        if (dashIndex === -1) return null

        const lastDashIndex = line.lastIndexOf('|')

        if (dashIndex === lastDashIndex) return null

        const inner = line.slice(dashIndex + 1, lastDashIndex)
        const chars = inner.split("|").join('').split('')

        let frets: Fret[] = []
        let n = ""

        for (let i = 0; i < chars.length; i++) {
            const c = chars[i]

            if (!isNaN(parseInt(c))) {
                n += c
                continue
            }

            if (n) {
                frets.push(parseInt(n))
                for (let i = 1; i < n.length; i++) {
                    frets.push(null)
                }
                n = ""
            }
            frets.push(null)
        }

        if (n) {
            frets.push(parseInt(n))
            for (let i = 1; i < n.length; i++) {
                frets.push(null)
            }
            n = ""
        }

        return frets
    })

    let groups: Fret[][][] = []
    let group: Fret[][] = []
    for (const line of stripped) {
        if (!line) {
            if (group.length) {
                groups.push(group)
                group = []
            }
            continue
        }
        group.push(line)
    }

    if (group.length) {
        groups.push(group)
    }

    return groups.map(g => {
        const channels = emptyChannels()
        for (let i = 0; i < g.length; i++) {
            if (channels.length <= i) {
                continue
            }
            channels[i].frets = g[i]
        }
        return {
            bpm: 250,
            channels
        }
    })
}
