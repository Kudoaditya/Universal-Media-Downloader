---
name: Obsidian Utility Engine
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#c6c5cf'
  on-secondary: '#2f3038'
  secondary-container: '#4a4b53'
  on-secondary-container: '#bcbbc5'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.015em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-compact: 0.5rem
  margin: 1rem
  margin-window: 0.5rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
  space-2xl: 1.5rem
---

## Brand & Style

This design system targets power users, creative professionals, and technical specialists who value precision, spatial economy, and distraction-free operation. The interface is engineered as an unobtrusive, high-density desktop canvas that disappears behind user content while providing immediate, deterministic feedback.

The aesthetic leans on **Desktop Modernism with tactile micro-depth**:
- Clean, disciplined layouts directly derived from native desktop utilities.
- Deep, low-reflectance zinc neutral tones that protect visual focus during extended sessions.
- Purposeful structural boundaries using hairline borders, hairline inset highlights, and surface-step tonal elevation rather than theatrical dropshadows.
- Zero neon glows, retro-terminal gimmicks, or low-density mobile patterns. Every pixel communicates status, container demarcation, or interactive affordance.

## Colors

The palette is anchored in pure, low-luminance neutral zincs, prioritizing contrast compliance, optical comfort, and clean functional signaling.

### Canvas & Surface Hierarchy
- **Canvas Base (`#09090b`)**: The primary frame, desktop window background, and underlying window frame.
- **Surface Layer 1 (`#18181b`)**: Default container background for panels, sidebars, master views, and segmented work areas.
- **Surface Layer 2 (`#27272a`)**: Elevated controls, cards, input frames, and inactive pill tabs.
- **Surface Layer 3 (`#3f3f46`)**: Hover states, active drag zones, modal sheets, and active control surfaces.

### Line & Structural Boundaries
- **Hairline Border (`#27272a`)**: Default partition line for cards, docked toolbars, table cells, and panel borders.
- **Subtle Highlight Border (`#3f3f46`)**: Keylines for interactive elements, focused inputs, and active tool indicators.

### Typography & Content Tones
- **Primary Text (`#f4f4f5`)**: Window titles, values, critical labels, and high-emphasis data.
- **Secondary Text (`#a1a1aa`)**: Secondary labels, metadata, shortcuts, and helper descriptions.
- **Tertiary / Disabled (`#71717a`)**: Disabled states, placeholders, inactive shortcut keys, and structural icons.

### System Accents & Signals
- **System Accent (`#3b82f6`)**: Precise system blue used for primary actions, focus rings, selected table rows, active toggle indicators, and progress tracking.
- **Success (`#10b981`)**: Deterministic completion and non-blocking status badges.
- **Warning (`#f59e0b`)**: Hardware warning states and pending actions.
- **Destructive / Error (`#ef4444`)**: Deletions, pipeline interruptions, and critical failures.

## Typography

The typographic hierarchy prioritizes density, optical balance, and absolute clarity at small scales typical of desktop toolbars, sidebars, and parameter inspectors.

- **Primary Font Family**: `Inter`, configured with tabular figures (`tnum`) enabled for uniform data layout and numeric column alignment.
- **Monospace Font Family**: `JetBrains Mono`, used selectively for file paths, technical metrics, hexadecimal values, and keybinding shortcuts (`⌘K`, `⌥⇧P`).
- **Scale Rules**:
  - Title bars and section headers remain restrained (`13px` to `15px`).
  - Standard body and interaction controls default to `13px` with an `18px` line height for compact density.
  - Informational badges, secondary labels, and status bar text scale down to `11px` / `12px` with increased tracking (`+0.01em` to `+0.015em`) for legibility.

## Layout & Spacing

Layout geometry follows an explicit dock-and-panel arrangement typical of desktop creative applications rather than responsive web card flows.

### Structural Framework
- **Master Application Window**: Structured with a fixed title bar/toolbar (`38px` height), an optional left utility sidebar (`200px` to `260px`), a primary central viewport/canvas, and an optional collapsible parameter inspector (`240px` to `320px`).
- **Grid & Alignment**: Strict multi-panel docking with explicit `1px` structural dividers. Internal forms and setting groups use an 8-column or 12-column sub-grid with `0.75rem` (`12px`) gutters.
- **Density**: Tight, ergonomic padding scales. Controls use `space-sm` (`6px`) vertical and `space-md` (`8px`) to `space-lg` (`12px`) horizontal padding to preserve vertical canvas real estate.
- **Reflow**: Viewport scaling prioritizes user workspace expansion. Sidebars and inspectors maintain static widths or user-resizable bounds, collapsing to icon-only rails below `800px` total window width.

## Elevation & Depth

Visual hierarchy uses physical material cues: hairline edge lighting, tonal stacking, and low-diffuse ambient occlusion. High-contrast dropshadows and heavy color blurs are eliminated.

