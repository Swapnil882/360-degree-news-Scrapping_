import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

_, test_db_path = tempfile.mkstemp(prefix="news-report-test-", suffix=".sqlite3")
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ["SECRET_KEY"] = "test-secret-key"

from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Alert, ScrapedNews, Source, User
from app.services.auth_service import create_access_token, hash_password


client = TestClient(app)


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    def create_user(
        self,
        username="user",
        email="user@example.com",
        password="Password123",
        is_staff=False,
        is_active=True,
    ):
        db = SessionLocal()
        try:
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password(password),
                is_staff=is_staff,
                is_active=is_active,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        finally:
            db.close()

    def login(self, username="user", password="Password123"):
        response = client.post("/api/auth/login", json={"username": username, "password": password})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["access_token"]

    def auth_headers(self, username="user", password="Password123"):
        return {"Authorization": f"Bearer {self.login(username, password)}"}

    def test_register_login_and_me(self):
        response = client.post(
            "/api/auth/register",
            json={
                "username": "  Alice  ",
                "email": "ALICE@example.com",
                "password": "Password123",
                "phone": "+91 98765 43210",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["user"]["username"], "Alice")
        self.assertEqual(body["user"]["email"], "alice@example.com")
        self.assertEqual(body["user"]["phone"], "919876543210")

        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
        self.assertEqual(me.status_code, 200, me.text)
        self.assertEqual(me.json()["username"], "Alice")

    def test_rejects_weak_password_and_duplicate_identity(self):
        self.create_user(username="taken", email="taken@example.com")

        weak = client.post(
            "/api/auth/register",
            json={"username": "new", "email": "new@example.com", "password": "short", "phone": ""},
        )
        self.assertEqual(weak.status_code, 422)

        duplicate_username = client.post(
            "/api/auth/register",
            json={"username": "taken", "email": "other@example.com", "password": "Password123", "phone": ""},
        )
        self.assertEqual(duplicate_username.status_code, 409)

        duplicate_email = client.post(
            "/api/auth/register",
            json={"username": "other", "email": "TAKEN@example.com", "password": "Password123", "phone": ""},
        )
        self.assertEqual(duplicate_email.status_code, 409)

    def test_inactive_user_cannot_login_or_use_existing_token(self):
        inactive = self.create_user(username="inactive", email="inactive@example.com", is_active=False)

        token = client.post("/api/auth/login", json={"username": "inactive", "password": "Password123"})
        self.assertEqual(token.status_code, 403)

        stale_token = create_access_token({"sub": str(inactive.id)})
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {stale_token}"})
        self.assertEqual(response.status_code, 403)

    def test_dashboard_stats_are_scoped_to_current_user(self):
        owner = self.create_user(username="owner", email="owner@example.com")
        other = self.create_user(username="other", email="other@example.com")
        db = SessionLocal()
        try:
            news = ScrapedNews(
                user_id=owner.id,
                source_url="https://example.com",
                title="Owner article",
                sentiment="negative",
                is_harmful=True,
            )
            other_news = ScrapedNews(
                user_id=other.id,
                source_url="https://example.org",
                title="Other article",
                sentiment="positive",
                is_harmful=False,
            )
            db.add_all([news, other_news])
            db.flush()
            db.add(Alert(news_id=news.id, reported_by=owner.id, reason="test"))
            db.commit()
        finally:
            db.close()

        response = client.get("/api/dashboard/stats", headers=self.auth_headers("owner"))
        self.assertEqual(response.status_code, 200, response.text)
        stats = response.json()
        self.assertEqual(stats["total_articles"], 1)
        self.assertEqual(stats["harmful_count"], 1)
        self.assertEqual(stats["pending_alerts"], 1)
        self.assertEqual(stats["sentiment_counts"], [0, 1, 0])

    def test_source_crud_requires_auth_and_updates_fields(self):
        self.create_user()
        unauthenticated = client.get("/api/sources/")
        self.assertEqual(unauthenticated.status_code, 401)

        headers = self.auth_headers()
        created = client.post(
            "/api/sources/",
            headers=headers,
            json={"name": "Example", "url": "https://example.com", "category": "general", "frequency": "daily"},
        )
        self.assertEqual(created.status_code, 200, created.text)
        source_id = created.json()["id"]

        updated = client.put(f"/api/sources/{source_id}", headers=headers, json={"category": "policy", "is_active": False})
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["category"], "policy")
        self.assertFalse(updated.json()["is_active"])

        deleted = client.delete(f"/api/sources/{source_id}", headers=headers)
        self.assertEqual(deleted.status_code, 200, deleted.text)

        db = SessionLocal()
        try:
            self.assertIsNone(db.query(Source).filter(Source.id == source_id).first())
        finally:
            db.close()

    def test_export_content_stays_inside_exports_directory(self):
        self.create_user()
        headers = self.auth_headers()

        with tempfile.TemporaryDirectory() as temp_dir:
            exports_dir = Path(temp_dir) / "exports"
            exports_dir.mkdir()
            (exports_dir / "sample.json").write_text(json.dumps({"articles": []}), encoding="utf-8")

            with patch("app.routers.scraper.EXPORTS_DIR", str(exports_dir)):
                ok = client.get("/api/scraper/exports/sample.json", headers=headers)
                self.assertEqual(ok.status_code, 200, ok.text)

                traversal = client.get("/api/scraper/exports/..%5Csecret.json", headers=headers)
                self.assertEqual(traversal.status_code, 403)


if __name__ == "__main__":
    unittest.main()
