# Facebook Ad Automation App

A full-stack application for automating Facebook ad creation, from competitor research to ad generation and launching.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL (required)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-15
   sudo systemctl start postgresql
   ```

2. Create database:
   ```bash
   createdb video_ad_builder
   ```

3. Set environment variable:
   ```bash
   export DATABASE_URL="postgresql://localhost:5432/video_ad_builder"
   ```

### Option 2: Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Get your connection string from Project Settings → Database
3. Set environment variable:
   ```bash
   export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   ```

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment template
cp ../.env.example ../.env
# Edit .env and set your DATABASE_URL and API keys

# Initialize database
python init_db.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `GEMINI_API_KEY`: Google Gemini API key for AI features
- `VITE_FACEBOOK_ACCESS_TOKEN`: Facebook Marketing API access token
- `VITE_FACEBOOK_AD_ACCOUNT_ID`: Your Facebook Ad Account ID

## Troubleshooting

### Database Connection Errors

If you see "DATABASE_URL environment variable is required":
1. Ensure `.env` file exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Test PostgreSQL connection: `psql $DATABASE_URL`

### SQLite No Longer Supported

As of the latest version, SQLite is deprecated. PostgreSQL is required for all environments.

## Documentation

- [Specifications](./specifications.md) - Technical architecture and API documentation
- [Supabase Setup](./SUPABASE_SETUP.md) - Supabase-specific configuration
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md) - Deploy to Railway (recommended for production)

## Deployment

### Railway (Recommended)

Railway provides the easiest deployment experience with managed PostgreSQL, automatic deployments, and built-in monitoring.

**Quick Start:**
1. Push your code to GitHub
2. Create a Railway project and connect your repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy!

See the [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md) for detailed step-by-step instructions.

### Other Platforms

This application can also be deployed to:
- **Render**: Similar to Railway, supports Docker
- **Fly.io**: Global edge deployment
- **DigitalOcean App Platform**: Managed platform with PostgreSQL
- **AWS/GCP/Azure**: Traditional cloud providers (requires more setup)

For these platforms, you can use the provided `Dockerfile` and adapt the configuration as needed.

