# Strava Integration Migration to Supabase Edge Functions

## Overview
This document outlines the complete migration of the Strava integration from a local Node.js server to Supabase Edge Functions with proper multi-user support using Supabase Auth.

## What Was Changed

### 1. Database Layer
**File**: `supabase/migrations/001_strava_tokens.sql`

Created a new `strava_tokens` table to store per-user Strava authentication data:
- `id`: UUID primary key
- `user_id`: References `auth.users(id)` with cascade delete (enforces one token per user)
- `access_token`: Strava access token
- `refresh_token`: Strava refresh token
- `expires_at`: Token expiration timestamp
- `athlete`: JSONB storing athlete info
- `created_at` / `updated_at`: Timestamps

**Security**: Row Level Security (RLS) policies ensure users can only access their own tokens.

### 2. Edge Functions

#### strava-auth (`supabase/functions/strava-auth/index.ts`)
Handles OAuth callback from Strava:
- **Input**: GET request with `code` (from Strava) and `state` (user's JWT)
- **Process**:
  1. Decodes JWT from state parameter to get `user_id`
  2. Exchanges auth code for Strava tokens via `https://www.strava.com/oauth/token`
  3. Upserts token row in `strava_tokens` table
  4. Redirects to `/?strava=connected` on success
- **Environment variables used**: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`

#### strava-activities (`supabase/functions/strava-activities/index.ts`)
Fetches Strava activities for the authenticated user:
- **Input**: GET request with `Authorization: Bearer <JWT>` header
- **Process**:
  1. Extracts `user_id` from JWT
  2. Looks up token in `strava_tokens` table
  3. Refreshes token if expired (with 2-minute buffer)
  4. Fetches activities from Strava API
  5. Returns activities with athlete info
- **Response**: `{ connected: boolean, activities: [], athlete: {...} }`

### 3. Frontend Updates

#### `src/lib/strava.ts`
Added new `connectStrava(jwtToken)` function:
- Takes user's JWT as parameter
- Constructs Strava OAuth URL with JWT as `state` parameter
- Redirect URI now points to `/functions/v1/strava-auth`

#### `src/pages/Index.tsx`
- Added `useAuth()` hook to access session
- Updated `loadStravaActivities()` to call `/functions/v1/strava-activities` with JWT
- Updated `stravaAuthUrl` to use new `connectStrava()` function
- Made it session-dependent (fetches only when session exists)

#### `src/pages/Settings.tsx`
- Added `useAuth()` hook integration
- Checks Strava connection via Supabase database query instead of local API
- Updated Strava OAuth button to use `connectStrava()` function
- Shows athlete name from database

### 4. Build Configuration

#### `vite.config.ts`
- Removed old proxy: `/api` → `http://localhost:3000`
- Added new proxy: `/functions/v1` → `http://localhost:54321` (local Supabase Functions)

## How It Works

### User Flow

1. **User clicks "Connect Strava"**
   - Frontend calls `connectStrava(session.access_token)`
   - Generates Strava OAuth URL with user's JWT as state
   - User is redirected to Strava login

2. **User authorizes in Strava**
   - Strava redirects back to `/functions/v1/strava-auth?code=...&state=...`
   - Edge function receives code + JWT
   - Exchanges code for tokens with Strava
   - Stores tokens in `strava_tokens` table (scoped to user)
   - Redirects to `/?strava=connected`

3. **Fetching Activities**
   - Frontend calls `/functions/v1/strava-activities` with JWT in Authorization header
   - Edge function decodes JWT to get user_id
   - Looks up tokens from database (only own row visible due to RLS)
   - Automatically refreshes if token is expired
   - Returns activities to frontend

## Security Features

✅ **Multi-user support**: Each user's tokens are stored separately and isolated by RLS
✅ **Token encryption in transit**: Uses JWT for state parameter (not in URL permanently)
✅ **Automatic token refresh**: Handles expired tokens transparently
✅ **Row Level Security**: Users cannot access other users' Strava tokens
✅ **Service role key**: Only Edge Functions (with service role key) can write tokens
✅ **JWT validation**: State parameter is validated before use

## Environment Variables Required

Make sure these are set in Supabase:
```
STRAVA_CLIENT_ID=<your-client-id>
STRAVA_CLIENT_SECRET=<your-client-secret>
STRAVA_REDIRECT_URI=https://<project-id>.supabase.co/functions/v1/strava-auth
```

## Next Steps

1. **Run the migration**:
   ```bash
   npx supabase db push
   ```

2. **Deploy Edge Functions** (when ready for production):
   ```bash
   npx supabase functions deploy strava-auth strava-activities
   ```

3. **Test locally**:
   - Start Supabase local: `npx supabase start`
   - Start dev server: `npm run dev`
   - Navigate to Settings, click "Connect Strava"
   - Authorize with Strava account
   - Check Index page to see activities

## Old Files to Delete

The following files are no longer needed:
- `strava-auth-server.mjs` (old local Node.js server)
- `.strava-session.local.json` (old local storage)

You can keep them for reference but they won't be used anymore.

## Files Modified

- `src/lib/strava.ts` - Added `connectStrava()` function
- `src/pages/Index.tsx` - Updated to use Edge Function + useAuth
- `src/pages/Settings.tsx` - Updated to use Edge Function + useAuth
- `vite.config.ts` - Updated proxy configuration

## Files Created

- `supabase/migrations/001_strava_tokens.sql` - Database schema
- `supabase/functions/strava-auth/index.ts` - OAuth callback handler
- `supabase/functions/strava-activities/index.ts` - Activities fetcher
