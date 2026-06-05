import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(basedir, "adani_lms.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOADS_FOLDER = os.environ.get("UPLOADS_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
