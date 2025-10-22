<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Past Forward - AI-Powered Decade Photo Transformation

Transform your photos into authentic decade-styled portraits from the 1950s through 2000s using AI image generation.

View your app in AI Studio: <https://ai.studio/apps/drive/166Rz4lxxH3UwZolENYgwS8-v9m5OaMn3>

## Features

- 📸 **Decade Transformations**: Generate 6 authentic decade-styled portraits (1950s-2000s)
- 🎨 **Era-Specific Styling**: Tailored prompts for each decade with period-accurate fashion, photography, and aesthetics
- ⚡ **Fast Generation**: Parallel processing of all 6 decades simultaneously
- 🖼️ **Album Export**: Download all transformations as a beautiful collage
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices
- 🔄 **Regeneration**: Shake (desktop) or tap (mobile) any polaroid to regenerate
- 💾 **Memory Efficient**: Uses Blob URLs for ~70% memory reduction
- ✅ **Input Validation**: Automatic validation of file size, type, and dimensions

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (CDN)
- **Animation**: Framer Motion
- **AI Service**: OpenRouter API with Google Gemini 2.5 Flash Image model
- **Architecture**: Client-side only, no backend required

## Run Locally

**Prerequisites:** Node.js (v16 or higher)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up OpenRouter API key:**
   - Get your API key from [OpenRouter](https://openrouter.ai/keys)
   - Create a `.env.local` file in the root directory
   - Add your key:

     ```
     OPENROUTER_API_KEY=your_api_key_here
     ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

4. **Build for production:**

   ```bash
   npm run build
   ```

## API Configuration

This app uses **OpenRouter** as the API gateway to access Google's Gemini 2.5 Flash Image model:

- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `google/gemini-2.5-flash-image`
- **Authentication**: Bearer token via `OPENROUTER_API_KEY`
- **Rate Limits**: No concurrent request limits for paid models
- **Concurrency**: Processes all 6 decades in parallel (6 workers)

### Why OpenRouter?

- ✅ Unified API for multiple AI models
- ✅ Better rate limiting and reliability
- ✅ No SDK required (uses native fetch)
- ✅ Automatic fallback mechanisms
- ✅ Cost optimization and usage tracking

See [OPENROUTER_MIGRATION.md](./OPENROUTER_MIGRATION.md) for migration details.

## Project Structure

```
├── components/          # React components
│   ├── ImageUploader.tsx
│   ├── ImagePreview.tsx
│   ├── GenerationGrid.tsx
│   ├── PolaroidCard.tsx
│   ├── Toast.tsx
│   └── Footer.tsx
├── hooks/              # Custom React hooks
│   ├── useImageGeneration.ts  # Generation logic with decade-specific prompts
│   └── useMediaQuery.ts       # Responsive design hook
├── services/           # API services
│   └── geminiService.ts       # OpenRouter API integration
├── lib/                # Utilities
│   ├── albumUtils.ts          # Canvas-based album export
│   ├── imageValidation.ts     # Upload validation
│   └── utils.ts               # General utilities
├── App.tsx             # Main application component
└── .env.local          # Environment variables (create this)
```

## Key Features Explained

### Decade-Specific Prompts

Each decade has a tailored prompt that includes:

- **Photography Style**: Film quality, color grading, camera technology
- **Fashion Details**: Era-specific clothing, hairstyles, accessories
- **Technical Specs**: Lighting, grain, focus, composition
- **Identity Preservation**: Explicit instructions to maintain facial features

Example (1950s):
> "Transform this person into a 1950s portrait photograph. Style: Post-war American aesthetic with high-contrast black and white or early Kodachrome color. Fashion: Men in fedoras, suits with wide lapels, slicked hair; Women in circle skirts, victory rolls, cat-eye glasses. Photography: Grainy film texture, studio lighting, formal pose. Maintain the person's facial features and identity exactly."

### Memory Optimization

- All generated images use **Blob URLs** instead of base64 data URLs
- Automatic cleanup via `URL.revokeObjectURL()` when resetting or unmounting
- ~70% memory reduction compared to base64 strings
- Sequential image loading for canvas operations

### Input Validation

Automatic validation of uploaded images:

- **File Types**: PNG, JPEG, WebP
- **Max Size**: 5MB
- **Max Dimensions**: 4096x4096 pixels

### Parallel Generation

- **Concurrency Limit**: 6 workers (all decades processed simultaneously)
- **Worker Pool Pattern**: Efficient queue-based processing
- **Status Tracking**: Real-time status updates (pending/done/error)
- **Toast Notifications**: User feedback for all operations

## Documentation

- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)**: Detailed architecture decisions and improvements
- **[OPENROUTER_MIGRATION.md](./OPENROUTER_MIGRATION.md)**: OpenRouter API migration guide
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)**: Developer guide for extending the app

## Troubleshooting

### "OPENROUTER_API_KEY environment variable is not set"

- Ensure `.env.local` exists in the root directory
- Verify the key is correctly formatted: `OPENROUTER_API_KEY=sk-or-v1-...`
- Restart the dev server after adding the key

### Images not generating

- Check browser console for detailed error messages
- Verify your OpenRouter account has credits at <https://openrouter.ai/activity>
- Check API key validity at <https://openrouter.ai/keys>

### Memory issues

- The app automatically uses Blob URLs for memory efficiency
- Check Chrome DevTools → Memory tab to verify cleanup
- Ensure you're not keeping references to old images

## Contributing

This is an AI Studio app. For major changes, please test thoroughly and update documentation.

## License

Apache-2.0

---

**Powered by Gemini 2.5 Flash Image via OpenRouter**
