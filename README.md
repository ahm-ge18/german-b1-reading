# Lesesaal

A minimal, monochrome German B1 reading site. Every German word is followed by a
short English gloss in parentheses, for example:

> Sie (She) geht (goes) in (into) ein (a) Reisebüro (travel agency).

## Run it

Open `index.html` directly, or serve the folder locally:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Controls

- **Translations** / `T` — show or hide the English glosses
- **A− / A+** or `−` / `+` — change the reading size
- **← / →** — previous or next text
- **◐** — light / dark monochrome theme
- Click or tap a word to hold its translation

## Files

- `index.html` — page shell
- `assets/style.css` — monochrome styles
- `assets/app.js` — routing, rendering, controls
- `data/texts.js` — all texts and their word glosses
- `01_reading/` — the original plain-text sources

## Add or edit a text

Texts live in `data/texts.js`. A paragraph is a template string where each German
word is followed by `{english gloss}`:

```js
`Sie{She} geht{goes} in{into} ein{a} Reisebüro{travel agency}.`
```

Punctuation goes outside the braces. Keep every German word annotated; the site
renders the gloss in small grey text after the word.
