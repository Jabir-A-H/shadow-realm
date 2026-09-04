# Shadow Realm: The Chromatic 7 Kingdoms

> *"In my hubris, I sought the ultimate mastery and shattered the Ancient Seal. The primordial ink surged forth, devouring the sun, dissolving my flesh into living shadow, and bleeding the realm dry of all light and color.*  
> *The continent fractured into seven domains, each claimed by a powerful Warden who hoards one of the world's primordial pigments. Trapped as a silhouette, I must walk the Parchment Realm, conquer each Warden in their sacred trial, and stamp the Seven Vermilion Seals back into the Great Scroll to restore the stolen spectrum."*

---

## 🧭 Overview

**Shadow Realm** is a cross-platform 2D Action-RPG that unites classic web minigames, reflex shooters, and martial arts combat into an expansive continental adventure.

* **The Structure**: A top-down 2D Overworld RPG inspired by Google's *Doodle Champion Island Games*. Walk across biomes, discover hidden paths, converse with cryptic silhouette spirits, and challenge regional Wardens in their dojos.
* **The Visuals & Lore**: Feudal Japanese sumi-e ink wash and watercolor backdrops with razor-sharp black silhouette characters inspired by *Shadow Fight 2*.
* **The Geography**: A vertical continental landmass paying homage to the *Game of Thrones 7 Kingdoms*, complete with regional specialties, biomes, and lore Easter eggs.
* **The Core Loop**: A **Chromatic Metroidvania**. The game begins in stark 2-tone monochrome (Sumi Charcoal on Aged Parchment). Defeating each Warden reclaims their realm's sacred pigment, unlocking invisible bridges, ancient runes, and hidden trials across previous regions.

---

## 🗺️ The 7 Kingdoms & Regional Wardens

```
                         [THE FROZEN REACH / THE WALL]
                                (Frost Cyan)
                                     │
                            [THE DROWNED ISLES]
                               (Abyssal Navy)
                                     │
                           [THE RIVER CROSSINGS]
                               (Rushing Teal)
                               /            \
                 [THE GILDED VAULT]       [THE HIGH VALE]
                   (Molten Gold)           (Sky Cerulean)
                              \            /
                           [THE VERDANT REACH]
                             (Emerald Jade)
                                     │
                           [THE SCORCHED DUNES]
                            (Blood Vermilion)
```

