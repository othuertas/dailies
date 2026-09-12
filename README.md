# The Dailies

A personal daily games hub — track, play, and organize your favorite daily browser games. Built as a static GitHub Pages site with vanilla HTML, CSS, and JavaScript.

**Live at [dailies.othuertas.com](https://dailies.othuertas.com)**

## Features

- 🌓 **Dark & light mode** with system preference detection
- ⏰ **Seven-segment countdown clock** to next daily reset (midnight)
- 🏷️ **Tab-based filtering** by game category
- ⭐ **Favorites** — star games for quick access
- ✅ **Daily completion tracking** — auto-resets at midnight
- 📊 **Completed/total counter** relative to the active tab
- 🌐 **Multi-language support** (English, Catalan, Spanish) for tags, descriptions, and messages
- 🔀 **Drag-to-reorder** games (hold and drag on mobile)
- 💾 **Persistent state** — favorites, order, language, and theme saved in your browser
- 🎉 **Easter egg** when all games are completed
- 📱 **Fully responsive** layout

## How to Add or Edit Games

The games database is a CSV file at [`data/games.csv`](data/games.csv). Open it in any spreadsheet app (Excel, Numbers, Google Sheets) or text editor.

| Column           | Description                                  | Example                                              |
|------------------|----------------------------------------------|------------------------------------------------------|
| `name`           | Game title                                   | `Wordle`                                             |
| `url`            | Link to the game                             | `https://www.nytimes.com/games/wordle/index.html`    |
| `description_en` | English description                         | `Guess the hidden five-letter word in six tries.`    |
| `description_ca` | Catalan description                         | `Endevina la paraula oculta de cinc lletres...`      |
| `description_es` | Spanish description                         | `Adivina la palabra oculta de cinco letras...`      |
| `tags`           | Categories separated by `;`                  | `Word;Logic;English`                                 |

*(Note: A single `description` column is also supported as fallback.)*

**Available tags:** Visual · Audio · Word · Logic · Quiz · Music · Trivia · Català · Español · English

To add a game, add a new row. Save, commit, and push — done.

## Project Structure

```
├── index.html              Main HTML page
├── css/
│   └── styles.css          Design system & all styles
├── js/
│   ├── app.js              Application logic
│   └── clock.js            Seven-segment countdown clock
├── data/
│   └── games.csv           Games database (edit this!)
├── assets/
│   ├── wordmark-dark.png   Logo for light mode
│   └── wordmark-light.png  Logo for dark mode
├── favicon.png
├── CNAME                   Custom domain config
└── README.md
```

## Local Development

Since this site uses `fetch()` to load the CSV, you need a local HTTP server:

```bash
# Python 3
python -m http.server 8000

# Or with Node.js
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000).

## Deployment

Deployed automatically via **GitHub Pages** — just push to the main branch.
