#!/bin/bash
# Strava Integration Setup Commands
# Copy and paste these commands to complete the setup

# ============================================================================
# STEP 1: Run the Database Migration
# ============================================================================
echo "Step 1: Running database migration..."
npx supabase db push

# Expected output:
# → Applying migration 001_strava_tokens.sql
# ✓ Applied migration

# ============================================================================
# STEP 2: Start Supabase Local (Terminal 1)
# ============================================================================
echo "Step 2: Starting Supabase local..."
npx supabase start

# Expected output:
# Started supabase local development server.
# ...
# API URL: http://localhost:54321
# ...

# ============================================================================
# STEP 3: Start Dev Server (Terminal 2)
# ============================================================================
echo "Step 3: Starting development server..."
npm run dev

# Expected output:
# > vite
# VITE v5.4.19 ready in 1234 ms
# Local: http://localhost:8080/

# ============================================================================
# STEP 4: Test the Setup (Terminal 3)
# ============================================================================

# 4a. Verify database table was created
echo "Verifying database table..."
npx supabase query "SELECT table_name FROM information_schema.tables WHERE table_name='strava_tokens';"

# Expected output:
# strava_tokens

# 4b. Check Edge Functions are registered
echo "Checking Edge Functions..."
npx supabase functions list

# Expected output:
# ✓ strava-auth
# ✓ strava-activities

# 4c. View the Edge Function code
echo "Viewing Edge Function code..."
cat supabase/functions/strava-auth/index.ts

# ============================================================================
# MANUAL TESTING
# ============================================================================
# 1. Open http://localhost:8080 in browser
# 2. Sign in with email/password (created during auth setup)
# 3. Click "Settings" in sidebar
# 4. Click "Connecter mon compte Strava"
# 5. You should be redirected to Strava login
# 6. After authorizing, you'll be redirected back to home page
# 7. Check that your Strava activities appear

# ============================================================================
# DEBUGGING COMMANDS
# ============================================================================

# View Strava token for current user
# (Run this as authenticated user in database)
echo "View your Strava token:"
npx supabase query "SELECT user_id, athlete, expires_at FROM strava_tokens LIMIT 1;"

# Check RLS policies
echo "Check RLS policies:"
npx supabase query "SELECT policyname, permissive FROM pg_policies WHERE tablename = 'strava_tokens';"

# View Edge Function logs
echo "View strava-auth logs:"
npx supabase functions logs strava-auth

echo "View strava-activities logs:"
npx supabase functions logs strava-activities

# ============================================================================
# PRODUCTION DEPLOYMENT
# ============================================================================

# Only run when ready to deploy to production:

# 1. Push migration to production
echo "Deploying migration..."
npx supabase db push --linked

# 2. Deploy Edge Functions to production
echo "Deploying Edge Functions..."
npx supabase functions deploy strava-auth --linked
npx supabase functions deploy strava-activities --linked

# 3. Verify deployment
echo "Verifying deployment..."
npx supabase functions list

# ============================================================================
# CLEANUP (if needed to rollback)
# ============================================================================

# To go back to old system:
# 1. Keep strava-auth-server.mjs running on port 3000
# 2. Update vite.config.ts:
#    "/api": "http://localhost:3000"
# 3. Revert src/pages/Index.tsx changes
# 4. Revert src/pages/Settings.tsx changes

# ============================================================================
# USEFUL COMMANDS
# ============================================================================

# Restart Supabase
npx supabase stop
npx supabase start

# Reset database (WARNING: deletes all data!)
npx supabase db reset

# Watch Edge Functions for changes
npx supabase functions serve strava-auth strava-activities

# View database schema
npx supabase db pull

# Check project status
npx supabase projects list
npx supabase status

# ============================================================================
# EXPECTED BEHAVIOR
# ============================================================================

# ✅ User can click "Connect Strava" and see Strava login
# ✅ After authorizing, user is redirected back with "?strava=connected"
# ✅ Strava activities appear on home page
# ✅ Athlete name and info display correctly
# ✅ Settings page shows "Connecté" if Strava is connected
# ✅ Multiple users can connect different Strava accounts (no data mixing)
# ✅ Signing out removes Strava access but tokens remain in database (can reconnect)

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# Issue: 404 on /functions/v1/strava-activities
# Solution: Make sure Supabase is running (npx supabase start)
#           Check vite.config.ts proxy is correct
#           Check functions folder: supabase/functions/strava-*/index.ts

# Issue: "Invalid JWT state parameter"
# Solution: Check that session.access_token is being passed to connectStrava()
#           Verify JWT is not expired

# Issue: Strava API errors
# Solution: Check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in Supabase secrets
#           Verify Strava OAuth app settings have correct redirect URI

# Issue: "No Strava token found"
# Solution: User hasn't connected their Strava account yet (expected)
#           Or database row wasn't created (check Edge Function logs)

# For more help, see:
# - STRAVA_MIGRATION_SUMMARY.md (overview)
# - MIGRATION_STRAVA.md (technical details)
# - STRAVA_SETUP.md (setup guide & troubleshooting)