### Depth Layers
1. **Window Base (Level 0)**: Background `#09090b`. Solid, non-reflective base plane.
2. **Structural Panels (Level 1)**: Fill `#18181b`, delimited by a single `1px` solid border (`#27272a`).
3. **Controls & Embedded Modules (Level 2)**: Fill `#27272a`, bounded by a `1px` subtle highlight border (`#3f3f46`), reinforced with an interior top hairline highlight (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`).
4. **Floating Overlays & Popovers (Level 3)**: Fill `#18181b`, border `1px solid #3f3f46`, elevated with an ambient shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.35)`.
5. **Modal Windows & Command Palette (Level 4)**: Fill `#18181b` with subtle surface backdrop filter (`blur(16px)` on semi-translucent headers), bound by `1px solid #3f3f46`, and focused with a deep ambient shadow: `0 24px 48px -12px rgba(0, 0, 0, 0.75)`.

## Shapes

The design system employs a soft, highly controlled corner radius (`roundedness: 1`), providing an industrial feel that aligns with macOS desktop aesthetics.

- **Window Chrome**: Outer window frames use `8px` (`0.5rem`) to align with native window managers.
- **Standard Controls (Buttons, Inputs, Selectors)**: `4px` (`0.25rem`) corner radius for clean alignment in segmented toolbars.
- **Cards, Panels, and Grouped Boxes**: `6px` (`0.375rem`) to `8px` (`0.5rem`).
- **Badges, Status Tags, and Segment Indicators**: Full pill shape (`9999px`) to visually differentiate status tokens from actionable box-model controls.

## Components

### Window Chrome & Title Bar
- **Dimensions**: `38px` fixed height, integrated seamlessly into the window base (`#09090b`).
- **Window Controls**: Standard macOS traffic light alignment (`12px` circle diameters, `8px` center-to-center offset) parked at `12px` left inset.
- **Document Status & Window Title**: Centered `label-md` (`#a1a1aa`), switching to `#f4f4f5` on active focus. Includes optional micro breadcrumb or project selector.

### Buttons & Segmented Controls
- **Default Action**: Height `28px`, background `#27272a`, border `1px solid #3f3f46`, text `#f4f4f5` (`label-md`), internal inset highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.04)`). Hover shifts background to `#3f3f46`. Active click applies `transform: scale(0.985)`.
- **Primary Action**: Height `28px`, solid accent `#3b82f6`, text `#ffffff`, border `1px solid rgba(255, 255, 255, 0.15)`. Hover darkens to `#2563eb`.
- **Segmented Toolbars**: Unified container `#18181b` with `1px solid #27272a` housing multiple grouped items. Active segment receives `#27272a` fill, `#3f3f46` border, and crisp `#f4f4f5` text.

### Pill Badges & Status Indicators
- **Architecture**: Pill-shaped (`rounded-full`), height `20px`, horizontal padding `8px`.
- **Neutral Badge**: Background `#27272a`, text `#a1a1aa`, border `1px solid #3f3f46`.
- **Active / Accent Badge**: Background `rgba(59, 130, 246, 0.15)`, text `#60a5fa`, border `1px solid rgba(59, 130, 246, 0.3)`.
- **Status Dot**: `6px` solid indicator placed left of badge text with no outer ping animations.

### Refined Progress Bars
- **Track**: Height `4px` (utility inline) or `6px` (modal transfer), background `#27272a`, border-radius `9999px`, overflow hidden.
- **Fill**: Solid accent `#3b82f6` or success `#10b981`. Smooth hardware-accelerated width transition (`transition: width 150ms ease-out`). No gradients, zebra stripes, or decorative shimmers.

### Form Inputs & Checkboxes
- **Input Fields**: Height `28px`, background `#18181b`, border `1px solid #27272a`, corner radius `4px`, text `#f4f4f5` (`body-md`), placeholder `#71717a`. Active focus states swap border to `#3b82f6` with a non-blurring ring: `0 0 0 1px #3b82f6`.
- **Checkboxes & Radios**: `14px × 14px`, background `#18181b`, border `1px solid #3f3f46`, radius `3px` (checkbox) or `9999px` (radio). Checked state: fill `#3b82f6`, checkmark icon in `#ffffff`.

### Inspector Lists & Key-Value Panels
- **Structure**: Alternating rows or clean divider lines (`1px solid #27272a`).
- **Labels**: Left-aligned, `label-sm` in `#a1a1aa`.
- **Values**: Right-aligned, `mono-sm` or `body-md` in `#f4f4f5`.
- **Hover Micro-interaction**: Subtle surface highlight (`rgba(255, 255, 255, 0.02)`) on row hover with instant-reveal inline copy/edit actions.