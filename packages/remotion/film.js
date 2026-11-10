// A film of scenes (@motionhub/runtime's <Film>) in Remotion's frames: each scene's length and the composition's, learned by drawing the
// film once, off the page, at its start. No Remotion here, so it is tested on its own (test.mjs).
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MotionRuntimeProvider} from '@motionhub/runtime';

/** The structure of the <Film> a component draws */
function outlineOf(Component, {fps = 30, width = 1920, height = 1080, props = {}}) {
  let outline = null;
  const value = {useTime: () => 0, useCompositionTime: () => 0, fps, width, height, tokens: {}, Video: () => null, onFilm: (o) => { outline = o; }};
  try {
    renderToStaticMarkup(createElement(MotionRuntimeProvider, {value}, createElement(Component, props)));
  } catch (error) {
    throw new Error(`drawing the film once, off the page, at its start, to learn its scenes: ${error.message}. Its motions' tokens are its own <MotionScope>s: the provider here has none`, {cause: error});
  }
  if (!outline) throw new Error('the component draws no <Film> (@motionhub/runtime 0.6)');
  return outline;
}

/** Each scene's frames at `fps`, rounded where it starts and ends so the scenes meet end to end and add up to the film */
function framesOf(outline, fps) {
  return outline.scenes.map(({id, start, duration}) => {
    const frames = Math.round((start + duration) * fps) - Math.round(start * fps);
    if (frames < 1) throw new Error(`scene "${id}" lasts ${duration} s, less than a frame at ${fps} fps`);
    return [id, frames];
  });
}

/**
 * Each scene of the <Film> a component draws, by id, in whole frames at `fps` that meet end to end and add up to the film: the
 * `durationInFrames` of a Series.Sequence that holds `<FilmScene id>` around the film. A scene shorter than a frame is an error.
 */
export function sceneFrames(Component, film = {}) {
  return Object.fromEntries(framesOf(outlineOf(Component, film), film.fps ?? 30));
}

/**
 * A composition's metadata for a component that draws a <Film> (`calculateMetadata: () => filmMetadata(Main, film, ['intro', 'how'])`): its
 * length in frames from the film's scenes, so it follows them as they change. With `ids`, the scenes the composition places one by one,
 * the film's scenes must be those, in that order: a scene added, taken out or moved is named in the error.
 */
export function filmMetadata(Component, film = {}, ids) {
  const {fps = 30, width = 1920, height = 1080} = film;
  const frames = framesOf(outlineOf(Component, film), fps);
  const has = frames.map(([id]) => id);
  if (ids && has.join('\n') !== ids.join('\n')) {
    throw new Error(`the film's scenes are ${has.map((id) => `"${id}"`).join(', ')}, the composition places ${ids.map((id) => `"${id}"`).join(', ')}: give each scene its Series.Sequence, in order`);
  }
  return {durationInFrames: frames.reduce((sum, [, n]) => sum + n, 0), fps, width, height};
}
