import type {FC, ReactNode} from 'react';
import type {Tokens} from '@motionhub/runtime';

export declare const MotionProvider: FC<{tokens: unknown; root?: boolean; children?: ReactNode}>;
export declare const MotionFonts: FC<{han?: boolean}>;
export declare function families(tokens: Tokens | undefined): string[];
export declare function useMotion(): {
  tokens: Tokens;
  fps: number;
  frames(duration: string): number;
  ease(easing: string): (t: number) => number;
  progress(frame: number, start: number, duration: string, easing?: string): number;
};