| Region (GoT Equivalent) | Warden & Title | Reclaimed Pigment | Signature Trials & Arenas | Realm Motto |
| :--- | :--- | :--- | :--- | :--- |
| **The Frozen Reach** *(The North / The Wall)* | **The Frost King** *(Ice Lich)* | **Frost Cyan** (`#48cae4`) | **Ink Slide** (30 BFS ice-puzzle ruins) + **Ma-ai Duel** | *"Winter is Drawn."* |
| **The Drowned Isles** *(Iron Islands / Pyke)* | **Lord of the Kraken** | **Abyssal Navy** (`#1d3557`) | **Ink Fleet** (Naval combat with Supabase Realtime) | *"What is Sunk May Never Float."* |
| **The High Vale** *(The Eyrie / Vale of Arryn)* | **The Wind Hawk** | **Sky Cerulean** (`#90e0ef`) | **Archery** (Gale wind target range) + **Ink Impact** (Sky Shmup) | *"As High as the Arrow Flies."* |
| **The Gilded Vault** *(Westerlands / Lannister)* | **The Golden Patriarch** | **Molten Gold** (`#e0a96d`) | **Uno** (High-stakes card den, No Mercy, Stack wars) | *"A Warden Always Pays His Debt."* |
| **The Verdant Reach** *(Highgarden / Tyrell)* | **Lady of the Thorns** | **Emerald Jade** (`#2d6a4f`) | **Bloom (Chain Reaction)** (Explosive organic seed cascades) | *"Growing Explosions."* |
| **The River Crossings** *(Riverlands / Tully)* | **The Phantom Courier** | **Rushing Teal** (`#0077b6`) | **Ink Rush** (2-lane rapid reflex runner) + **Reaction-Time** (Quick-draw) | *"Family. Duty. Reflexes."* |
| **The Scorched Dunes** *(Dorne / Red Waste)* | **The Red Viper** | **Blood Vermilion** (`#b3312c`) | **Connect-4 / Gomoku** + **Rogue Outlaw** (Badlands top-down arena) | *"Unbowed. Unbent. Unbeaten."* |
| **The Obsidian Citadel** *(Oldtown / King's Landing)* | **The Grand Archivist** | **Full Spectrum Prism** | **Sudoku & Memory Flip** + **Type.Knight Calligraphy Climax** | *"Knowledge is Shadow."* |

---

## 🎮 Game Roster: 5 Disciplines of Mastery

### 1. ⚔️ Martial Arts Clashes (Boss Duels)
* **Ma-ai (The Neutral)**: Inspired by *Footsies*. 1D horizontal neutral spacing, walk forward/back, block, quick poke, heavy strike, and whiff punishing. First to 3 clean strikes wins.
* **Nightblade**: 2D fighting game framework with fluid silhouette animations, input-buffered combo chains, stamina management, and special moves.
* **Shogun Showdown**: Tactical 1D turn-based samurai positioning and action queueing.

### 2. ⚡ Reflex & Action
* **Ink Impact**: Inspired by Nokia's *Space Impact*. Side-scrolling ink-splatter shooter on textured rice paper with Wide Brush and Ink Shield power-ups.
* **Rogue Outlaw**: Top-down twin-stick / WASD + mouse arena shooter against bandit waves in the badlands.
* **Reaction-Time**: Quick-draw bamboo grove showdown ("Ready... Set... Strike!").
* **Ink Rush**: Fast-paced 2-lane reflex runner dodging jagged ink barriers.

### 3. 🧠 Tactical Strategy & Puzzles
* **Archery**: Olympic set system with drift, wind compensation, and hold-to-draw trajectory calculation.
* **Bloom (Chain Reaction)**: Critical mass explosive seed cascades across dynamic grid topologies.
* **Connect Four & Gomoku**: Tactical grid games powered by alpha-beta minimax AI.
* **Ink Slide**: 30 hand-crafted, BFS solver-validated ice-sliding puzzle levels with brakes and hazard smudges.
* **Mummy Maze Crypts**: Turn-based deterministic pursuer evasion (2:1 step ratio).

### 4. 🎴 The Grand Parlor & Naval Bay (Multiplayer)
* **Uno (Gilded Den)**: Solo vs CPU, 1v1 online duel, or 6-player party with bot injection, No Mercy 25-card knockouts, Jump-in slap steals, and Seven-0 hand rotations. Powered by **Supabase Realtime WebSockets**.
* **Ink Fleet**: Naval combat across foggy waters with hunt-and-target AI and private-room online multiplayer.

### 5. 📜 Ancient Archives & Tavern Side-Bounties
* **Sudoku**: 200 rating-ranked puzzles with pencil marks and conflict highlighting.
* **Memory Flip**: Speedrun glyph matching against forgetting AI.
* **14 Classic HTML5 Web Games**: Memory Match, Simple Maze, Snake, Pong, Breakout, Space Invaders, Hangman, Minesweeper, Pac-Man, Simon Says.

---

## 🌈 The Chromatic Metroidvania System

```
[Start: Dual-Tone Sumi-e] ──(Defeat Warden 1)──► [+ Frost Cyan]
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
             [Solidifies Ice Bridges]                                      [Reveals Hidden Caverns]
                         │                                                             │
                 (Defeat Warden 2)                                             (Backtracking Secrets)
                         ▼                                                             ▼
                 [+ Molten Gold] ───────────────────────────────► [Unlocks Gilded Speakeasy Doors]
```

* **World Masking**: Environmental barriers (chasms, walls, mist) check `SpectrumContext`. Unlocking pigments transforms the world visually and opens new geographic passages.
* **Perception Shifts**: Revisit earlier kingdoms with new pigments to see previously invisible NPC spirits, side-quests, and forgotten shrines.

---

## 🛠️ Architecture & Tech Stack

* **App Shell**: **Vite + React 19 + TypeScript + Tailwind CSS v4**
* **2D Overworld & Action Canvas**: **Kaplay.js** / Custom 2D Canvas embedded in React.
* **Multiplayer Networking**: **Supabase Realtime** (`broadcast` + `presence` WebSockets, zero-DB latency).
* **Cross-Platform Export Pipeline**:
  * **Web**: Instant browser play with 1-click room URL sharing.
  * **Android (APK)**: Native `.apk` / `.aab` via **Capacitor Android**.
  * **Windows PC (EXE)**: Ultra-lightweight ~10MB native binary via **Tauri v2**.
  * **iOS**: Native Xcode project via **Capacitor iOS**.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Jabir-A-H/shadow-realm.git
cd shadow-realm

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 📜 License

All Rights Reserved © 2026 Jabir Abdullah Haian. See [LICENSE](LICENSE) for details.
