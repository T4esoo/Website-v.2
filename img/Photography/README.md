# Photography images

The gallery is album-based: `photography.html` shows a grid of album covers, and
clicking one opens that album's photos.

## Adding photos

1. **Drop the files** into `img/Photography/<Album>/` — make the folder if the
   album is new. The folder name becomes the album title.
2. **Run the script.** It resizes, converts to WebP, reads the dimensions, and
   rewrites `js/photos-data.js`:

   ```
   py -3 tools/photos.py --optimize
   ```

3. **Write the captions.** New photos arrive with `TODO: describe this photo` —
   search the manifest for TODO and replace each one.
4. **Preview** with `py -3 -m http.server 8765`, then open
   http://localhost:8765/photography.html

Anything already written — captions, album titles, blurbs, covers, and the album
order — is preserved on every run. Drop `--optimize` to rewrite the manifest
without touching image files, or use `--check` to see what would change without
writing anything.

`--optimize` never deletes: the full-size original is moved to
`img/Photography/_originals/`, which is git-ignored, so masters stay on disk but
are never published.

Naming still helps you: `puffin-landing.webp` beats `NEB07331.webp` when you're
scanning the manifest later.

If you'd rather export by hand, the settings below are what the script applies.

## Export settings

| Setting | Use | Why |
| --- | --- | --- |
| Format | **WebP** | 25–35% smaller than JPEG at the same quality; supported by every browser since 2020 |
| Long edge | **2000–2400px** | The same file feeds both the grid tile and the full-screen lightbox. 2000px covers a full-screen view on a 2× laptop display; beyond ~2400px is bandwidth nobody sees |
| Quality | **80–85** | Visually lossless for photographs. Above 90 the file grows fast for no visible gain |
| Target size | **200–400 KB** | Under 500 KB each. A 30-photo album is then ~9 MB total, and lazy loading means only what's on screen downloads |
| Colour profile | **sRGB** | Anything else renders with shifted colour in browsers |

Avoid: **PNG** for photographs (lossless, often 5–10× larger — fine only for
screenshots or flat-colour graphics), **HEIC** (no browser support), and
untouched camera JPEGs straight off the card (usually 6000px and 8+ MB).

**AVIF** compresses ~20% better than WebP and is worth considering if an album
gets large, but it encodes slowly and only reaches Safari 16.4+ (2023).

## Things specific to this layout

- **Any aspect ratio works.** The album page packs photos into justified rows —
  uniform row height, widths set by each photo's ratio — so portrait and
  landscape mix freely. Extreme panoramas (wider than ~3:1) will squash their
  row short; give those their own row-mates or expect a thin strip.
- **Album covers are cropped to 16:9 from the centre.** The cover defaults to the
  album's first photo; if that doesn't survive a centre crop, set `cover` on the
  album to a photo that does.
- **`alt` is also the caption.** It's read aloud by screen readers *and* printed
  under the photo in the lightbox, so write a real description — "Fog rolling
  over the Wabash at dawn", not "photo 4".
- **`w`/`h` must be right.** Rows are laid out from those numbers before the
  images load, which is what stops the page reflowing as they arrive. Wrong
  values mean visibly wrong proportions until you fix them.
