export type Role = 'land' | 'move' | 'draw' | 'count' | 'cut' | 'out';
/** One thing that happens in the picture: when (seconds), what kind, and for how long (a move or a stroke) */
export type Cue = {at: number; role: Role; dur?: number};
/** A voice and its settings: `{voice: 'click', lo: 1500, hi: 5000, len: 0.03, gain: 0.7}`; several layer into one sound */
export type Voice = {voice: string; gain?: number; [setting: string]: unknown};
/** A motion's react/sound.json */
export type Sound = {bpm?: number; root?: number; kit?: string[]; bed?: number; roles: Partial<Record<Role, Voice | Voice[]>>};
export declare const ROLES: Role[];
export declare const VOICES: string[];
export declare const KIT: string[];
/** The sound of `seconds` with `cues` in `sound`, as mono samples at `rate` (44100): the same input gives the same samples */
export declare function renderSound(options: {seconds: number; cues?: Cue[]; sound: Sound; rate?: number}): Float32Array;
export declare function soundIssues(sound: unknown): string[];
