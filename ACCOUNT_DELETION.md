# Account Deletion Feature

## Overview
Implemented a complete account deletion feature that allows users to permanently delete their account and all associated data with a confirmation dialog.

## Components

### Frontend (Settings.tsx)
- **Danger Zone Section**: New section at the bottom with "Supprimer mon compte" button
- **AlertDialog**: Confirmation dialog using shadcn/ui AlertDialog component
  - Title: "Supprimer votre compte ?"
  - Description: "Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées définitivement."
  - Red confirm button
- **State Management**: 
  - `deleteDialogOpen`: Controls dialog visibility
  - `isDeleting`: Shows loading state during deletion

### Backend (Edge Function)
**Location**: `supabase/functions/delete-account/index.ts`

**Functionality**:
1. Validates JWT token from Authorization header
2. Deletes user profile (cascades to all related data):
   - `profiles` (user record)
   - `runs` (cascade delete)
   - `social_posts` (cascade delete)
   - `post_likes` (cascade delete)
   - `strava_tokens` (cascade delete)
   - `training_plan_sessions` (cascade delete)
3. Deletes auth user
4. Returns success response

**CORS**: Properly configured for cross-origin requests

## Data Flow

1. User clicks "Supprimer mon compte"
2. Confirmation dialog opens
3. User confirms (red button)
4. Frontend calls `POST /functions/v1/delete-account` with JWT
5. Edge Function validates token and deletes account + data
6. Frontend signs out user
7. Redirects to `/auth` page

## Deployment

### Deploy Edge Function
```bash
npx supabase functions deploy delete-account
```

### Testing Locally
```bash
# Start Supabase locally (if needed)
npx supabase start

# Edge Function will be available at:
# http://localhost:54321/functions/v1/delete-account
```

## Security Notes

- JWT validation required (via Authorization header)
- Service role key used only on backend (never exposed to client)
- All cascade deletes handled by FK constraints
- User must be authenticated to call function
- Dialog prevents accidental clicks

## Error Handling

- Missing auth header → 401 Unauthorized
- Invalid/expired token → 401 Unauthorized
- Database errors → 500 with error details
- Success → 200 with success message

## UI/UX

- **Zone de danger** section with red theme
- AlertTriangle icon for visual warning
- Descriptive text about data deletion
- Loading state during deletion
- Toast notifications for success/error
- Smooth transition with ScrollReveal animation
