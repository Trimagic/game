# Mobile layout audit

Verified in the in-app browser at 320 × 568 CSS pixels, in chapter order 1–11.

All eleven running game layouts fit the viewport without document scrolling. Checked entry dialogs for arcade games, retry for bicycle, pause for pool/cooking/night, and loss for sleep. This is layout verification, not a complete playthrough of every game. A physical Telegram WebView was not tested.

| Chapter | Game | Document overflow after fixes |
|---|---|---|
| 1 | Bicycle | 0 px |
| 2 | Pool | 0 px |
| 3 | Shopping | 0 px |
| 4 | Cooking | 0 px |
| 5 | Gym | 0 px |
| 6 | Sleep | 0 px |
| 7 | Running | 0 px |
| 8 | Schedule | 0 px |
| 9 | Remote | 0 px |
| 10 | Delivery | 0 px |
| 11 | Night | 0 px |

All four intro panels for every chapter and all pre-game instruction/fact pages were traversed through the actual App reader. Both document and instruction-content overflow were 0 px after the shopping artwork and schedule list fixes. Long instructions now paginate on phones. Desktop presentation is unchanged. Scroll remains available as an accessibility fallback for enlarged fonts and unusual viewport sizes.

Local QA entries: `/tests/mobile-preview` and `/tests/reading-preview`. Neither writes chapter completion. These entries are not included in the production build. Tests: 95 passed; TypeScript and production build passed.
