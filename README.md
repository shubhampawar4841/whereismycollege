# Exam Cutoff Finder

A comprehensive web application for finding and analyzing college admission cutoff data.

## Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Groq API Key (for AI recommendations)
GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Getting API Keys

1. **Groq API Key**: 
   - Sign up at https://console.groq.com
   - Create an API key from the API Keys section
   - Add it to `.env.local` as `GROQ_API_KEY`

2. **Supabase Keys**:
   - Create a project at https://app.supabase.com
   - Get your project URL and anon key from Settings > API
   - Add them to `.env.local`

## Important Security Notes

⚠️ **NEVER commit API keys or secrets to git!**

- The `.env.local` file is already in `.gitignore`
- Always use environment variables for sensitive data
- If you accidentally committed a key:
  1. Rotate/regenerate the key immediately
  2. Remove it from git history (if possible)
  3. Update your `.env.local` with the new key

## Development

```bash
npm install
npm run dev
```

## Features

- JEE Mains cutoff data analysis
- Maharashtra exam cutoff data
- AI-powered college recommendations
- College comparison tool
- Trend analysis across years and rounds
- College details explorer
