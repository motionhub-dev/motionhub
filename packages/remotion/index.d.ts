import type {FC, ReactNode} from 'react';
import type {Tokens} from '@motionhub/runtime';

export declare const MotionProvider: FC<{tokens: unknown; root?: boolean; children?: ReactNode}>;
/** A component's meta, as SPEC.md §12 has it */
type MetaOf = {params?: Record<string, {type: string; doc: string; default?: unknown}>};
/** The types of the vocabulary (SPEC.md §12, Parameters) a schema field is made for */
export declare const PARAM_TYPES: string[];
/** The choices of a type written `a | b | c`, or null */
export declare function paramChoices(type: string): string[] | null;
/** A composition's schema for a component, from its meta, built with the project's zod (`paramsSchema(meta, z)`) */
export declare function paramsSchema<Z>(meta: MetaOf, z: Z): any;
/** A composition's defaultProps for a component: every param's default, where it has one */
export declare function paramDefaults(meta: MetaOf): Record<string, unknown>;
type FilmOf<P> = {fps?: number; width?: number; height?: number; props?: P};
/** Each scene of the <Film> a component draws, by id, in whole frames that meet end to end */
export declare function sceneFrames<P extends object>(Component: FC<P>, film?: FilmOf<P>): Record<string, number>;
/** A composition's metadata for a component that draws a <Film>: its length in frames from the scenes; with `ids`, the scenes must be those, in order */
export declare function filmMetadata<P extends object>(Component: FC<P>, film?: FilmOf<P>, ids?: string[]): {durationInFrames: number; fps: number; width: number; height: number};
export declare const MotionFonts: FC<{han?: boolean}>;
export declare function families(tokens: Tokens | undefined): string[];
export declare function useMotion(): {
  tokens: Tokens;
  fps: number;
  frames(duration: string): number;
  ease(easing: string): (t: number) => number;
  progress(frame: number, start: number, duration: string, easing?: string): number;
};
