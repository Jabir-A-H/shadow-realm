# Shadow Realm — Technical Specification & Architecture

This document serves as the canonical technical reference for the **Shadow Realm** codebase.

---

## 1. Directory Structure

```
shadow-realm/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── capacitor.config.ts          # Android & iOS configuration
├── src-tauri/                   # Tauri v2 Windows EXE setup
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                        # Architecture & design documents
├── public/
│   ├── audio/                   # Sound effects, ambient tracks
│   └── sprites/                 # Tilesets, silhouette sheets, parchment textures
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind v4 theme tokens & ink displacement filters
    ├── contexts/
    │   ├── SpectrumContext.tsx   # Manages active pigments & world visibility masks
    │   ├── SaveGameContext.tsx   # Game progress, unlocked seals, local/cloud storage
    │   └── AudioContext.tsx      # Web Audio API sound manager & music mixer
    ├── components/
    │   ├── overworld/
    │   │   ├── OverworldCanvas.tsx # Kaplay / 2D Canvas tilemap renderer
    │   │   ├── WorldMapModal.tsx   # Parchment 7 Kingdoms map
    │   │   ├── DialogueOverlay.tsx # Silhouette portrait NPC conversations
    │   │   └── BossIntroCutscene.tsx# Shadow Fight 2 style pre-duel clash animation
    │   ├── ui/
    │   │   ├── GreatScroll.tsx     # 7 Vermilion Seals status & trophy museum
    │   │   ├── QuickArcadeDrawer.tsx# Direct jump launcher for instant play / lobbies
    │   │   └── HUD.tsx             # Active color gems, compass, pause menu
    │   └── games/                  # Ported & Themed Game Components
    │       ├── maai/               # Ma-ai (The Neutral) 1D Spacing Duel
    │       ├── impact/             # Ink Impact (Space Impact-style horizontal ink shmup)
    │       ├── archery/            # Sky Cerulean Range (Yoichi's Peak)
    │       ├── uno/                # The Gilded Den (1v1, 6P Party, No Mercy)
    │       ├── fleet/              # Abyssal Navy Bay (Battleship vs AI/Online)
    │       ├── rush/               # River Crossings 2-lane reflex runner
    │       ├── slide/              # Frost Reach 30-level ice puzzles
    │       ├── bloom/              # Verdant Reach chain reaction garden
    │       ├── tictactoe/          # Scorched Dunes Gomoku/TTC
    │       ├── connect4/           # Red Viper's Gravity Grid
    │       ├── sudoku/             # Citadel 200 rated logic scrolls
    │       ├── memory/             # Archive speedrun glyph matching
    │       ├── outlaw/             # Top-down twin-stick badlands arena
    │       └── reaction/           # Bamboo grove quick-draw reflex test
    └── lib/
        ├── engine/
        │   ├── tilemapData.ts      # 7 Kingdoms continental coordinates & triggers
        │   ├── collision.ts        # Overworld obstacle & color-gate detection
        │   └── colorFilters.ts     # Canvas/SVG color tint shaders
        ├── games/                  # Core engines
        │   ├── useArcadePeerRoom.ts# Supabase Realtime multiplayer engine
        │   ├── minimax.ts          # Connect-4 & Gomoku AI
        │   ├── slideSolver.ts      # BFS ice puzzle validator
        │   └── arcadeCrypto.ts     # Room IDs & crypto callsigns
        └── supabase.ts             # Supabase client credentials
```

---

## 2. Core Systems & State Machines

### 2.1 SpectrumContext (The Chromatic Engine)
Manages the player's unlocked pigments and current perception tier:

```typescript
export type Pigment = 
  | 'frost-cyan'     // The Frozen Reach
  | 'abyssal-navy'   // The Drowned Isles
  | 'sky-cerulean'   // The High Vale
  | 'molten-gold'    // The Gilded Vault
  | 'emerald-jade'   // The Verdant Reach
  | 'rushing-teal'   // The River Crossings
  | 'blood-vermilion'// The Scorched Dunes
  | 'full-spectrum'; // The Obsidian Citadel

export interface SpectrumState {
  unlockedPigments: Set<Pigment>;
  activeOverlayColor: Pigment | null;
  unlockPigment: (pigment: Pigment) => void;
  hasPigment: (pigment: Pigment) => boolean;
}
```

### 2.2 Overworld-to-Minigame Transition Flow

1. Player approaches an Arena Gate or Warden Shrine on the overworld map.
2. An interaction prompt appears (`Press E or Tap to Challenge`).
3. Pressing interact triggers `BossIntroCutscene`:
   - Overworld pauses.
   - Screen dims with an ink splatter animation.
   - Dramatic 1v1 silhouette standoff with Japanese calligraphy titles (*"VS. THE FROST KING"*).
4. Minigame mounts in a full-screen or focused modal shell with regional color accents.
5. On victory:
   - Vermilion Seal stamping sequence plays.
   - Corresponding pigment is added to `SpectrumContext`.
   - Overworld unpauses; newly unlocked environmental paths solidify.

### 2.3 Multiplayer Networking Architecture
* Built on **Supabase Realtime** (`broadcast` + `presence`).
* Zero database table writes required for real-time play; all game packets are ephemeral WebSocket broadcasts.
* Room codes are 4-character unambiguous uppercase strings (`generateRoomId`).
* 1-Click invite URLs formatted as `https://domain.com/duel?room=CODE&game=uno`.

---

## 3. Export Targets

* **Web**: Single Page Application built by Vite into `dist/`.
* **Android (APK/AAB)**: Capacitor configuration with Android hardware-accelerated WebView, fullscreen flags, and haptic feedback.
* **Windows (EXE)**: Tauri v2 configuration using Windows WebView2 runtime, compiling into a lightweight, self-contained desktop executable.
* **iOS (IPA)**: Capacitor iOS project with safe-area insets and touch-manipulation optimizations.
