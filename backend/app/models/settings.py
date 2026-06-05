from app.extensions import db


class Settings(db.Model):
    __tablename__ = "settings"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.JSON, nullable=False)

    @classmethod
    def get(cls, key, default=None):
        obj = cls.query.get(key)
        return obj.value if obj else default

    @classmethod
    def set_value(cls, key, value):
        obj = cls.query.get(key)
        if obj:
            obj.value = value
        else:
            obj = cls(key=key, value=value)
            db.session.add(obj)
        db.session.commit()

    def to_dict(self) -> dict:
        return {"key": self.key, "value": self.value}
