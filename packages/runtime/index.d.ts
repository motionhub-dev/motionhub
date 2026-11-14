import type {CSSProperties, FC, ReactNode} from 'react';

/** A stream of numbers in [0, 1) for `seed`: the same seed gives the same stream everywhere */
export declare function seededRandom(seed: string | number): () => number;

/** A motion's tokens resolved, group by group: `tokens.color.ink` (a CSS colour), `tokens.font.display` (a CSS stack), `tokens.duration.light` (seconds) */
export type Tokens = {
  color?: Record<string, string>;
  font?: Record<string, string>;
  duration?: Record<string, number>;
  easing?: Record<string, [number, number, number, number]>;
  caption?: Record<string, string | number>;
  [group: string]: Record<string, unknown> | undefined;
};
export declare function resolveTokens(dtcg: unknown): Tokens;
export declare function tokenVariables(tokens: Tokens | undefined): Record<string, string>;

export type VideoProps = {src: string; startAt?: number; trimBefore?: number; playbackRate?: number; objectFit?: 'cover' | 'contain' | 'fill'; style?: CSSProperties};
export type MotionRuntime = {
  /** seconds since the component's sequence began (a hook) */
  useTime(): number;
  /** seconds since the film began (a hook) */
  useCompositionTime(): number;
  fps: number;
  width: number;
  height: number;
  tokens?: Tokens;
  Video?: FC<VideoProps>;
  /** called with a <Film>'s structure when it is drawn */
  onFilm?(outline: FilmOutline): void;
  /** Each voiced line's speech, by line id: how long it is and its words, each from and to seconds into it */
  voice?: Record<string, {seconds: number; words?: {text: string; start: number; end: number}[]}>;
};
export declare const MotionRuntimeProvider: FC<{value: MotionRuntime; children?: ReactNode}>;

export declare const useTime: () => number;
export declare const useCompositionTime: () => number;
export declare const useCurrentFrame: () => number;
export declare const useVideoConfig: () => {width: number; height: number; fps: number};
export declare const useTokens: () => Tokens;
export declare const Video: FC<VideoProps>;
export declare const MotionRoot: FC<{tokens?: Tokens; style?: CSSProperties; children?: ReactNode}>;
/** Its children drawn in another motion: its tokens (a tokens.json, or resolved), keeping the engine's time; one per scene or part of a frame */
export declare const MotionScope: FC<{tokens: unknown; root?: boolean; children?: ReactNode}>;
/** One spoken line, styled by the caption tokens; with `line`, that line of the film's, while it is said */
export declare const Caption: FC<{line?: string; words?: boolean; children?: ReactNode; opacity?: number; style?: CSSProperties}>;

export type EasingFn = (x: number) => number;
export declare const Easing: {linear: EasingFn; bezier(x1: number, y1: number, x2: number, y2: number): EasingFn; inOutSine: EasingFn; outCubic: EasingFn; outQuart: EasingFn; inOutCubic: EasingFn; outBack: EasingFn};
export declare function interpolate(input: number, inputRange: number[], outputRange: number[], options?: {easing?: EasingFn; clamp?: boolean}): number;
export declare const Sequence: FC<{from?: number; duration?: number; children?: ReactNode}>;

/** A box of the frame, in its pixels */
export type LayerBox = {id: string; x: number; y: number; w: number; h: number; z: number};
/**
 * A <Sound> as the engine plays it, in the film's seconds: from `at`, `dur` seconds of the file from `trim` (null: the whole file, or with
 * `loop` until `until`), never past `until` (the end of its scene, or of the film); `volume` and `duck` in dB, fades in seconds
 */
export type FilmSound = {src: string; at: number; dur: number | null; until: number; trim: number; loop: boolean; volume: number; fadeIn: number; fadeOut: number; duck?: number};
/** A <Film>'s structure: its length, its scenes in order (each from `start` seconds), and its own layers and sounds, across every scene */
export type FilmOutline = {
  seconds: number;
  scenes: {id: string; start: number; duration: number; layers: LayerBox[]; lines: FilmLine[]; sounds: FilmSound[]}[];
  layers: LayerBox[];
  sounds: FilmSound[];
  /** Whether the film draws its lines as captions, whole or word by word */
  captions: boolean | 'words';
  /** The film's voice, `provider:name`, or null */
  voice: string | null;
};
/** A word of a voiced line, and when it is said */
export type FilmWord = {text: string; start: number; end: number};
/**
 * A line of a scene, and when it is said, in the film's seconds; a voiced one with its words, and `over`, the seconds of its speech
 * past its scene's end
 */
export type FilmLine = {id: string; text: string; start: number; end: number; voiced?: true; words?: FilmWord[]; over?: number};
/** How long a scene waits before its first spoken line, and between spoken lines, in seconds */
export declare const NARRATION: {lead: number; hold: number};
/** When a line is said, in its scene's time (as useTime() counts there), with its words where it is voiced */
export declare function useLine(id: string): {start: number; end: number; words: FilmWord[]};
export declare function filmOutline(
  children: ReactNode,
  frame?: {width?: number; height?: number; captions?: boolean | 'words'; voice?: MotionRuntime['voice']; speaker?: string},
): FilmOutline;
/**
 * Its <Scene>s laid end to end, each drawn in its span on its own clock; anything else drawn across them all; with `captions`, its lines as
 * captions (`"words"`: word by word, where they are voiced); `voice`, the voice its lines are spoken in (`provider:name`)
 */
export declare const Film: FC<{captions?: boolean | 'words'; voice?: string; children?: ReactNode}>;
export declare const Scene: FC<{id: string; duration: number; children?: ReactNode}>;
/** A box of the frame (`x`, `y`, `w`, `h` in pixels, the whole frame when left out), stacked by `z`, shown for its whole scene */
export declare const Layer: FC<{id: string; x?: number; y?: number; w?: number; h?: number; z?: number; style?: CSSProperties; children?: ReactNode}>;
/** The <Film> under it drawn as its scene `id` alone, on the engine's clock (its own layers on the film's), for an engine that places each scene */
export declare const FilmScene: FC<{id: string; children?: ReactNode}>;
/** What a scene says, from `at` seconds into it for `dur` seconds (shared evenly when left out); it draws nothing */
export declare const Line: FC<{id: string; text?: string; at?: number; dur?: number; children?: ReactNode}>;
/**
 * A sound the film plays, from `at` seconds of its scene (or the film), `dur` seconds of it from `trim` into the file, looped with `loop`, at
 * `volume` dB, faded over `fadeIn`/`fadeOut` seconds, `duck` dB lower under a narration. It draws nothing; the engine plays it
 */
export declare const Sound: FC<{src: string; at?: number; dur?: number; trim?: number; loop?: boolean; volume?: number; fadeIn?: number; fadeOut?: number; duck?: number}>;
