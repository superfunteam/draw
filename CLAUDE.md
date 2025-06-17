# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superfun Draw is a web-based AI-powered drawing application that allows users to create coloring books and images using OpenAI's APIs. The application is a single-page web app built with vanilla HTML, CSS (Tailwind), and JavaScript, deployed on Netlify with serverless functions.

## Key Architecture

- **Frontend**: Single HTML file (`index.html`) with vanilla JavaScript
- **Styling**: Tailwind CSS v4 with custom configuration
- **Backend**: Netlify serverless functions for API key management
- **API Integration**: OpenAI API for image generation and text processing
- **Deployment**: Netlify with environment variable configuration

## Development Commands

```bash
# Build Tailwind CSS (watch mode for development)
npx tailwindcss -i source.css -o build.css --watch

# Build Tailwind CSS (production)
npx tailwindcss -i source.css -o build.css --minify

# Serve locally (any HTTP server)
npx serve .
```

## Core Files

- `index.html` - Main application interface with drawing canvas, settings, and modals
- `app.js` - Core application logic for drawing, API calls, and UI interactions
- `modals.js` - Reusable modal system for projects, tokens, and lightbox functionality
- `source.css` - Tailwind input file
- `build.css` - Generated Tailwind output file
- `tailwind.config.js` - Tailwind configuration
- `netlify/functions/get-env.js` - Serverless function to securely provide API keys
- `netlify.toml` - Netlify deployment configuration

## Environment Setup

The application requires an OpenAI API key configured as `OPENAI_API` environment variable in Netlify. The key is accessed via the `/get-env` serverless function to avoid exposing it in the frontend code.

## UI Components

- Drawing interface with prompt input and image generation
- Multi-image workflow support (story generation)
- Modal system for projects, token purchasing, and image lightbox
- Mobile-responsive design with collapsible sidebar
- PDF export functionality for generated images

## API Integration

The app integrates with OpenAI's API for:
- Image generation (DALL-E models)
- Text processing (GPT models for story/prompt enhancement)
- Different quality settings and aspect ratios

## Deployment Notes

- Static site deployment on Netlify
- Environment variables managed through Netlify dashboard
- Serverless functions automatically deployed from `netlify/functions/` directory
- Redirects configured to serve SPA from root

## Recent Implementation: Multiple Image References (Jan 2025)

### What Was Implemented
Added support for sending multiple reference images (up to 4) to OpenAI's image generation API. Users can now upload or paste images into the interface slots and use them as references for AI image generation.

### Key Changes Made

#### 1. API Endpoint Migration
- **Problem**: Original code used `/v1/images/generations` which doesn't support multiple image references
- **Solution**: Implemented dual-endpoint approach:
  - **Without references**: Continue using `/v1/images/generations` with `gpt-image-1` model
  - **With references**: Use `/v1/responses` endpoint with `gpt-4.1` model

#### 2. Request Format Changes
**New format for image references:**
```javascript
{
  model: "gpt-4.1",
  input: [
    {
      role: "user", 
      content: [
        { type: "input_text", text: "Your prompt..." },
        { type: "input_image", image_url: "data:image/png;base64,..." },
        { type: "input_image", image_url: "data:image/png;base64,..." }
        // ... up to 4 images
      ]
    }
  ],
  tools: [{ 
    type: "image_generation",
    output_format: "png",
    quality: "low|medium|high|auto", // From UI selector
    size: "1024x1024|1024x1536|1536x1024" // From UI selector
  }],
  tool_choice: { type: "image_generation" } // Force image generation
}
```

#### 3. Response Handling Updates
- **Legacy format** (`/images/generations`): `data.data[0].b64_json`
- **New format** (`/responses`): `data.output.filter(type="image_generation_call")[0].result`

#### 4. UI Integration Points
- **Image slots**: `.prompt-image-preview.image-1` through `.image-4` 
- **Data storage**: Images stored as data URLs in `dataset.pastedImageUrl`
- **Collection logic**: Scans all 4 slots in current draw group for images

