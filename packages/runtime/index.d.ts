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
  /** the engine's own run of spans, given a <Film>'s scenes end to end: shows each from `from` for `duration` seconds, its useTime() counting from its start */
  Scenes?: FC<{scenes: {name: string; from: number; duration: number; children: ReactNode}[]}>;
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
export declare const Caption: FC<{children?: ReactNode; opacity?: number; style?: CSSProperties}>;

export type EasingFn = (x: number) => number;
export declare const Easing: {linear: EasingFn; bezier(x1: number, y1: number, x2: number, y2: number): EasingFn; inOutSine: EasingFn; outCubic: EasingFn; outQuart: EasingFn; inOutCubic: EasingFn; outBack: EasingFn};
export declare function interpolate(input: number, inputRange: number[], outputRange: number[], options?: {easing?: EasingFn; clamp?: boolean}): number;
export declare const Sequence: FC<{from?: number; duration?: number; children?: ReactNode}>;

/** A box of the frame, in its pixels */
export type LayerBox = {id: string; x: number; y: number; w: number; h: number; z: number};
/** A <Film>'s structure: its length, its scenes in order (each from `start` seconds), and its own layers, drawn across every scene */
export type FilmOutline = {
  seconds: number;
  scenes: {id: string; start: number; duration: number; layers: LayerBox[]; lines: {id: string; text: string}[]}[];
  layers: LayerBox[];
};
export declare function filmOutline(children: ReactNode, frame?: {width?: number; height?: number}): FilmOutline;
/** Its <Scene>s laid end to end, each drawn in its span on its own clock; anything else drawn across them all */
export declare const Film: FC<{children?: ReactNode}>;
export declare const Scene: FC<{id: string; duration: number; children?: ReactNode}>;
/** A box of the frame (`x`, `y`, `w`, `h` in pixels, the whole frame when left out), stacked by `z`, shown for its whole scene */
export declare const Layer: FC<{id: string; x?: number; y?: number; w?: number; h?: number; z?: number; style?: CSSProperties; children?: ReactNode}>;
/** What a scene says; it draws nothing */
export declare const Line: FC<{id: string; text?: string; children?: ReactNode}>;
