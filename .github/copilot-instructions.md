# Copilot Instructions for Past Forward

## Stack & Architecture
- **Stack**: Vite + React 19 + TypeScript. All logic runs client-side; no server layer. `index.html` injects Tailwind via CDN and declares import maps for browser ESM resolution.
- **Build & Run**: `npm install` then `npm run dev` (serves on `0.0.0.0:3000`). `npm run build` creates the production bundle. No automated tests are defined.
- **Env Config**: Place `OPENROUTER_API_KEY=<key>` in `.env.local`. `vite.config.ts` maps this to `process.env.OPENROUTER_API_KEY`. Get your API key at https://openrouter.ai/keys.

## Component Architecture (Refactored)
- **App.tsx** (196 lines): Main orchestrator wrapped in `ToastProvider`. Manages state machine (`idle → image-uploaded → generating → results-shown`) and coordinates child components.
- **ImageUploader** (`components/ImageUploader.tsx`): Handles initial upload UI with ghost polaroid animations. Accepts `onImageSelect` callback.
- **ImagePreview** (`components/ImagePreview.tsx`): Shows uploaded image preview with Generate/Reset buttons. Receives `imageUrl`, `onGenerate`, `onReset` props.
- **GenerationGrid** (`components/GenerationGrid.tsx`): Manages both mobile (vertical stack) and desktop (scattered) layouts. Receives `decades`, `generatedImages`, `isMobile`, `onShake`, `onDownload` props.
- **Toast** (`components/Toast.tsx`): Context-based notification system. Use `useToast()` hook to call `showToast(message, type, duration)` for user feedback.

## Custom Hooks
- **useImageGeneration** (`hooks/useImageGeneration.ts`): Manages all generation logic with concurrency control (default: 2 workers). Returns `{ generatedImages, isLoading, generateAll, regenerateDecade, reset }`. Handles Blob URL cleanup automatically.
- **useMediaQuery** (`hooks/useMediaQuery.ts`): Responsive design hook. Example: `const isMobile = useMediaQuery('(max-width: 768px)')`.

## Key Flows

### Upload & Validation
- **Input Validation** (`lib/imageValidation.ts`): All uploads go through `validateImage()` which checks file type (PNG/JPEG/WebP), size (max 5MB), and dimensions (max 4096x4096px). Returns `{ valid, error, dataUrl }`.
- Uploads are read with `FileReader` and stored as data URLs in `App.tsx` state.

### Generation Pipeline
- **Concurrency**: `useImageGeneration` processes decades with a cap of 2 workers to stay within rate limits.
- **Memory Optimization**: Generated images use **Blob URLs** (not base64 data URLs) for ~70% memory reduction. Cleanup happens automatically via `URL.revokeObjectURL()`.
- **Status Tracking**: Each decade has `pending/done/error` status reflected in UI.
- **User Feedback**: Toast notifications show success/error for each generation.

### Regeneration
- Desktop: Shake a polaroid (drag velocity/direction in `PolaroidCard`) to re-run a single decade.
- Mobile: Tap the circular icon.
- Guard: Check `status !== 'pending'` before triggering to prevent duplicate requests.

### Album Export
- **Canvas Performance** (`lib/albumUtils.ts`):
  - Loads images **sequentially** (not concurrently) to reduce memory pressure.
  - Mobile-optimized: 50% smaller canvas (1240x1754 vs 2480x3508).
  - Handles both Blob URLs and data URLs via `blobUrlToDataUrl()` helper.
- **Validation**: `handleDownloadAlbum` enforces all decades must be `done` before composing.

## Services & Utilities

