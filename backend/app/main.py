from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, scraper, dashboard, alerts, sources, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="360 News Report API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scraper.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(sources.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "project": "360 News Report"}
