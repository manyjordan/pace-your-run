# 🏃 Strava Integration Migration - Complete Summary

## ✅ What's Been Done

### 1. Database Setup
```
supabase/migrations/001_strava_tokens.sql
├── Created strava_tokens table
├── User-scoped tokens (1 per user)
├── Row Level Security policies (users can only access own tokens)
└── Automatic updated_at timestamp
```

### 2. Edge Functions (Serverless)
```
supabase/functions/
├── strava-auth/index.ts
│   ├── Receives: GET /functions/v1/strava-auth?code=...&state=...
│   ├── Does: Exchange code for tokens, saves to database
│   └── Returns: Redirect to /?strava=connected
│
└── strava-activities/index.ts
    ├── Receives: GET /functions/v1/strava-activities + JWT header
    ├── Does: Fetch activities from Strava API
    ├── Auto-refreshes expired tokens
    └── Returns: { connected, activities, athlete }
```

### 3. Frontend Integration
```
src/lib/strava.ts
├── Added: connectStrava(jwtToken) function
├── Generates: Strava OAuth URL with JWT as state
└── Returns: URL to redirect user to Strava

src/pages/Index.tsx
├── Uses: useAuth() hook for session
├── Calls: /functions/v1/strava-activities with JWT
├── Displays: User's Strava activities
└── Updated: Strava connect button with new flow

src/pages/Settings.tsx
├── Uses: useAuth() hook for session
├── Checks: Strava connection via database query
├── Shows: Athlete name from database
└── Updated: Strava connect button with new flow
```

### 4. Build Configuration
```
vite.config.ts
├── Removed: /api → http://localhost:3000 (old local server)
└── Added: /functions/v1 → http://localhost:54321 (Supabase Functions)
```

## 🔐 Multi-User Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User 1 (authenticated)                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Clicks "Connect Strava"                                      │
│    → Frontend: connectStrava(session.access_token)              │
│    → Generates OAuth URL with JWT as state                      │
│                                                                 │
│ 2. Authorizes with Strava                                       │
│    → Strava: /functions/v1/strava-auth?code=...&state=JWT      │
│                                                                 │
│ 3. Edge Function processes:                                     │
│    → Decodes JWT → Gets user_id = "user1_uuid"                  │
│    → Exchanges code for tokens                                  │
│    → Saves: strava_tokens.user_id = "user1_uuid"                │
│                                                                 │
│ 4. Fetching activities:                                         │
│    → Frontend: GET /functions/v1/strava-activities              │
│       Header: Authorization: Bearer <user1_jwt>                 │
│    → Edge Function:                                             │
│       - Decodes JWT → user_id = "user1_uuid"                    │
│       - SELECT * FROM strava_tokens WHERE user_id = "user1"     │
│       - Row Level Security ensures only user1's row is visible  │
│       - Returns: user1's activities                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ User 2 (authenticated in same app)                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Goes through same flow                                       │
│    → Saves: strava_tokens.user_id = "user2_uuid"                │
│                                                                 │
│ 2. Fetching activities:                                         │
│    → Frontend: GET /functions/v1/strava-activities              │
│       Header: Authorization: Bearer <user2_jwt>                 │
│    → Edge Function:                                             │
│       - Decodes JWT → user_id = "user2_uuid"                    │
│       - SELECT * FROM strava_tokens WHERE user_id = "user2"     │
│       - Row Level Security ensures only user2's row is visible  │
│       - Returns: user2's activities (different from user1!)     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Local Development

```bash
# 1. Run migration
npx supabase db push

# 2. Start Supabase local (in terminal 1)
npx supabase start

# 3. Start dev server (in terminal 2)
npm run dev

# 4. Test the flow
# - Go to http://localhost:8080
# - Sign in
# - Click Settings → "Connecter mon compte Strava"
# - Authorize with Strava
# - See activities on home page
```

### Production Deployment

```bash
# 1. Push migration to production
npx supabase db push --linked

# 2. Deploy Edge Functions
npx supabase functions deploy strava-auth --linked
npx supabase functions deploy strava-activities --linked

# 3. Test on production domain
```

## 📊 Architecture Comparison

### Before (Local Server)
```
Frontend ─→ /api/strava/activities ─→ Node.js (localhost:3000)
                                          ↓
                                    localStorage (single user)
                                          ↓
                                    Strava API
```

### After (Supabase Functions)
```
Frontend ─→ /functions/v1/strava-activities (JWT header)
                ↓
         Edge Function (authenticated)
                ↓
         Supabase Database (row-level security)
         - Fetches user's tokens from strava_tokens table
         - Applies Row Level Security (JWT.sub == user_id)
                ↓
         Strava API
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_strava_tokens.sql` | Database schema + RLS policies |
| `supabase/functions/strava-auth/index.ts` | OAuth callback handler |
| `supabase/functions/strava-activities/index.ts` | Activity fetcher |
| `src/lib/strava.ts` | `connectStrava()` helper function |
| `src/pages/Index.tsx` | Updated to use Edge Function + Auth |
| `src/pages/Settings.tsx` | Updated to use Edge Function + Auth |
| `vite.config.ts` | Proxy configuration |

## 📝 Configuration

### Supabase Secrets (Already Set)
```
STRAVA_CLIENT_ID=219219
STRAVA_CLIENT_SECRET=b54eef1e8a0165dd4c15c5f0bb0b4234208e6512
STRAVA_REDIRECT_URI=https://qdimcdoglkeigimrdpsb.supabase.co/functions/v1/strava-auth
```

### Environment Variables (Frontend)
```
VITE_SUPABASE_URL=https://qdimcdoglkeigimrdpsb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRAVA_CLIENT_ID=219219
```

## ✨ Features

✅ **Multi-user support** - Each user's Strava tokens isolated by database
✅ **Automatic token refresh** - Handles expired tokens transparently
✅ **Security by design** - Row Level Security prevents data leakage
✅ **Scalable** - Serverless Edge Functions auto-scale
✅ **Type-safe** - Full TypeScript throughout
✅ **No local state** - Tokens stored securely in Supabase
✅ **Easy debugging** - Can view logs in Supabase dashboard

## 🧪 Testing the Setup

```bash
# Check database
npx supabase query "SELECT * FROM strava_tokens LIMIT 1;"

# Check function logs
npx supabase functions list

# Test Edge Function locally
curl -X GET http://localhost:54321/functions/v1/strava-activities \
  -H "Authorization: Bearer YOUR_JWT"

# View RLS policies
npx supabase query "SELECT policyname FROM pg_policies WHERE tablename = 'strava_tokens';"
```

## 📚 Next Steps

1. ✅ Run `npx supabase db push` to create the table
2. ✅ Start Supabase: `npx supabase start`
3. ✅ Start dev server: `npm run dev`
4. ✅ Test the Strava connection flow
5. When ready: Deploy to production with `npx supabase functions deploy`

## 🆘 Support Files

- `MIGRATION_STRAVA.md` - Detailed technical documentation
- `STRAVA_SETUP.md` - Step-by-step setup and troubleshooting guide

**The migration is complete and ready to use!** 🎉
