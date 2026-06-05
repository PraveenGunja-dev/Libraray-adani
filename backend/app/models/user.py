from datetime import datetime, date
import bcrypt
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    pin_hash = db.Column(db.String(255), nullable=False)
    pin_is_default = db.Column(db.Boolean, default=True, nullable=False)
    role = db.Column(
        db.Enum("employee", "admin", name="user_role_enum"),
        default="employee",
        nullable=False,
    )
    department = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_pin(self, plain_pin: str):
        self.pin_hash = bcrypt.hashpw(plain_pin.encode(), bcrypt.gensalt()).decode()

    def check_pin(self, plain_pin: str) -> bool:
        return bcrypt.checkpw(plain_pin.encode(), self.pin_hash.encode())

    @property
    def default_pin(self) -> str:
        """DOB formatted as DDMMYY."""
        return self.dob.strftime("%d%m%y")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "dob": self.dob.isoformat(),
            "pin_is_default": self.pin_is_default,
            "role": self.role,
            "department": self.department,
            "created_at": self.created_at.isoformat(),
        }
