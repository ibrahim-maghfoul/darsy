# Master Technical Storyboard: Project Fi Launch Rebuild

**Asset Name:** Project_Fi_Concept_Recreation
**Duration:** 00:59 | **Style:** 2D Flat Motion | **FPS:** 60 | **Canvas:** 1920x1080 | **Pixel Aspect Ratio:** Square Pixels

---

## I. Global Styles & Constants

### 1. Color Palette (HEX)
* **BG_White:** `#FFFFFF`
* **BG_Green_Solid:** `#34A853` (Used in Scenes 4 & 5 / Section 2)
* **BG_Blue_Solid:** `#4285F4` (Used in Scene 8 / Section 5)
* **Google_Blue:** `#4285F4`
* **Google_Green:** `#34A853`
* **Google_Yellow:** `#FBBC05`
* **Text_Dark_Grey:** `#5F6368`
* **Path_Light_Grey:** `#E8EAED`

### 2. Typography Specs
* **Font:** Product Sans (Alt: Roboto Medium)
* **Size:** 64px (Headers), 38px (Body)
* **Alignment:** Center-aligned globally unless specified.
* **Tracking:** -1% (Tight)

---

## II. Motion "Feel" Parameters
* **Interpolation:** Always use **Spatial Interpolation -> Linear** and **Temporal Interpolation -> Bezier**.
* **Motion Blur:** Set Shutter Angle to **180°** to ensure the fast-moving dots have a realistic streak.

---

## III. Scene-by-Scene Breakdown

### SECTION 1: THE VISION (00:00 - 00:12)

**SCENE 01: The Text Reveal (00:00 - 00:03:50)**
* **Visual:** White BG. Text "We set out to build a new way to connect." fades in center.
* **Text Position:** [960, 540] (Center)
* **Animation:**
  * Opacity: 0% at 00:00 -> 100% at 00:15 (frames).
  * Y-Position: [960, 560] -> [960, 540].
* **Easing:** Cubic-Bezier (0.4, 0, 0.2, 1).

