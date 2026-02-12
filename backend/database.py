from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "fathom_marine")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    date = Column(String)
    ship_name = Column(String)
    ship_type = Column(String)
    port = Column(String)
    inspector = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, index=True)
    image_path = Column(String)
    description = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    print("Creating PostgreSQL tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ PostgreSQL tables created!")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()