# Design System Specification: AI Proxy Dashboard

## 1. Overview & Creative North Star

### Creative North Star: "The Monolith"
This design system is built on the philosophy of **Technical Brutalism**. It rejects the colorful, rounded tropes of modern SaaS in favor of a high-contrast, editorial aesthetic that feels like a premium developer tool. 

The system breaks away from "template" looks through:
*   **Intentional Asymmetry:** Utilizing large, bold display typography offset against tight, technical grids.
*   **Tonal Depth:** Replacing harsh lines with a hierarchy of "near-blacks" to create a sense of infinite space.
*   **Monochromatic Authority:** A palette that relies almost exclusively on white, grays, and deep obsidian to convey stability and precision.

The goal is to provide a UI that feels less like a website and more like a high-end command deck—minimalist, authoritative, and fast.

---

## 2. Colors & Surface Logic

The palette is anchored in a "Deep Dark" philosophy. We use Material Design token naming but apply them with an editorial eye.

### The "No-Line" Rule
**1px solid borders are prohibited for sectioning.** To define separate areas of the dashboard, you must use background color shifts. A section should be distinguished by moving from `surface` (`#131313`) to `surface_container_low` (`#1c1b1b`). This creates a cleaner, more sophisticated interface that lets the content breathe.

### Surface Hierarchy & Nesting
Depth is achieved through a stacking model rather than shadows:
1.  **Base Layer:** `surface` (`#131313`) – The main canvas.
2.  **Sectioning:** `surface_container_low` (`#1c1b1b`) – For large layout blocks.
3.  **Interactive Elements:** `surface_container_high` (`#2a2a2a`) – For cards or hover states.
4.  **Floating/Alert Layers:** `surface_bright` (`#3a3939`) – For elements that require immediate attention.

### The "Glass & Gradient" Rule
For overlays or modal elements, use semi-transparent `surface_container` colors with a **20px backdrop-blur**. This "frosted obsidian" effect keeps the UI feeling integrated with the background. For primary CTAs, apply a subtle linear gradient from `primary` (`#ffffff`) to `primary_container` (`#d4d4d4`) at a 145-degree angle to provide a metallic, premium finish.

---

## 3. Typography

The system utilizes a dual-font strategy to balance human-centric readability with technical precision.

*   **Display & Headlines (Manrope):** A high-quality sans-serif used for massive scale differences. Use `display-lg` (3.5rem) for hero statements to create an editorial, "poster-like" feel.
*   **Body & Titles (Inter):** The workhorse font. `body-md` (0.875rem) is the standard for technical descriptions.
*   **Labels & Code (Space Grotesk / Monospace):** Used for technical metadata, API keys, and terminal outputs. The slight industrial feel of Space Grotesk in `label-sm` (0.6875rem) reinforces the "AI Proxy" identity.

**Hierarchy Note:** Always lead with high contrast. A `headline-lg` in `primary` white should be immediately followed by `body-sm` in `on_surface_variant` (#c6c6c6) to emphasize the technical nature of the data.

---

## 4. Elevation & Depth

### The Layering Principle
Traditional drop shadows are replaced by **Tonal Layering**. To "lift" an element:
*   Place a `surface_container_lowest` (#0e0e0e) card on top of a `surface_container` (#201f1f) background. This "sunken" or "raised" effect feels more organic to a dark interface.

### Ambient Shadows
If a floating element (like a dropdown) requires a shadow, use:
*   **Blur:** 32px
*   **Opacity:** 8%
*   **Color:** `#000000`
This creates a subtle "glow of darkness" that mimics natural light absorption.

### The "Ghost Border" Fallback
In rare cases where accessibility requires a border (e.g., input fields), use a **Ghost Border**:
*   **Token:** `outline_variant` (#474747)
*   **Opacity:** 20%
This ensures the border is felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Background `primary` (#ffffff), Text `on_primary` (#1a1c1c). Shape: `md` (0.375rem). Use uppercase `label-md` for text.
*   **Secondary:** Ghost Border style. No background, `outline_variant` at 20% opacity. Text `primary`.
*   **Tertiary:** No border or background. Underline on hover only.

### Technical Cards
*   **Rule:** Forbid divider lines. Use `spacing-8` (2rem) of vertical white space to separate content chunks.
*   **Header:** Use `label-sm` in `secondary` color for "Category" metadata at the top of cards.

### Input Fields
*   **Background:** `surface_container_lowest` (#0e0e0e).
*   **Focus State:** Transition border to `primary` (#ffffff) at 40% opacity. No "outer glow."
*   **Typography:** Use Monospace font for inputs containing API keys or proxy URLs.

### Additional: The "Status Terminal"
A custom component for AI Proxy logs. Use a `surface_container_lowest` background with a subtle inner glow. Text should be `label-sm` using the Monospace font, with success states using `primary` at 60% opacity rather than bright green, keeping the aesthetic muted and professional.

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme scale. Pair a very large title with very small, well-spaced metadata.
*   **Do** use `0.25rem` (DEFAULT) roundedness for most components to maintain a "sharp but refined" feel.
*   **Do** leverage `surface_container_highest` for hover states to create a "tactile" feedback loop.

### Don't
*   **Don't** use pure black (#000000) for backgrounds; it kills the "depth" of the screen. Use `surface` (#131313).
*   **Don't** use standard blue for links. Use `primary` (white) with a subtle `outline` (#919191) underline.
*   **Don't** use 100% opacity for secondary text. Always drop `on_surface_variant` to 70-80% to create visual hierarchy.
*   **Don't** use icons unless they are strictly necessary for utility. Let the typography do the heavy lifting.