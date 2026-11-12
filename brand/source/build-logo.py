#!/usr/bin/env python3
"""Draw motionhub's logo files from the mark's geometry and the wordmark's outlines.

    python3 brand/source/build-logo.py <InstrumentSerif-Regular.ttf> <InstrumentSerif-Italic.ttf>

Instrument Serif (SIL Open Font License 1.1, github.com/google/fonts, ofl/instrumentserif) is used for the wordmark
only, and only as outlines: "motion" in the regular, "hub" in the italic. The SVGs it writes need no font. Needs
fontTools (pip install fonttools) and rsvg-convert (librsvg). Writes brand/logo/, brand/favicon/ and brand/social/;
colours come from brand/brand.tokens.json, so a change of colour there is a re-run here.
"""
import json
import subprocess
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

BRAND = Path(__file__).resolve().parent.parent
TOKENS = json.loads((BRAND / 'brand.tokens.json').read_text())
HEX = {theme: {k: v['$value']['hex'] for k, v in TOKENS['color'][theme].items() if not k.startswith('$')} for theme in ('light', 'dark')}

# The mark: a ball in flight with its in-betweens, leaning up and to the right (viewBox 0 0 96 56).
BALLS = [(10, 40, 5, 0.2), (27, 31, 7, 0.38), (47, 24, 9, 0.62), (72, 21, 14, 1)]
MARK_W, MARK_H = 96, 56
SIZE = 100  # the wordmark's font size in the lockup's units


def outline(parts):
    """The path of `parts` ([(font, text)]) set at SIZE on one baseline at y = 0, and its ink bounds and advance."""
    pen_x, d, bounds = 0, [], None
    for font, text in parts:
        scale = SIZE / font['head'].unitsPerEm
        glyphs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
        for ch in text:
            name = cmap[ord(ch)]
            svg = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
            box = BoundsPen(glyphs)
            transform = (scale, 0, 0, -scale, pen_x, 0)
            glyphs[name].draw(TransformPen(svg, transform))
            glyphs[name].draw(TransformPen(box, transform))
            d.append(svg.getCommands())
            if box.bounds:
                b = box.bounds
                bounds = b if bounds is None else (min(bounds[0], b[0]), min(bounds[1], b[1]), max(bounds[2], b[2]), max(bounds[3], b[3]))
            pen_x += hmtx[name][0] * scale
    return ' '.join(d), bounds, pen_x


def balls(fill, scale=1.0, dx=0.0, dy=0.0):
    return ''.join(f'<circle cx="{dx + x * scale:.2f}" cy="{dy + y * scale:.2f}" r="{r * scale:.2f}" fill="{fill}"'
                   + (f' fill-opacity="{o}"' if o < 1 else '') + '/>' for x, y, r, o in BALLS)


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def main(regular, italic):
    word, (x0, y0, x1, y1), _ = outline([(TTFont(regular), 'motion'), (TTFont(italic), 'hub')])
    # the lockup: the mark at the wordmark's ink height, centred on it, a little under a quarter of the font size apart
    mark_h = (y1 - y0) * 0.86
    k = mark_h / MARK_H
    gap = SIZE / 4.5
    pad = 8
    w = pad + MARK_W * k + gap + (x1 - x0) + pad
    h = pad + max(mark_h, y1 - y0) + pad
    mark_top = pad + (h - 2 * pad - mark_h) / 2
    word_dx = pad + MARK_W * k + gap - x0
    word_dy = pad + (h - 2 * pad - (y1 - y0)) / 2 - y0

    def lockup(theme):
        c = HEX[theme]
        return svg(w, h, balls(c['mark'], k, pad, mark_top) + f'<path transform="translate({word_dx:.2f} {word_dy:.2f})" fill="{c["text"]}" d="{word}"/>', 'motionhub')

    out = BRAND / 'logo'
    out.mkdir(exist_ok=True)
    (out / 'logo.svg').write_text(lockup('light'))
    (out / 'logo-dark.svg').write_text(lockup('dark'))
    (out / 'mark.svg').write_text(svg(MARK_W, MARK_H, balls(HEX['light']['mark']), 'motionhub'))
    (out / 'wordmark.svg').write_text(svg(x1 - x0 + 2 * pad, y1 - y0 + 2 * pad,
                                          f'<path transform="translate({pad - x0:.2f} {pad - y0:.2f})" fill="currentColor" d="{word}"/>', 'motionhub'))

    def icon(ground, ink, radius=14, one_ball=False):
        body = f'<rect width="64" height="64" rx="{radius}" fill="{ground}"/>'
        body += (f'<circle cx="32" cy="32" r="17" fill="{ink}"/>' if one_ball else
                 f'<circle cx="22" cy="38" r="8" fill="{ink}" fill-opacity="0.4"/><circle cx="38" cy="28" r="13" fill="{ink}"/>')
        return svg(64, 64, body, 'motionhub')

    (out / 'icon.svg').write_text(icon(HEX['light']['text'], HEX['dark']['mark']))
    (out / 'icon-light.svg').write_text(icon(HEX['light']['header'], HEX['light']['mark']))
    (out / 'icon-16.svg').write_text(icon(HEX['light']['text'], HEX['dark']['mark'], one_ball=True))
    (out / 'icon-square.svg').write_text(icon(HEX['light']['text'], HEX['dark']['mark'], radius=0))
    fav = BRAND / 'favicon'
    fav.mkdir(exist_ok=True)
    (fav / 'favicon.svg').write_text(icon(HEX['light']['text'], HEX['dark']['mark']))
    (fav / 'site.webmanifest').write_text(json.dumps({
        'name': 'motionhub', 'short_name': 'motionhub', 'start_url': '/', 'display': 'browser',
        'background_color': HEX['light']['header'], 'theme_color': HEX['light']['header'],
        'icons': [{'src': f'/icon-{n}.png', 'sizes': f'{n}x{n}', 'type': 'image/png', 'purpose': 'any maskable'} for n in (192, 512)],
    }, indent=2) + '\n')

    # the share card a page without its own uses: the lockup on paper
    social = BRAND / 'social'
    social.mkdir(exist_ok=True)
    cw, ch, lw = 1200, 630, 720
    lh = lw * h / w
    inner = lockup('light').split('>', 1)[1].rsplit('</svg>', 1)[0].replace('<title>motionhub</title>', '')
    (social / 'og-default.svg').write_text(svg(cw, ch, f'<rect width="{cw}" height="{ch}" fill="{HEX["light"]["header"]}"/>'
                                               f'<svg x="{(cw - lw) / 2:.1f}" y="{(ch - lh) / 2:.1f}" width="{lw}" height="{lh:.1f}" viewBox="0 0 {w:.0f} {h:.0f}">{inner}</svg>', 'motionhub'))

    # raster copies for places that take no SVG, drawn by rsvg-convert (librsvg)
    for src, dst, size in [(out / 'icon.svg', fav / 'favicon-32.png', 32), (out / 'icon-square.svg', fav / 'apple-touch-icon.png', 180),
                           (out / 'icon-square.svg', fav / 'icon-192.png', 192), (out / 'icon-square.svg', fav / 'icon-512.png', 512),
                           (social / 'og-default.svg', social / 'og-default.png', 1200)]:
        subprocess.run(['rsvg-convert', '-w', str(size), str(src), '-o', str(dst)], check=True)
    print(f'lockup {w:.0f}x{h:.0f}, mark {MARK_W * k:.0f}x{mark_h:.0f}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
