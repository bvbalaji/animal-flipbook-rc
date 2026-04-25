# 🐾 Animal Flipbook

A React + TypeScript flipbook app featuring domestic and wild animals, built with Vite and CSS Modules.

## Project Structure

```
animal-flipbook/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── main.tsx              # Entry point
    ├── App.tsx               # Root component
    ├── App.module.css
    ├── index.css             # Global styles
    ├── types/
    │   └── animal.ts         # TypeScript interfaces & types
    ├── data/
    │   └── animals.ts        # Animal data array
    ├── hooks/
    │   └── useFlipbook.ts    # Custom hook (state, keyboard nav)
    └── components/
        ├── FilterTabs.tsx    # All / Domestic / Wild tabs
        ├── FilterTabs.module.css
        ├── Book.tsx          # Book wrapper with stacked pages effect
        ├── Book.module.css
        ├── AnimalPage.tsx    # Single flipbook page
        ├── AnimalPage.module.css
        ├── NavButton.tsx     # Prev / Next arrow button
        └── NavButton.module.css
```

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for production
```bash
npm run build
```
Output goes to the `dist/` folder — deploy that to any static host.

## Deploying

### Netlify (drag & drop)
1. Run `npm run build`
2. Drag the `dist/` folder into [netlify.com/drop](https://netlify.com/drop)

### GitHub Pages
1. Run `npm run build`
2. Push `dist/` to the `gh-pages` branch (or use `gh-pages` npm package)

### Vercel
```bash
npm i -g vercel
vercel
```

## Features
- 12 animals (6 domestic, 6 wild) with fun facts
- Filter tabs: All / Domestic / Wild
- Animated page flip transitions
- Keyboard arrow key navigation (← →)
- Fully responsive (mobile-friendly)
- TypeScript strict mode, CSS Modules, component-based architecture
