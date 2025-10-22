# OpenRouter Migration Guide

## Overview
Past Forward has been migrated from using the Google Gemini API directly to using **OpenRouter**, which provides a unified API gateway for accessing multiple AI models including Gemini 2.5 Flash Image.

## Why OpenRouter?

### Benefits:
1. **Unified API**: Access to hundreds of AI models through a single endpoint
2. **Better Rate Limiting**: More flexible rate limits and automatic fallbacks
3. **Cost Optimization**: Automatic routing to the most cost-effective providers
4. **Improved Reliability**: Built-in fallback mechanisms and uptime optimization
5. **No SDK Required**: Simple REST API using standard fetch calls
6. **Better Security**: Easier to implement backend proxies in the future

## What Changed

### API Service (`services/geminiService.ts`)
- **Before**: Used `@google/genai` SDK
- **After**: Uses OpenRouter REST API with `fetch`
- **Model**: Still using `google/gemini-2.5-flash-image`
- **Response Format**: Adapted to handle OpenRouter's OpenAI-compatible response format

### Environment Variables
- **Before**: `GEMINI_API_KEY`
- **After**: `OPENROUTER_API_KEY`

### Dependencies
- **Removed**: `@google/genai` package (no longer needed)
- **Added**: None - uses native `fetch` API

## Setup Instructions

### 1. Get Your OpenRouter API Key
1. Visit https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key

### 2. Update Environment Variables
Edit `.env.local`:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Restart Development Server
```bash
npm run dev
```

## API Details

### Endpoint
```
POST https://openrouter.ai/api/v1/chat/completions
```

### Request Format
```typescript
{
  model: "google/gemini-2.5-flash-image",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Your prompt here"
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,..."
          }
        }
      ]
    }
  ],
  max_tokens: 1024
}
```

### Response Format
OpenRouter returns OpenAI-compatible responses:
```typescript
{
  id: "gen-...",
  model: "google/gemini-2.5-flash-image",
  choices: [
    {
      message: {
        role: "assistant",
        content: [
          {
            type: "image_url",
            image_url: {
              url: "data:image/jpeg;base64,..."
            }
          }
        ]
      }
    }
  ]
}
```

## Code Changes Summary

### `services/geminiService.ts`
1. Removed Google Gemini SDK import
2. Added OpenRouter API endpoint and model constants
3. Replaced `callGeminiWithRetry()` with `callOpenRouterWithRetry()`
4. Replaced `processGeminiResponse()` with `processOpenRouterResponse()`
5. Updated error handling for OpenRouter's response format
6. Maintained all existing features:
   - Retry logic with exponential backoff
   - Fallback prompt mechanism
   - Blob URL conversion for memory efficiency

### `vite.config.ts`
- Updated environment variable mapping from `GEMINI_API_KEY` to `OPENROUTER_API_KEY`

### `.env.local`
- Changed from `GEMINI_API_KEY` to `OPENROUTER_API_KEY`

### `components/Footer.tsx`
- Updated text from "Powered by Gemini 2.5 Flash Image Preview" to "Powered by Gemini 2.5 Flash Image via OpenRouter"

### `.github/copilot-instructions.md`
- Updated documentation to reflect OpenRouter usage
- Updated environment variable instructions

## Features Preserved

All existing features continue to work:
- ✅ Image generation with decade-specific prompts
- ✅ Retry logic with exponential backoff
- ✅ Fallback prompt mechanism
- ✅ Blob URL conversion for memory efficiency
- ✅ Error handling and user feedback
- ✅ Concurrency control (2 workers)
- ✅ Toast notifications

## Testing

After migration, test the following:
1. Upload an image
2. Generate all decades
3. Verify images are generated correctly
4. Test regeneration (shake/tap)
5. Test album download
6. Check browser console for any errors

## Troubleshooting

### "OPENROUTER_API_KEY environment variable is not set"
- Make sure `.env.local` exists and contains `OPENROUTER_API_KEY=your_key_here`
- Restart the dev server after adding the key

### "OpenRouter API error (401)"
- Your API key is invalid or expired
- Get a new key from https://openrouter.ai/keys

### "OpenRouter API error (429)"
- Rate limit exceeded
- The service will automatically retry with exponential backoff
- Consider upgrading your OpenRouter plan if this happens frequently

### Images not generating
- Check browser console for detailed error messages
- Verify your OpenRouter account has credits
- Check https://openrouter.ai/activity for API usage

## Cost Considerations

OpenRouter charges based on usage:
- Check current pricing at https://openrouter.ai/models/google/gemini-2.5-flash-image
- Monitor usage at https://openrouter.ai/activity
- Set credit limits in your OpenRouter account settings

## Future Improvements

With OpenRouter, we can now easily:
1. **Switch Models**: Try different image generation models by changing the `MODEL` constant
2. **Add Backend Proxy**: Move API calls to a backend to hide the API key
3. **Implement Caching**: Use OpenRouter's prompt caching features
4. **Add Fallback Models**: Automatically fall back to other models if Gemini is unavailable
5. **Track Usage**: Better analytics and cost tracking through OpenRouter dashboard

## Resources

- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter API Reference: https://openrouter.ai/docs/api-reference
- OpenRouter Models: https://openrouter.ai/models
- OpenRouter Dashboard: https://openrouter.ai/activity
- Get API Keys: https://openrouter.ai/keys

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the OpenRouter documentation
3. Check your API key and credits at https://openrouter.ai
4. Review the code changes in this migration guide

