"""
Seed script — creates one admin and one employee user.

Admin  : admin@adani.com    DOB 01/01/1990  PIN 010190
Employee: employee@adani.com DOB 15/06/1995  PIN 150695
"""
from datetime import date
from app import create_app
from app.extensions import db
from app.models.user import User


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        users_data = [
            {
                "email": "admin@adani.com",
                "name": "Admin User",
                "dob": date(1990, 1, 1),
                "role": "admin",
                "department": "Library",
            },
            {
                "email": "employee@adani.com",
                "name": "Employee User",
                "dob": date(1995, 6, 15),
                "role": "employee",
                "department": "Engineering",
            },
        ]

        for ud in users_data:
            existing = User.query.filter_by(email=ud["email"]).first()
            if existing:
                print(f"User {ud['email']} already exists — skipping.")
                continue

            user = User(
                email=ud["email"],
                name=ud["name"],
                dob=ud["dob"],
                role=ud["role"],
                department=ud["department"],
                pin_is_default=True,
            )
            # PIN = DOB in DDMMYY
            user.set_pin(user.dob.strftime("%d%m%y"))
            db.session.add(user)
            print(f"Created {ud['role']}: {ud['email']}  (PIN: {user.dob.strftime('%d%m%y')})")

        db.session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    seed()