**SCENE 02: The DNA Helix Begins (00:04)**
* **Visual:** Text moves left. **Green Dot** (#34A853) and **Yellow Dot** (#FBBC05) enter from right.

**SCENE 03: The DNA Helix (00:04 - 00:12:00)**
* **Visual:** Dots begin "The Helix." They intertwine 3 times. A grey line (3px) trails them.
* **Elements:**
  * **Circle_Green:** 42px Diameter. Start [1920, 540], move to [400, 540].
  * **Circle_Yellow:** 42px Diameter. Start [1920, 540], move to [400, 540].
* **Path Logic:**
  * **Circle_Green:** Y-axis Sine Wave. Amplitude: 120px. Frequency: 0.5Hz.
  * **Circle_Yellow:** Y-axis Sine Wave. Amplitude: -120px (Inverse).
* **Trailing Stroke:**
  * Layer: Below circles.
  * Weight: 3px. Color: `#BDC1C6`.
  * Effect: Trim Path (End). 0% at 00:04 -> 100% at 00:08. The line must track exactly with the Circle's X/Y center.

**SCENE 04 (00:09)**
* **Visual:** Dots settle. New text: "with leading carriers."

### SECTION 2: INFRASTRUCTURE (00:13 - 00:21)

**SCENE 05: The Logic Grid Setup (00:12:50 - 00:13)**
* **Visual:** Transition to **Grid**. 10x15 grid of light grey dots.
* **Grid Setup:** 20 columns x 10 rows. (Wait: Master says 20x10, Storyboard says 10x15. I've left the details from the master here.)
* **Dot Specs:** 8px diameter. Color `#E8EAED`. Spacing: 90px apart.

**SCENE 06: The "Snake" Path (00:14 - 00:15:30)**
* **Visual:** A Green line "snakes" through the grid at 90° angles. Text: "hardware makers."
* **Stroke:** 4px Green.
* **Path:** Moves from [0, 200] -> [400, 200] -> [400, 600] -> [800, 600].
* **Interaction:** When Stroke.X >= Dot.X, trigger **Scale_Pulse**.
* **Scale_Pulse:** Dot scales 100% -> 180% -> 100% over 12 frames. Color changes to `#4285F4`.

**SCENE 07: The Full-Screen Morph (00:16 - 00:21:00)**
* **Visual:** **The Zoom Out.** The background turns solid Green.
* **Transition:** Green circle expands from center at 3000px/sec to cover frame.

**SCENE 08: Concentric Arcs (00:18)**
* **Visual:** Concentric arcs (White & Yellow) rotate around center text: "network that connects across networks."
* **Concentric Arcs:**
  * **Arc 1 (White):** Radius 150px. Stroke 6px. Start angle 0°, End angle 220°. Rotation: 120°/sec.
  * **Arc 2 (Yellow):** Radius 300px. Stroke 6px. Start angle 90°, End angle 180°. Rotation: -90°/sec.
* **Text Placement:** Position [960, 540], Color White.

### SECTION 3: DEVICES & SYNC (00:22 - 00:29)

**SCENE 09: Device Iconography (00:22 - 00:26:00)**
* **Visual:** Background fades to `#FFFFFF`. Outline icons of a laptop, phone, and tablet appear.
* **Icons:**
  * **Laptop:** W: 240px, H: 140px. Stroke 2px Grey.
  * **Phone:** W: 60px, H: 110px. 15-degree tilt.

**SCENE 10: The Connection Line (00:24)**
* **Visual:** A blue dashed line (4px) "pulses" through the center of all three devices.
* **Dashed Stroke:** 3px Width. Dash gap: 12px. Dash size: 8px.
* **Animation:** Offset property moves at 250px/sec to simulate "flow" through the devices.

**SCENE 11 (00:27)**
* **Visual:** **The World Burst.** A cluster of 20+ colored circles "pops" from the center.

### SECTION 4: REAL-WORLD UTILITY (00:30 - 00:41)

**SCENE 12 (00:30)**
* **Visual:** **The SMS Pop.** A green speech bubble expands. Text: "Happy B-day!!!"

**SCENE 13 (00:33)**
* **Visual:** **Typing Indicator.** Three blue dots bounce in 1-2-3 sequence inside the bubble.

**SCENE 14 (00:35)**
* **Visual:** **The Train.** A vertical dashed grey line moves right-to-left. A blue "block" slides along it.

**SCENE 15 (00:39)**
* **Visual:** **The Audio Wave.** 10 vertical bars (Green/Yellow) bounce. High amplitude in center.

### SECTION 5: COST & RELIABILITY (00:42 - 00:54)

**SCENE 16 (00:42)**
* **Visual:** **The Billing Loop.** Dark Green BG. A white dot orbits a white circle. Text: "prices that make sense."

**SCENE 17 (00:46)**
* **Visual:** **The Logic Board.** Dark Blue BG. A 4x4 white dot grid appears. Lines "light up" between dots sequentially.

### SECTION 6: THE BRAND (00:55 - 00:59)

**SCENE 18 (00:55)**
* **Visual:** **The Convergence.** Every element from the video flies to [960, 540].

**SCENE 19: Final Logo Assembly (00:57 - 00:59:59)**
* **Visual:** Elements morph into the lowercase **"fi"** logo.
* **"f" Component:** Rounded Rectangle. Size [30x120]. Position [930, 540]. Color Green.
* **"i" Component:** Rectangle [30x80]. Circle [30x30] above it. Position [990, 540]. Color Blue.
* **Assembly Motion:**
  * **Initial:** Pieces are scattered 400px away from center. Scale 0%.
  * **Action:** Fly to center while scaling to 100%.
  * **Ease:** Elastic (Amplitude 0.5, Period 0.3). The pieces should "jiggle" when they touch.

**SCENE 20 (00:59)**
* **Visual:** "Project Fi" and "Google" wordmarks appear. Final hold for 1 second.
