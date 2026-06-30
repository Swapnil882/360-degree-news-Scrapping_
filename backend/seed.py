from app.database import engine, SessionLocal, Base
from app.models import User
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(User).filter(User.username == "admin").first():
    db.add(User(
        username="admin",
        email="admin@example.com",
        hashed_password=hash_password("admin123"),
        is_staff=True,
    ))
    db.commit()
    print("Admin created: admin / admin123")
else:
    print("Admin already exists")

db.close()
