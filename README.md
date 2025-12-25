<div align="center">
  <a href="https://arcforge.org/" target="_blank" rel="noopener noreferrer">
    <img src="public/logo.webp" alt="ARC Forge Logo">
  </a>

[![Website](https://img.shields.io/badge/Website-arcforge.org-blueviolet?style=flat-square&logo=vercel)](https://arcforge.org/)
![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=wangyz1999.arcforge)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

**A live version of the website is hosted at <a href="https://arcforge.org/">arcforge.org</a>**

### Prerequisites

- Node.js 18+
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

The project includes Python scripts to scrape and process item data from the ARC Raiders wiki:

```bash
cd script
python run_pipeline.py
```

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
