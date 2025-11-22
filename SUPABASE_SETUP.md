# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: video-ad-builder (or your preferred name)
   - **Database Password**: Choose a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
5. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase-schema.sql` in your project root
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

## Step 3: Get API Credentials

1. In your Supabase dashboard, click **Project Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Environment Variables

1. In your project root, create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```
   GEMINI_API_KEY=your_existing_gemini_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Replace the placeholder values with your actual credentials from Step 3

## Step 5: Restart Dev Server

1. Stop your current dev server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 6: Test the Integration

1. Open your app in the browser
2. Try creating a brand
3. Check your Supabase dashboard:
   - Click **Table Editor** in the left sidebar
   - Click on the **brands** table
   - You should see your newly created brand!

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure your `.env` file exists and has the correct variable names
- Restart your dev server after creating/editing `.env`

**Error: "Invalid API key"**
- Double-check you copied the **anon public** key, not the service_role key
- Make sure there are no extra spaces in your `.env` file

**Data not appearing**
- Check the browser console for errors
- Verify the SQL schema ran successfully (check Table Editor in Supabase)
- Make sure Row Level Security policies are enabled (they should be from the schema)
