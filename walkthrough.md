# UI & Gameplay Refinement Walkthrough

## Summary

In this update, we resolved all 3 user requests:
1. **Circular Language Button**: Replaced the 4 large language pills in the body with a sleek circular button in the top-left navigation bar (`🇬🇧`, `🇹🇷`, `🇫🇷`, `🇸🇦`) that opens a slide-up `LanguagePickerModal`.
2. **Pass The Phone (Telefonu Pasla) Gameplay Mechanic**: Updated the game logic and strings across all 4 languages so that the **selector** (the person who chose the target) is the one facing the dilemma: either **take a shot to keep the secret hidden** from the target/group, or **reveal the question** to the target and the group.
3. **Screen Scrolling Restored**: Fixed `ScreenContainer` ScrollView styles (`flexGrow: 1` without `flex: 1` locking in `contentContainerStyle`) and removed touch responder interception so screens scroll smoothly on all devices.

---

## Visual Verification (iOS Simulator)

### Redesigned Setup Screen with Top-Left Circular Language Button
![Setup Screen with Top-Left Circular Language Button](/Users/apple/.gemini/antigravity-ide/brain/48f4d0bc-3366-4934-b97b-dbeabf8755c7/sim_setup_circular_lang.png)

---

## Detailed Changes

### 1. Circular Language Button & Modal (`src/components/ui/LanguagePickerModal.tsx` & `src/app/game-setup.tsx`)
- Placed a 36x36 circular button with active flag emoji in the top-left navigation bar next to the back button.
- Tapping the circular button opens the `LanguagePickerModal` with all 4 supported languages (`English`, `Türkçe`, `Français`, `العربية`).
- Selecting a language updates the store and UI instantly while keeping the setup screen uncluttered.

### 2. Pass The Phone Dilemma Logic (`src/engine/pass-phone-engine.ts`, `src/app/game.tsx`, `translations/*.ts`)
- The selector chooses a target player.
- The selector then chooses:
  - 🥃 **Shot At (Sır Kalsın) / Take a Shot (Keep Secret)**: Selector drinks; the secret question remains 100% hidden from the target and the group.
  - 👁️ **Soruyu İtiraf Et / Reveal Question**: Selector refuses to drink; the question and selection are revealed to the target and the group.
- The outcome screen displays whether a shot was taken to keep the secret or the question was revealed before advancing to the next round.

### 3. Screen Scrolling Fix (`src/components/ui/ScreenContainer.tsx`)
- Fixed `ScrollView` inside `ScreenContainer` so `contentContainerStyle` expands dynamically with `flexGrow: 1` and does not inherit `flex: 1`.
- Removed outer `TouchableWithoutFeedback` wrapper that intercepted scroll touch gestures in `game-setup.tsx`.

---

## Test & Build Verification

- **Milestone 8.5 Localization Tests**: **21/21 passed** (`localization.test.ts`)
- **Milestone 8 Pass The Phone Tests**: **23/23 passed** (`pass-phone-engine.test.ts`)
- **Milestone 8 Group Response Tests**: **9/9 passed** (`response-engine.test.ts`)
- **Milestone 7.5 Game Engine Tests**: **7/7 test groups passed** (`game-engine.test.ts`)
- **Milestone 5.1 AI Tests**: **5/5 passed** (`ai-subsystem.test.ts`)
- **TypeScript (`npx tsc --noEmit`)**: **0 errors**
- **ESLint (`npm run lint`)**: **0 errors / 0 warnings**
