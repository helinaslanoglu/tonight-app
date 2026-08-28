# Tonight — Mobile Social Party Game App

A modern, fast-paced party game application built with React Native and Expo. Players get together with friends, select a vibe (Funny, Party, Date, Deep Talk, Chaos, Chill), add players, and jump into curated question decks.

---

## 🛠 Tech Stack

- **Framework**: [Expo SDK 57](https://docs.expo.dev/) (React Native 0.86, React 19)
- **Routing**: [Expo Router v57](https://docs.expo.dev/router/introduction/) (file-based navigation)
- **Language**: TypeScript 6 (strict mode enabled)
- **State Management**: [Zustand v5](https://zustand-demo.pmnd.rs/) with atomic selector hooks
- **Local Persistence**: `@react-native-async-storage/async-storage` (typed storage layer)
- **Animations**: `react-native-reanimated` v4 (worklet model, new architecture)
- **Styling**: Centralized design token system (`src/theme/`) + React Native `StyleSheet`

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npx expo start
```

Press `i` in the terminal to open the **iOS Simulator**, or `a` for **Android Emulator**.

---

## 📂 Project Architecture

```
tonight-app/
├── app.json                # Expo application configuration
├── eslint.config.js        # ESLint flat config (expo-config)
├── package.json            # Project dependencies & scripts
├── tsconfig.json           # Strict TypeScript configuration (@/* paths)
│
└── src/
    ├── app/                # Expo Router file-based screens & layouts
    ├── components/
    │   └── ui/             # Reusable UI component library (AppText, AppButton, AppCard, etc.)
    ├── data/               # Data-access abstraction layer (ContentProvider contracts)
    ├── hooks/              # Custom reusable React hooks
    ├── store/              # Zustand global session & state slices
    ├── theme/              # Centralized design tokens, typography, and theme API
    ├── types/              # Domain TypeScript types & interfaces
    └── utils/              # Resilient storage and helper utilities
```

---

## 🧪 Development Commands

| Command | Description |
|---|---|
| `npx tsc --noEmit` | Run strict TypeScript type check |
| `npm run lint` | Run ESLint check |
| `npx expo start --ios` | Start dev server directly in iOS Simulator |
| `npx expo start --android` | Start dev server in Android Emulator |
