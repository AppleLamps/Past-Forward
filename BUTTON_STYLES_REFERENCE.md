# Button Styles Reference - Past Forward

Quick reference guide for all button styles in the application.

---

## 🎨 Button Style Classes

### Primary Button
**Usage**: Main actions (Download Album, Batch Mode active)

```css
font-permanent-marker 
text-xl 
text-center 
text-black 
bg-yellow-400 
py-3 px-8 
rounded-sm 
transform 
transition-transform 
duration-200 
hover:scale-105 
hover:-rotate-2 
hover:bg-yellow-300 
shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]
```

**Visual**:
- Background: Yellow (#FBBF24)
- Text: Black
- Padding: 12px 32px
- Font Size: 20px
- Hover: Scale 1.05x, rotate -2°, lighter yellow
- Shadow: 2px offset, black 20% opacity

---

### Secondary Button
**Usage**: Secondary actions (Download ZIP, Start Over)

```css
font-permanent-marker 
text-xl 
text-center 
text-white 
bg-white/10 
backdrop-blur-sm 
border-2 
border-white/80 
py-3 px-8 
rounded-sm 
transform 
transition-transform 
duration-200 
hover:scale-105 
hover:rotate-2 
hover:bg-white 
hover:text-black
```

**Visual**:
- Background: White 10% opacity + blur
- Text: White (→ Black on hover)
- Border: White 80% opacity, 2px
- Padding: 12px 32px
- Font Size: 20px
- Hover: Scale 1.05x, rotate +2°, solid white background

---

### Navigation Button
**Usage**: Navigation actions (Gallery button)

```css
font-permanent-marker 
text-lg 
text-center 
text-white 
bg-white/10 
backdrop-blur-sm 
border-2 
border-white/60 
py-2 px-6 
rounded-sm 
transform 
transition-all 
duration-200 
hover:scale-105 
hover:rotate-1 
hover:bg-white 
hover:text-black 
shadow-[2px_2px_0px_1px_rgba(255,255,255,0.1)]
```

**Visual**:
- Background: White 10% opacity + blur
- Text: White (→ Black on hover)
- Border: White 60% opacity, 2px
- Padding: 8px 24px
- Font Size: 18px
- Hover: Scale 1.05x, rotate +1°, solid white background
- Shadow: 2px offset, white 10% opacity

---

### Toggle Button (Base)
**Usage**: Toggle buttons (Batch/Single mode)

```css
font-permanent-marker 
text-lg 
text-center 
py-2 px-6 
rounded-sm 
transform 
transition-all 
duration-200 
hover:scale-105 
shadow-[2px_2px_0px_1px_rgba(0,0,0,0.2)]
```

**Combined with conditional classes**:

**Active State** (Batch Mode):
```css
bg-yellow-400 
text-black 
hover:bg-yellow-300 
hover:-rotate-1
```

**Inactive State** (Single Mode):
```css
bg-white/10 
backdrop-blur-sm 
border-2 
border-white/60 
text-white 
hover:bg-white 
hover:text-black 
hover:rotate-1
```

**Visual**:
- **Active**: Yellow background, black text, rotate -1° on hover
- **Inactive**: White 10% opacity + blur, white text, rotate +1° on hover
- Padding: 8px 24px
- Font Size: 18px
- Hover: Scale 1.05x

---

## 📏 Size Comparison

| Button Type | Font Size | Padding | Use Case |
|-------------|-----------|---------|----------|
| Primary | text-xl (20px) | py-3 px-8 (12px 32px) | Main actions |
| Secondary | text-xl (20px) | py-3 px-8 (12px 32px) | Secondary actions |
| Navigation | text-lg (18px) | py-2 px-6 (8px 24px) | Navigation |
| Toggle | text-lg (18px) | py-2 px-6 (8px 24px) | Toggle states |

---

## 🎭 Animation Comparison

| Button Type | Scale | Rotation | Background Change |
|-------------|-------|----------|-------------------|
| Primary | 1.05x | -2° | yellow-400 → yellow-300 |
| Secondary | 1.05x | +2° | white/10 → white |
| Navigation | 1.05x | +1° | white/10 → white |
| Toggle (Active) | 1.05x | -1° | yellow-400 → yellow-300 |
| Toggle (Inactive) | 1.05x | +1° | white/10 → white |

---

## 🎨 Color Palette

### Yellow (Primary)
- Default: `bg-yellow-400` (#FBBF24)
- Hover: `bg-yellow-300` (#FCD34D)
- Text: `text-black`

### White/Transparent (Secondary/Navigation/Toggle)
- Default: `bg-white/10` (White 10% opacity)
- Hover: `bg-white` (Solid white)
- Text: `text-white` → `text-black` on hover
- Border: `border-white/60` or `border-white/80`

### Green (Save)
- Default: `bg-green-600/50` (Green 50% opacity)
- Hover: `bg-green-600` (Solid green)
- Border: `border-green-500`
- Text: `text-white`

---

## 🔧 Implementation Examples

### Gallery Button
```tsx
<button
    onClick={() => setShowGallery(true)}
    className={navButtonClasses}
>
    📷 Gallery
</button>
```

### Batch/Single Toggle
```tsx
<button
    onClick={() => setIsBatchMode(!isBatchMode)}
    className={`${toggleButtonClasses} ${isBatchMode
        ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:-rotate-1'
        : 'bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-black hover:rotate-1'
    }`}
>
    {isBatchMode ? '✓ Batch Mode' : 'Single Mode'}
</button>
```

### Download Album (Primary)
```tsx
<button
    onClick={handleDownloadAlbum}
    disabled={isDownloading}
    className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
>
    {isDownloading ? 'Creating...' : 'Download Album'}
</button>
```

### Download ZIP (Secondary)
```tsx
<button
    onClick={handleDownloadZip}
    disabled={isDownloading}
    className={`${secondaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
>
    {isDownloading ? 'Creating...' : 'Download ZIP'}
</button>
```

---

## 🎯 Design Principles

### Consistency
- All buttons use `font-permanent-marker` for playful aesthetic
- All buttons have `transform` and `transition` for smooth animations
- All buttons scale to 1.05x on hover
- All buttons have subtle rotation on hover

### Visual Hierarchy
- **Primary** (Yellow): Most important actions
- **Secondary** (White/Transparent): Alternative actions
- **Tertiary** (Green): Special actions (Save)

### Accessibility
- All buttons have clear hover states
- All buttons have sufficient contrast
- All buttons have touch-friendly sizes (min 44px height)
- Disabled states have reduced opacity

### Playfulness
- Subtle rotation animations (-2°, -1°, +1°, +2°)
- Hand-drawn font (Permanent Marker)
- Box shadows for depth
- Color inversions on hover

---

## 📱 Responsive Behavior

All buttons maintain their styling across breakpoints:
- Desktop: Full size
- Tablet: Full size
- Mobile: Full size (touch-friendly)

No size adjustments needed as base sizes are already touch-friendly.

---

## ✅ Checklist for New Buttons

When adding new buttons, ensure:
- [ ] Uses appropriate button class (primary/secondary/nav/toggle)
- [ ] Has `font-permanent-marker` font
- [ ] Has scale animation (1.05x)
- [ ] Has rotation animation (±1° or ±2°)
- [ ] Has smooth transition (200ms)
- [ ] Has appropriate shadow
- [ ] Has clear hover state
- [ ] Matches visual hierarchy
- [ ] Is touch-friendly (min 44px height)

---

**Reference Date**: October 22, 2025
**Status**: ✅ CURRENT

