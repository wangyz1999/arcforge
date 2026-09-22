<div align="center">
  <a href="https://arcforge.org/" target="_blank" rel="noopener noreferrer">
    <img src="public/logo.webp" alt="ARC Forge Logo">
  </a>

[![Website](https://img.shields.io/badge/Website-arcforge.org-blueviolet?style=flat-square&logo=vercel)](https://arcforge.org/)
![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=wangyz1999.arcforge)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

**A live version of the website is hosted at <a href="https://arcforge.org/">arcforge.org</a>**

### Prerequisites

- Node.js 20.9+ (Node 22 or newer recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone https://github.com/wangyz1999/arcforge.git
cd arcforge
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

### Code Style

- Prettier is configured and runs automatically on staged files via Husky + lint-staged when you make a commit.

## Data Pipeline

Refresh the catalog from the ARC Raiders Wiki's public MediaWiki and Cargo APIs:

```bash
npm run data:refresh
npm run data:check
npm test
```

The refresh discovers items and weapons, fetches source revisions and images, and rebuilds crafting, upgrade, repair, recycling, salvage, trader, workshop, quest, and project data. It validates all graph references before publishing and refuses unexpectedly large catalog deletions. Network errors leave the published data untouched. Node is the only runtime required.

For an offline rebuild of the last downloaded snapshot, run `npm run data:refresh -- --offline`. The ignored `.cache/arc-wiki/` directory must be present; the original check date is preserved. `python script/run_pipeline.py` is a compatibility wrapper for the same importer. The older scraper and manual-adjustment scripts are historical utilities, not the current pipeline.

`data/data_status.json` records the actual item-data check date. Item details link to their wiki source revisions. Future item stats are not inferred from announcements.

Project requirements use the wiki's project names, stages, and listed end dates; personal Expeditions 1–5 are distinct. Expired projects are excluded on refresh. Ermal's rotating barter stock is linked rather than treated as permanent offers. Unknown source values stay unspecified, and untranslated item names fall back to English. No material is labeled universally safe to recycle.

The September 22, 2026 UTC snapshot contains 524 items, 24 weapons, and six traders, including newer equipment, blueprints, and quest items.

### Data attribution

Wiki-derived data is adapted from [ARC Raiders Wiki contributors](https://arcraiders.wiki/) under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each item links to its source revision. Game artwork and game content belong to Embark Studios AB. The application code remains MIT licensed; ARC Forge is an unofficial community companion.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Graph Visualization**: [Cytoscape.js](https://js.cytoscape.org/)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Data Source**: [ARC Raiders Wiki](https://arcraiders.wiki/)

## Project Structure

```
arcforge/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── proxy-image/      # Image proxy for wiki thumbnails
│   ├── components/           # React components
│   ├── i18n/                 # Internationalization
│   │   └── translations/     # Translation files
│   │       ├── {lang}.json       # UI strings
│   │       └── items_{lang}.json # Item names
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Item database page
├── data/                     # JSON data files
│   ├── items_database.json   # Complete item data
│   ├── items_relation.json   # Item relationships for graph
│   └── names.txt             # Item name list
├── public/                   # Static assets
│   ├── logo.webp
│   └── ...
└── script/                   # Python data processing scripts
    ├── get_item_data_from_wiki.py
    ├── build_relation_graph.py
    ├── adjust_item_data.py
    └── run_pipeline.py
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

If you find this work helpful, please consider to **star🌟** this repo. Thanks for your support!
[![Stargazers repo roster for @wangyz1999/arcforge](https://reporoster.com/stars/wangyz1999/arcforge)](https://github.com/wangyz1999/arcforge/stargazers)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">
  Made with ❤️ for the ARC Raiders community
</div>
