# RumiMind Mobile App

React Native + Expo mobile app for RumiMind — the cognitive strategy platform.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for device testing)
- iOS Simulator / Android Emulator (optional)

## Setup

```bash
cd mobile
npm install
```

## Assets

Before running, add placeholder assets in `assets/`:
- `icon.png` — App icon (1024x1024)
- `splash.png` — Splash screen
- `adaptive-icon.png` — Android adaptive icon
- `favicon.png` — Web favicon

Or use `npx expo prebuild` to generate default assets.

## Development

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go on device

## Configuration

### API URL

Edit `constants.ts`:
- **Development**: `localhost` (iOS) or `10.0.2.2` (Android emulator)
- **Production**: Your deployed backend URL

### Web App URL (WebView game)

Edit `constants.ts` — `WEB_APP_URL`:
- **Development**: Local Vite dev server (e.g. `http://10.0.2.2:5173` for Android)
- **Production**: Your deployed web app URL

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx       # Root layout, auth hydration
│   ├── index.tsx         # Entry redirect
│   ├── (auth)/           # Auth stack
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/            # Main app tabs
│       ├── index.tsx     # Home
│       ├── tournaments/  # Tournaments flow
│       ├── clubs/        # Clubs (coming soon)
│       ├── profile/      # Profile, edit, public
│       ├── store/        # Store
│       └── wallet/       # Wallet
├── api/                  # API modules (mirrors web)
├── stores/               # Zustand stores
├── components/
├── services/             # Push notifications, etc.
└── constants.ts
```

## Features

- **Auth**: Login, register, SecureStore token persistence
- **Tournaments**: List, create, join, lobby, match view
- **Match**: WebView game integration, report winner
- **Profile**: My profile, edit, public profile, friends
- **Store**: List items, purchase
- **Wallet**: Coins, gems, transaction history
- **Clubs**: Placeholder (coming in Step 24)
- **Push**: Foundation only (full impl in Step 26)

## Build for Production

```bash
# iOS
npx expo prebuild --platform ios
npx expo run:ios --configuration Release

# Android
npx expo prebuild --platform android
npx expo run:android --variant release
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform all
```

## App Store / Play Store

1. **App metadata**: Update `app.json` (name, slug, bundle IDs)
2. **Assets**: Add production icon, splash, screenshots
3. **Build**: Use EAS Build or local prebuild
4. **Submit**: App Store Connect, Google Play Console
