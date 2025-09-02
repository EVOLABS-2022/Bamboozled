# Supabase Setup Guide for Bamboo Lands

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose your organization
5. Name: "bamboo-lands" 
6. Database password: (generate strong password)
7. Region: Choose closest to your users
8. Click "Create new project"

## Step 2: Set up Database

1. In your Supabase dashboard, go to "SQL Editor"
2. Copy the contents of `supabase-schema.sql` 
3. Paste and click "Run"
4. This creates the `game_saves` table with proper security

## Step 3: Get API Keys

1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon public key**: `eyJ0eXAiOiJKV1Q...` (long key)

## Step 4: Update Environment Variables

1. Open `.env.local` in your project
2. Replace with your actual values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiOiJIUzI1NiJ9...
```

## Step 5: Deploy to Netlify

1. Push changes to GitHub
2. In Netlify, go to your site settings
3. Go to "Environment variables"
4. Add the same two variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Trigger new deploy

## What This Enables

✅ **Multi-player persistent saves** - Each player gets their own save
✅ **Auto-save every 30 seconds** - No progress lost
✅ **Works without your PC** - All data in Supabase cloud
✅ **Free tier sufficient** - Handles 20+ daily players easily
✅ **Secure** - Each player can only access their own data

## Testing

1. Deploy to Netlify with new environment variables
2. Visit your game URL
3. Create account with email/password  
4. Play game - it auto-saves every 30 seconds
5. Refresh page - game loads your progress
6. Share URL with testers - each gets their own save

Ready to go! 🎋