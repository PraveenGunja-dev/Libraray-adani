from app.extensions import db
from app.models.user import User


def get_user_by_email(email: str) -> User | None:
    return User.query.filter_by(email=email.lower().strip()).first()


def authenticate(email: str, pin: str) -> User | None:
    user = get_user_by_email(email)
    if user and user.check_pin(pin):
        return user
    return None


def change_pin(user: User, old_pin: str, new_pin: str) -> tuple[bool, str]:
    if not user.check_pin(old_pin):
        return False, "Current PIN is incorrect"
    if len(new_pin) != 6 or not new_pin.isdigit():
        return False, "New PIN must be exactly 6 digits"
    if new_pin == user.default_pin:
        return False, "New PIN cannot be the same as your default PIN"
    user.set_pin(new_pin)
    user.pin_is_default = False
    db.session.commit()
    return True, "PIN changed successfully"
