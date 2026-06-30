# GitHub Repository Info

## Repository Name
360-degree-news-Scrapping

## Remote URL
https://github.com/Swapnil882/360-degree-news-Scrapping.git

## Suggested Description
AI-assisted 360 degree news monitoring and government feedback system with a FastAPI backend, React dashboard, scraping workflow, sentiment analysis, harmful-content alerts, and source management.

## Project Type
Full-stack web application

## Tech Stack
- Backend: FastAPI, SQLAlchemy, SQLite, Pydantic, JWT authentication
- Frontend: React, Vite, React Router, Axios, Recharts
- Scraping and analysis: Requests, BeautifulSoup, TextBlob, optional Gemini API

## Main Features
- User registration, login, JWT authentication, and profile updates
- News URL scraping and article history
- Sentiment, trust, harmful-content, and fake-news style analysis
- Alert creation and review workflow
- Dashboard statistics and trend endpoints
- News source management
- JSON export listing, reading, and deletion

## Before Pushing
- Keep `.env`, `backend/.env`, local databases, `node_modules`, and generated build folders out of Git.
- Review generated export JSON files before committing; they may contain scraped third-party content.
- Run backend tests with:

```powershell
cd backend
python -m unittest discover -s tests
```

- Run frontend build when Node.js and npm are available:

```powershell
cd frontend
npm run build
```

## Suggested Git Commands
```powershell
git status
git add .
git commit -m "Prepare project for GitHub"
git push origin main
```

If your default branch is `master`, use `git push origin master` instead.
