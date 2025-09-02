# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🎮 Mini Games Collection

A beautiful React.js web application featuring four interactive mini-games built with TypeScript and Vite.

## 🎯 Games Included

### 🎡 Spin the Wheel
- Colorful spinning wheel with 8 different prize sections
- Smooth CSS animations with realistic physics
- Random outcome selection with visual feedback
- Beautiful gradient color scheme

### 🎰 Slot Machine
- Classic 3-reel slot machine with animated reels
- Multiple symbols: cherries, lemons, oranges, grapes, bells, stars, diamonds, and lucky sevens
- Different win conditions (three of a kind, pairs, jackpots)
- Retro casino styling with blinking lights

### 🎱 Draw a Ball
- Lottery-style ball drawing system
- 50 numbered balls available for drawing
- Animated ball selection with bouncing effects
- Track drawn balls and remaining balls
- Reset functionality to start over

### 🃏 Card Picker
- Random card selection from a standard 52-card deck
- Realistic playing card design with proper suits and colors
- Card flip animations and reveals
- Deck shuffling and management
- Card information display

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd minigames
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **CSS3** - Custom animations and responsive design
- **Modern ES6+** - Latest JavaScript features

## 📱 Features

- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Smooth Animations** - CSS-powered animations for engaging gameplay
- **Type Safety** - Full TypeScript implementation
- **Modern UI** - Beautiful gradient backgrounds and modern styling
- **Game State Management** - Proper state handling for each game
- **Interactive Feedback** - Visual and textual feedback for all actions

## 🎨 Design Features

- Beautiful gradient backgrounds
- Smooth hover and click animations
- Responsive grid layout for game selection
- Modern card-based UI design
- Consistent color scheme throughout
- Mobile-friendly interface

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Game components
│   ├── SpinTheWheel.tsx
│   ├── SlotMachine.tsx
│   ├── DrawABall.tsx
│   └── CardPicker.tsx
├── App.tsx             # Main application component
├── App.css             # Main application styles
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## 🎯 How to Play

1. **Main Menu**: Choose from four different mini-games
2. **Game Play**: Each game has intuitive controls and clear instructions
3. **Results**: Visual feedback shows your results and outcomes
4. **Navigation**: Easy back button to return to the main menu
5. **Reset**: Most games include reset functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🎉 Enjoy Playing!

Have fun with these mini-games! Perfect for quick entertainment or as a learning resource for React development.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
