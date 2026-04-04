# Strava Integration - Setup Checklist

## Prerequisites
- ✅ Supabase CLI installed locally (`npm install --save-dev supabase`)
- ✅ Logged into Supabase CLI (`npx supabase login --token <token>`)
- ✅ Project linked (`npx supabase link --project-ref qdimcdoglkeigimrdpsb`)
- ✅ Secrets set in Supabase:
  - STRAVA_CLIENT_ID=219219
  - STRAVA_CLIENT_SECRET=b54eef1e8a0165dd4c15c5f0bb0b4234208e6512
  - STRAVA_REDIRECT_URI=https://qdimcdoglkeigimrdpsb.supabase.co/functions/v1/strava-auth

## Step 1: Run Database Migration
```bash
# Push the migration to Supabase
npx supabase db push

# Verify the table was created
npx supabase db pull
```

What this does:
- Creates the `strava_tokens` table
- Sets up Row Level Security policies
- Creates the `updated_at` trigger for automatic timestamps

## Step 2: Deploy Edge Functions

### For Local Development
```bash
# Start Supabase local stack (if not running)
npx supabase start

# Functions will be available at http://localhost:54321/functions/v1
```

### For Production
```bash
# Deploy to your Supabase project
npx supabase functions deploy strava-auth
npx supabase functions deploy strava-activities

# Verify they're deployed
npx supabase functions list
```

## Step 3: Update Strava OAuth Settings

Go to your Strava app settings at https://www.strava.com/settings/api

Update the **Authorization Callback Domain**:
- For local development: `localhost:8080`
- For production: `your-domain.com`

Redirect URI should be:
- Local: `http://localhost:8080/functions/v1/strava-auth`
- Production: `https://qdimcdoglkeigimrdpsb.supabase.co/functions/v1/strava-auth`

## Step 4: Test Locally

```bash
# Terminal 1: Start Supabase
npx supabase start

# Terminal 2: Start dev server
npm run dev

# Terminal 3: Watch Edge Functions (optional)
npx supabase functions serve strava-auth strava-activities
```

Then:
1. Go to `http://localhost:8080` and sign in
2. Click "Settings" → "Connecter mon compte Strava"
3. Authorize with Strava
4. You should see your activities on the home page

## Step 5: Deploy to Production

When you're ready to deploy:

```bash
# Push migrations to production
npx supabase db push --linked

# Deploy Edge Functions to production
npx supabase functions deploy strava-auth --linked
npx supabase functions deploy strava-activities --linked
```

## Troubleshooting

### Functions not found (404)
- Make sure Supabase is running: `npx supabase status`
- Check the vite proxy: `"/functions/v1": "http://localhost:54321"`
- Verify Edge Function files exist in `supabase/functions/`

### "Invalid JWT state parameter"
- The JWT passed to connectStrava is invalid
- Check that `session.access_token` is being passed correctly
- Verify the AuthContext is providing a valid session

### "Invalid access token format" from Strava
- Double-check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in Supabase secrets
- Verify they match your Strava app credentials
- Make sure Strava app settings has the correct redirect URI

### "No Strava token found" 
- User hasn't connected their Strava account yet
- Database might not have the row
- Check Row Level Security policies: `SELECT * FROM strava_tokens` (as authenticated user)

### Token refresh failing
- Refresh token might have expired
- User needs to re-authorize through Strava
- Check Strava API rate limits

## Database Queries (for debugging)

### View your Strava token (as authenticated user)
```sql
SELECT user_id, athlete, expires_at FROM strava_tokens LIMIT 1;
```

### View all Strava tokens (as service role only)
```bash
npx supabase query "SELECT user_id, athlete, expires_at FROM strava_tokens;"
```

### Check RLS policies
```bash
npx supabase query "SELECT policyname, permissive, roles, qual FROM pg_policies WHERE tablename = 'strava_tokens';"
```

## Monitoring

Check Edge Function logs:
```bash
# View logs for strava-auth
npx supabase functions list

# Or check logs in Supabase dashboard
# → Edge Functions → strava-auth/strava-activities → Logs
```

## Rollback Plan

If you need to go back to the old system:
1. Keep `strava-auth-server.mjs` running on port 3000
2. Update `vite.config.ts` to use `/api": "http://localhost:3000"`
3. Revert `src/pages/Index.tsx` and `src/pages/Settings.tsx`
4. The old `.strava-session.local.json` file will be used again

## Support

For issues with:
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Strava API**: https://developers.strava.com/docs/reference/
- **Supabase Auth**: https://supabase.com/docs/guides/auth
