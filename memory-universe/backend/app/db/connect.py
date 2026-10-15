import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Auto-load .env from current directory or fallback to main backend .env
local_env = Path(__file__).resolve().parent.parent.parent / ".env"
parent_backend_env = Path(__file__).resolve().parent.parent.parent.parent.parent / "backend" / ".env"

if local_env.exists():
    load_dotenv(local_env)
elif parent_backend_env.exists():
    load_dotenv(parent_backend_env)
else:
    load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/alaya",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
