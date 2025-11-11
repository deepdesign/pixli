# Device & Platform Expansion Backlog

_Last updated: 2025-11-10_

## 1. Progressive Web App Foundations

### 1.1 Installability & Offline Shell

- **Goal:** Deliver a PWA experience that installs cleanly on iPadOS, Android tablets, and desktop browsers.
- **Technical Guidance:**
  - Add `vite-plugin-pwa` with a manifest (`icons`, `display: standalone`, sensible `theme_color`).
  - Cache static assets via Workbox strategies (stale-while-revalidate for JS/CSS, cache-first for sprites).
  - Provide an offline fallback screen explaining limited functionality when new data can’t load.

### 1.2 Touch-Optimised UI Styling

- **Goal:** Ensure every control meets 44x44 px hit area guidelines and looks polished on high-DPI tablets.
- **Technical Guidance:**
  - Review Tailwind breakpoints (`md`, `lg`) to enlarge slider thumbs, buttons, and spacing on touch devices.
  - Leverage CSS `pointer` media query (`@media (pointer: coarse)`) to tweak hover states, focus rings, and tooltips.
  - Audit RetroUI components for touch feedback (active shadows, pressed states).

## 2. Input & Gesture Support

### 2.1 Pointer Event Unification

- **Goal:** Harmonise mouse, pen, and touch input for canvas interactions and sliders.
- **Technical Guidance:**
  - Switch event listeners to Pointer Events (`pointerdown`, `pointermove`, `pointerup`) in `generator.ts`.
  - Track pointer IDs to support multi-touch gestures in future updates.
  - Polyfill pointer events on Safari iOS via [`pepjs`](https://github.com/jquery/PEP) if needed.

### 2.2 Gesture Shortcuts

- **Goal:** Introduce tablet-friendly shortcuts without relying on modifier keys.
- **Technical Guidance:**
  - Use [`use-gesture`](https://use-gesture.netlify.app/) or [`@use-gesture/react`](https://github.com/pmndrs/use-gesture) for pinch-to-scale density and two-finger tap to reset view (optional).
  - Provide long-press or context menu actions for randomising sprites or opening the palette selection.
  - Make sure gestures coexist with the HUD—avoid accidental zoom when scrolling.

## 3. Layout & Performance Adaptation

### 3.1 Responsive Control Panels

- **Goal:** Reflow panels so the canvas remains central on portrait tablets.
- **Technical Guidance:**
  - Introduce a stacked layout below `1024px` width—Canvas pinned to the top of the viewport, control tabs rendered beneath it, with sections collapsible via accordion.
  - Use CSS Grid to allow the canvas to lock at a square aspect while controls scroll independently.
  - Persist tab state in URL hash so context is not lost on orientation changes.

#### 3.1.1 Mobile Navigation Collapse

- **Goal:** Optimize screen real estate on small viewports by collapsing navigation into compact menus.
- **Technical Guidance:**
  - **Side Navigation:** When viewport width falls below a threshold (e.g., `768px`), collapse the side navigation into a hamburger menu (overflow menu). Place this hamburger icon in the canvas card, outside the canvas area, positioned top-left.
  - **Settings Menu:** Collapse the top-right settings (theme toggle, dark/light mode) into a single cog icon, positioned top-right of the canvas card, outside the canvas area.
  - Both menus should use RetroUI button styling with appropriate touch targets (44×44 px minimum).
  - Implement slide-out drawer or dropdown menu patterns for the navigation menu, ensuring smooth animations and proper z-index layering.
  - Ensure menu state persists during orientation changes and doesn't interfere with fullscreen mode.

### 3.2 Adaptive Render Budgets

- **Goal:** Maintain smooth framerates on lower-power GPUs by scaling sprite counts.
- **Technical Guidance:**
  - Detect device class through `navigator.userAgentData` or heuristics; cap `scalePercent`, motion intensity on tablets.
  - Add a “Performance” toggle in settings to switch between full and battery saver presets.
  - Monitor FPS from `onFrameRate` callback; auto-adjust density when FPS < 30 for sustained periods.

### 3.3 Mobile Safari Hardening

- **Goal:** Close compatibility gaps for iOS Safari (iPhone & iPad).
- **Technical Guidance:**
  - Audit all interactions for Pointer Events coverage; provide fallbacks for browsers limited to Touch Events.
  - Enforce 44×44 px minimum tap targets and increase control spacing within Tailwind’s `pointer: coarse` media queries.
  - Introduce a web app manifest, service worker, and prompt messaging so users can “Add to Home Screen” with offline fallback.
  - Profile sprite density and motion presets on A-series devices; clamp defaults or offer a “Mobile-friendly” preset when FPS dips below 45.

### 3.4 Responsive Implementation Roadmap

- **Goal:** Define actionable steps for the responsive layout overhaul.
- **Technical Guidance:**
  - Add responsive Tailwind classes to convert the control column into a full-width stacked layout below `lg`.
  - Implement an accordion for each control section when stacked, ensuring keyboard accessibility (focus/ARIA states).
  - Elevate the canvas into a sticky top container for `md` and below, reserving the first viewport height for the artwork.
  - Introduce a compact HUD (Randomise/Reset) that docks to the bottom of the canvas when controls are collapsed.
  - Validate behaviour across orientation changes; cache tab/accordion state via URL hash or `sessionStorage`.

## 4. Native Shell Options

### 4.1 Capacitor Wrapper

- **Goal:** Package BitLab for iOS/iPadOS App Store and Android Play Store distribution.
- **Technical Guidance:**
  - Initialize [Capacitor](https://capacitorjs.com/) project; serve Vite build in a WebView.
  - Add native splash screens, app icons, and status bar colour options per platform.
  - Gate features that require file system or share sheet access behind Capacitor plugins.

### 4.2 Expo / React Native WebView

- **Goal:** Alternative React Native shell if tighter integration with native UI is desired.
- **Technical Guidance:**
  - Use Expo’s `WebBrowser` or `react-native-webview` component to host the app.
  - Bridge randomise/export buttons to native share sheets or Files app using Expo modules.
  - Keep JS bundle shared between web and native wrapper (monorepo with Nx/Turbo).

## 5. QA & Accessibility

### 5.1 Cross-Device Testing Matrix

- **Goal:** Establish a repeatable QA checklist covering major tablets and browsers.
- **Technical Guidance:**
  - Target Safari iPadOS (latest and n-1), Chrome/Edge on Android tablets, Chrome DevTools device emulation.
  - Use BrowserStack or LambdaTest for remote devices; capture video runs for regressions.
  - Script smoke tests via Playwright with `devices['iPad Pro 11']`.

### 5.2 Accessibility Enhancements

- **Goal:** Maintain accessibility parity on touch devices.
- **Technical Guidance:**
  - Ensure sliders expose accessible names and live regions for value changes (already partially in place).
  - Add voiceover-friendly descriptions where gestures substitute for buttons.
  - Verify colour contrast on OLED displays; consider high-contrast palette preset.

## 6. Technology Summary

| Area                      | Suggested Libraries / Tools                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| PWA Infrastructure        | `vite-plugin-pwa`, Workbox strategies, manifest tooling                                     |
| Touch Styling             | CSS `pointer: coarse` media queries, Tailwind responsive utilities                          |
| Pointer/Gesture Handling  | Pointer Events API, `@use-gesture/react`, optional `pepjs` polyfill                         |
| Layout Responsiveness     | CSS Grid/Flex, Tailwind `md`/`lg` breakpoints, orientation media queries                    |
| Performance Adaptation    | FPS monitoring hooks, heuristic device detection, runtime density clamps                    |
| Native Wrappers           | Capacitor CLI, Expo + `react-native-webview`, native splash/icon generation tooling         |
| QA Automation             | Playwright device profiles, BrowserStack/LambdaTest, CI artifact logging                    |
| Accessibility             | ARIA roles, focus management, WCAG colour contrast testing (`axe-core`, `storybook/a11y`)   |

## 7. Next Steps

1. Spike a minimal PWA configuration and validate install prompts on iPadOS Safari.
2. Prototype responsive control panel layout in a feature branch; test with simulated pointer:coarse.
3. Evaluate gesture library integration versus native pointer handling for density and canvas interactions.
4. Produce effort estimates for Capacitor and Expo wrappers; decide on distribution strategy.
5. Build a QA checklist template and integrate Playwright tablet tests into the CI pipeline.

