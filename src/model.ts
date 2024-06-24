
export enum Note {
    C = 0,
    CSharp = 1,
    D = 2,
    DSharp = 3,
    E = 4,
    F = 5,
    FSharp = 6,
    G = 7,
    GSharp = 8,
    A = 9,
    ASharp = 10,
    B = 11
}

export type Pitch = {
    note: Note
    octave: number
}

export type Fret = number | null

export type Channel = {
    root: Pitch
    frets: Fret[]
}

export type Tab = {
    bpm: number,
    channels: Channel[]
}