### OpenRouter Service (geminiService.ts)
- **Location**: `services/geminiService.ts`
- **API**: Uses OpenRouter API (https://openrouter.ai/api/v1/chat/completions) with model `google/gemini-2.5-flash-image`.
- **Behavior**: Sends image + text prompt via REST API. Retries internal errors with exponential backoff, falls back to secondary prompt if model returns text instead of image.
- **Memory**: Returns **Blob URLs** (not base64) via `processOpenRouterResponse()`.
- **Helpers**: Reuse `extractDecade` and `getFallbackPrompt` when extending prompts.
- **Authentication**: Uses Bearer token in Authorization header with `OPENROUTER_API_KEY`.

### Album Utils
- **Location**: `lib/albumUtils.ts`
- **Key Functions**:
  - `createAlbumPage(imageData, isMobile)`: Creates A4-ish collage via Canvas.
  - `blobUrlToDataUrl(blobUrl)`: Converts Blob URLs for canvas rendering.
  - `loadImage(url)`: Handles both Blob URLs and data URLs.

### Image Validation
- **Location**: `lib/imageValidation.ts`
- **Usage**: `await validateImage(file, { maxSizeMB: 5, maxWidth: 4096, maxHeight: 4096 })`
- **Returns**: `{ valid: boolean, error?: string, dataUrl?: string }`

## UI Components

### Draggable UI
- **Location**: `components/ui/draggable-card.tsx`
- **Purpose**: Centralizes framer-motion drag, hover tilt, and spring physics.
- **Usage**: Pass shared `dragConstraintsRef` (see `GenerationGrid` desktop layout).

### Polaroid Card
- **Location**: `components/PolaroidCard.tsx`
- **Features**: Animates image "development" after load, exposes download/regenerate affordances.
- **Status-Driven**: Maintains branches for `pending/done/error` states.
- **Styling**: Uses `cn` from `lib/utils.ts` for class merging.

## Styling & Imports
- **Tailwind**: Utility classes authored inline. Font families (`font-caveat`, `font-permanent-marker`) defined in `index.html`. No Tailwind config file.
- **Global CSS**: Add via `index.css` or inline styles.
- **Imports**: Absolute imports use `@/` alias (root) configured in `tsconfig.json` and `vite.config.ts`.
- **TypeScript**: Prefer types over `any`. Self-check for null guards when touching DOM APIs.

## Memory Management (IMPORTANT)
- **Blob URLs**: All generated images use Blob URLs for memory efficiency.
- **Cleanup**: Always call `URL.revokeObjectURL()` when:
  - Resetting the app
  - Replacing an uploaded image
  - Component unmounts (handled in `useImageGeneration`)
- **Pattern**: Check if URL starts with `blob:` before revoking.

## User Feedback (Toast System)
- **Usage**: `const { showToast } = useToast();`
- **Types**: `success`, `error`, `warning`, `info`
- **Example**: `showToast('Image generated!', 'success', 3000)`
- **Auto-dismiss**: Default 5s, configurable per call.

## Debug Tips
- **Gemini Errors**: Watch browser console for detailed error messages from `generateDecadeImage`.
- **Canvas Export**: Verify all `imageData` keys map to loaded images before calling `createAlbumPage`.
- **Memory**: Use Chrome DevTools → Memory tab to verify Blob URL cleanup.
- **Toast Issues**: Check that component is wrapped in `<ToastProvider>`.

## Extending the App

### Adding New Decades
1. Update `DECADES` constant in `App.tsx`
2. Update `POSITIONS` array in `GenerationGrid.tsx` for desktop scattering
3. Update canvas layout in `lib/albumUtils.ts` if needed

### Adding New Features
- **New UI State**: Add to `appState` type in `App.tsx`
- **New Component**: Follow pattern of `ImageUploader`, `ImagePreview`, `GenerationGrid`
- **New Hook**: Follow pattern of `useImageGeneration`, `useMediaQuery`
- **User Feedback**: Use toast notifications for all user actions

### Performance Considerations
- **Large Images**: Validation prevents >5MB uploads, but consider adding compression
- **Mobile**: Canvas export already optimized (50% resolution), but test on low-end devices
- **Memory**: Always use Blob URLs for generated content, never base64 strings

## Common Patterns

### Component Props Pattern
```typescript
interface Props {
    onAction: (param: string) => void;  // Callbacks for parent communication
    data: SomeType;                      // Data from parent
    isMobile?: boolean;                  // Responsive behavior
}
```

### Hook Pattern
```typescript
export function useCustomHook(options: Options) {
    // Internal state
    // Side effects
    // Cleanup
    return { data, actions };
}
```

### Toast Notification Pattern
```typescript
try {
    // Action
    showToast('Success message', 'success');
} catch (error) {
    showToast('Error message', 'error');
}
```

## When Unsure
- **Feature Ownership**: Start from `App.tsx`; all user actions flow through callbacks.
- **Component Structure**: Check existing components (`ImageUploader`, `ImagePreview`, `GenerationGrid`) for patterns.
- **Memory Issues**: Verify Blob URL cleanup and sequential loading.
- **User Feedback**: Add toast notifications for all user-facing actions.
- **Documentation**: See `IMPROVEMENTS.md` for detailed architecture decisions.