### Critical Implementation Details

#### Setting Mapping
- **Quality**: UI values ('low', 'medium', 'high', 'auto') map directly to API
- **Size**: UI descriptive names map to pixel dimensions:
  - "Square" → "1024x1024"
  - "Portrait (tall)" → "1024x1536"  
  - "Landscape (wide)" → "1536x1024"

#### Error Handling Lessons
1. **Parameter validation**: API is strict about parameter names and values
2. **Tool forcing**: Must use `tool_choice` to ensure image generation vs. text response
3. **Response structure**: Different endpoints have completely different response formats

### Code Locations
- **Main implementation**: `app.js` lines ~434-600 in `attachButtonListeners()` function
- **Image collection**: Iterates through `.prompt-image-preview` elements in current draw group
- **API selection**: Conditional logic based on `imageReferences.length > 0`

### Testing Notes
- Test with 1-4 images to verify all slots work
- Check console logs for API request body and response parsing
- Verify quality/size selectors are respected in both endpoints
- Ensure backward compatibility when no images are provided

### Future Considerations
- Consider adding image preprocessing (resize, format conversion)
- Implement error handling for oversized images
- Add visual feedback for image processing status
- Consider adding image editing features before generation

## User Authentication & Token System (Jan 2025)

### What Was Implemented
Added passwordless authentication system with token-based usage tracking. Users can purchase tokens via email verification and track their usage automatically.

### System Architecture

#### Database Schema (`netlify/schema.sql`)
```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL DEFAULT 0,
  auth_code TEXT UNIQUE,
  auth_code_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Serverless Functions
- **`purchase-tokens.js`**: Handles token "purchases" (mocked payment flow)
- **`send-auth-email.js`**: Sends login codes via Mailjet
- **`auth-login.js`**: Validates auth codes and returns user data
- **`deduct-tokens.js`**: Deducts tokens after successful API calls

#### Authentication Flow
1. **Purchase Flow**: User enters email + selects token plan → generates 8-digit code → sends email
2. **Email Login**: User clicks link with `?auth=12345678` → validates code → logs in
3. **Token Deduction**: After successful image generation → deducts `usage.total_tokens` from balance
4. **Insufficient Tokens**: Shows modal to purchase more tokens

### Key Implementation Details

#### Client-Side Auth State
- **Storage**: `localStorage` with key `superfun_auth`
- **State Object**: `{ email: string, tokens: number }`
- **UI Updates**: Token count displays as "Buy (123)" when logged in

#### Token Usage Tracking
- **Deduction Trigger**: After successful API response with image data
- **Amount**: Uses `data.usage.total_tokens` from OpenAI response (example: 6278 tokens)
- **Zero Protection**: Never goes negative, zeros out balance instead
- **Error Handling**: Shows purchase modal when insufficient tokens

#### Email Integration (Mailjet)
- **Service**: Mailjet API for transactional emails
- **Template**: Plain text with login link and 8-digit code
- **Environment**: `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` required

### Configuration Requirements

#### Environment Variables (Netlify)
```
OPENAI_API=""
MAILJET_API_KEY=""
MAILJET_SECRET_KEY=""
```

#### Dependencies Added
```json
{
  "@netlify/database": "^1.0.0",
  "node-mailjet": "^6.0.5"
}
```

### User Experience Flow
1. User tries to generate image without login → token modal appears
2. User enters email, selects plan → "Check your email" message
3. User clicks email link → automatically logged in
4. Token count shows in UI, deducts after each generation
5. When tokens run out → modal appears to purchase more

### Testing Notes
- Test email delivery with real Mailjet credentials
- Verify token deduction matches API `usage.total_tokens`
- Test insufficient token handling
- Verify auth state persists across browser sessions
- Test auth code expiration (one-time use)