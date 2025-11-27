# QuizGenie - AI Learning Platform

Transform your teaching materials into engaging quizzes powered by Google Gemini AI.

## Features

- 🤖 **AI Quiz Generation** - Upload PDFs, images, or text to generate quizzes instantly
- 📊 **Smart Analytics** - Track student performance and identify learning gaps
- 🌍 **Bilingual Support** - Full Arabic and English interface with RTL support
- ✅ **Auto-Grading** - AI-powered grading for essays and subjective answers
- 💳 **Subscription Plans** - Free, Pro (100 quizzes/month), and School (unlimited) tiers
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Google Gemini 3
- **Payments:** Paymob (Egypt & MENA region)
- **Hosting:** Vercel

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Google AI Studio API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd "Gemini 3- New App"
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_KEY=your_gemini_api_key
```

4. Run development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

**Quick Deploy:**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Database Setup

Run the migration scripts in Supabase SQL Editor:
1. `database/update_subscription_schema.sql` - Adds subscription tracking

## Project Structure

```
├── components/          # Reusable UI components
├── pages/              # Page components (Dashboard, Quiz Creator, etc.)
├── services/           # API services (Supabase, Gemini, Payments)
├── types.ts            # TypeScript type definitions
├── constants.ts        # Translations and constants
└── App.tsx             # Main app component with routing
```

## License

All rights reserved © 2024 QuizGenie Inc.

## Support

For questions or issues, contact: sayed.hussein.elsayed@gmail.com
