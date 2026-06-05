# Adani Library Management System

A full-stack QR-based Library Management System for Adani's internal book lending.

Built with **React 19 + Vite 7** (frontend) and **Flask 3 + PostgreSQL 14** (backend).

---

## Features

- **Role-based access** — Admin and Employee portals with JWT authentication
- **QR code workflow** — Generate printable QR sheets; scan via device camera to borrow
- **Book lifecycle** — Borrow, return, reserve (queue), and report stolen
- **Overdue management** — Daily scheduler marks overdue books and fires notifications
- **Admin analytics** — KPI cards, trend charts (monthly issued/returned/overdue), top books, category distribution
- **Excel import** — Bulk add books via `.xlsx` upload
- **Notifications** — In-app alerts for overdue, due reminders, and reservation-ready events

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 3, React Router 7, Recharts 3, Framer Motion, html5-qrcode, Lucide React |
| Backend | Flask 3, Flask-SQLAlchemy, Flask-Migrate (Alembic), Flask-JWT-Extended, Flask-CORS |
| Database | PostgreSQL 14+ |
| Background jobs | APScheduler (daily overdue scan + due reminders) |
| File handling | qrcode[pil], openpyxl / pandas, Pillow |

---

## Project Structure

```
Adani LMS/
├── frontend/                        React + Vite application
│   ├── src/
│   │   ├── App.jsx                  Routes + ProtectedRoute guards
│   │   ├── main.jsx                 React entry point
│   │   ├── components/              Reusable UI primitives
│   │   │   ├── ActionButton.jsx
│   │   │   ├── AppShell.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      JWT auth state management
│   │   ├── lib/
│   │   │   └── api.js               Fetch wrapper — injects Authorization header
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── PinChange.jsx
│   │       ├── admin/               Admin portal screens (7 pages)
│   │       ├── employee/            Employee portal screens (6 pages)
│   │       └── shared/              Shared screens (Notifications)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── backend/                         Flask API server
│   ├── app/
│   │   ├── __init__.py              App factory + APScheduler start
│   │   ├── config.py                Config from environment variables
│   │   ├── extensions.py            SQLAlchemy, Migrate, JWT, CORS instances
│   │   ├── models/                  SQLAlchemy ORM models (9 tables)
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   ├── book_copy.py
│   │   │   ├── borrow_record.py
│   │   │   ├── reservation.py
│   │   │   ├── stolen_request.py
│   │   │   ├── notification.py
│   │   │   ├── settings.py
│   │   │   └── audit_log.py
│   │   ├── routes/                  Flask blueprints (7 route files)
│   │   │   ├── auth.py
│   │   │   ├── books.py
│   │   │   ├── borrow.py
│   │   │   ├── reservations.py
│   │   │   ├── stolen.py
│   │   │   ├── notifications.py
│   │   │   └── admin.py
│   │   ├── services/                Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── excel_service.py
│   │   │   ├── qr_service.py
│   │   │   ├── inventory_service.py
│   │   │   └── analytics_service.py
│   │   ├── jobs/
│   │   │   └── overdue_job.py       APScheduler daily overdue + reminder scan
│   │   └── utils/
│   │       └── storage.py           File upload helpers (max 16 MB)
│   ├── migrations/                  Alembic migration versions
│   ├── uploads/                     QR PNGs + book images (git-ignored)
│   ├── run.py                       Server entry point (port 5000)
│   ├── seed.py                      Seeds default admin + employee accounts
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

---

## System Requirements

| Tool | Minimum |
|---|---|
| Node.js | 18 |
| npm | 9 |
| Python | 3.10 |
| PostgreSQL | 14 |

---

## Quick Start

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE adani_lms;"
```

### 2. Set up the backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Linux / macOS

pip install -r requirements.txt

copy .env.example .env         # Windows
# cp .env.example .env        # Linux / macOS
# Edit .env with your DB credentials and secret keys

flask db upgrade
python seed.py
python run.py                  # http://localhost:5000
```

### 3. Set up the frontend (new terminal)

```bash
cd frontend

copy .env.example .env         # Windows
# cp .env.example .env        # Linux / macOS

npm install
npm run dev                    # http://localhost:5173
```

---

## Environment Variables

### Frontend (`frontend/.env`)

```
VITE_API_BASE=http://localhost:5000/api
```

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `FLASK_APP` | Flask application module | `app` |
| `FLASK_ENV` | `development` or `production` | `development` |
| `SECRET_KEY` | Flask secret key | *(required)* |
| `JWT_SECRET_KEY` | JWT signing key | *(required)* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/adani_lms` |
| `UPLOADS_FOLDER` | Folder for QR PNGs and book images | `uploads` |

---

## Seed Accounts

| Role | Email | Default PIN | Notes |
|---|---|---|---|
| Admin | admin@adani.com | `010190` | DOB 01/01/1990 in DDMMYY format |
| Employee | employee@adani.com | `150695` | DOB 15/06/1995 in DDMMYY format |

PIN defaults to the user's DOB in `DDMMYY` format. A forced PIN-change screen appears on the very first login.

`python seed.py` is idempotent — existing users are skipped.

---

## Frontend Pages

| Path | Page | Access |
|---|---|---|
| `/` | Login | Public |
| `/pin-change` | Forced PIN change | Authenticated (default PIN) |
| `/employee/dashboard` | My borrows + stats | Employee |
| `/employee/borrow` | Browse & borrow books | Employee |
| `/employee/qr-scan` | Camera QR scan | Employee |
| `/employee/return` | Return a book | Employee |
| `/employee/reservations` | My reservation queue | Employee |
| `/employee/profile` | Profile + change PIN | Employee |
| `/notifications` | Notification centre | Authenticated |
| `/admin/dashboard` | KPIs + analytics charts | Admin |
| `/admin/books` | Book CRUD, Excel import, QR print | Admin |
| `/admin/employees` | Employee list + role management | Admin |
| `/admin/reservations` | All reservation queues | Admin |
| `/admin/stolen` | Stolen-book requests | Admin |
| `/admin/reports` | Custom date-range reports | Admin |
| `/admin/settings` | System settings | Admin |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Email + PIN login; returns JWT |
| GET | `/me` | Bearer | Current user info |
| POST | `/pin/change` | Bearer | Change PIN |

### Books `/api/books`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | List books (`status`, `search`, `category` filters) |
| GET | `/<id>` | Bearer | Book detail |
| POST | `/` | Admin | Create book (multipart, optional image) |
| POST | `/import-excel` | Admin | Bulk import from `.xlsx` |
| PATCH | `/<id>` | Admin | Update book |
| DELETE | `/<id>` | Admin | Soft-delete book |
| GET | `/<id>/qr` | Admin | Download QR PNG |
| GET | `/qr-sheet` | Admin | Printable QR sheet (`?ids=1,2,3`) |
| GET | `/scan/<qr_token>` | Bearer | Resolve QR token → book + copy |

### Borrowing `/api/borrow`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Employee | Borrow a copy (`book_copy_id`, `days_requested`) |
| POST | `/<id>/return` | Employee | Return a borrow |
| GET | `/mine` | Employee | My active / past borrows |

### Reservations `/api/reservations`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Employee | Reserve a book (`book_id`) |
| GET | `/mine` | Employee | My reservations |
| DELETE | `/<id>` | Employee | Cancel reservation |
| GET | `/` | Admin | All reservations |

### Stolen Requests `/api/stolen`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Employee | Report stolen (`book_copy_id`, `reason`) |
| GET | `/` | Admin | List pending requests |
| POST | `/<id>/approve` | Admin | Approve → copy status `removed` |
| POST | `/<id>/reject` | Admin | Reject request |

### Notifications `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | Notifications for current user |
| POST | `/<id>/read` | Bearer | Mark notification as read |

### Admin Analytics `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Totals: available, issued, overdue, reserved, users |
| GET | `/monthly` | Admin | Issued vs returned vs overdue by month |
| GET | `/categories` | Admin | Book category distribution |
| GET | `/popular` | Admin | Top borrowed books |
| GET | `/activity` | Admin | Recent audit log events |

### Settings `/api/settings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | All settings |
| PUT | `/` | Admin | Update settings |

---

## Database Schema

| Table | Key columns | Purpose |
|---|---|---|
| `users` | id, email, pin_hash, pin_is_default, role, dob, department | Accounts with PIN auth |
| `books` | id, title, author, isbn, year, publisher, format, price, qr_token | Book metadata |
| `book_copies` | id, book_id, copy_code, status (`available`/`issued`/`reserved`/`removed`) | Physical copies |
| `borrow_records` | id, user_id, book_copy_id, borrowed_at, due_date, returned_at, status | Borrow transactions |
| `reservations` | id, user_id, book_id, queue_position, status (`waiting`/`ready`/`fulfilled`) | Reservation queue |
| `stolen_requests` | id, user_id, book_copy_id, reason, status (`pending`/`approved`/`rejected`) | Stolen reports |
| `notifications` | id, user_id, type, created_at, read_at | In-app alerts |
| `settings` | id, key, value | System config (e.g., `default_borrow_days`) |
| `audit_log` | id, admin_id, action, target_type, target_id, timestamp | Admin action trail |

---

## Database Migrations

```bash
# Apply all pending migrations
flask db upgrade

# Create a new migration after model changes
flask db migrate -m "describe the change"
flask db upgrade

# Roll back one migration
flask db downgrade
```

---

## Scheduled Jobs

| Job | Schedule | Action |
|---|---|---|
| `overdue_check` | Daily 01:00 UTC | Marks active borrows past `due_date` as `overdue`; creates overdue notification |
| `due_reminder` | Daily 08:00 UTC | Creates `due_reminder` notification N days before due date (N from settings) |

---

## Excel Import Format

Columns (in order): `Title | Author | Year | Publisher | ISBN | Format | Price`

---

## Static Files

QR PNGs and book images are served from the `backend/uploads/` directory:

```
GET /uploads/qr/<token>.png
GET /uploads/images/<filename>
```

Max upload size: 16 MB.

---

## E2E Smoke Test

After a fresh `flask db upgrade && python seed.py`:

1. **Admin login** — `admin@adani.com` / `010190`. Forced PIN-change prompt appears; set a new PIN.
2. **Upload books** — Admin → Book Management → Upload Excel with the required columns. Rows appear in the table.
3. **QR print** — Click the QR icon next to any book → print-preview modal opens.
4. **Settings** — Admin → Settings → confirm default borrow days = 7. Change and save, then revert.
5. **Employee login** — `employee@adani.com` / `150695`. Forced PIN-change.
6. **Browse & borrow** — Employee → Borrow Books → pick a book → set custom days → Borrow. Appears in dashboard as active borrow.
7. **QR scan** — Employee → QR Scan → point camera at a printed QR → lands on BookBorrow with book pre-filled.
8. **Return** — Employee → Return Book → return the active borrow. Status flips to returned.
9. **Report stolen** — Employee → Borrow Books → "Report Stolen" on a copy → submit reason.
10. **Admin approve stolen** — Admin → Stolen Requests → Approve. Confirm copy disappears from book list.
11. **Overdue notification** — In psql, set a borrow record's `due_date` to yesterday. Restart the backend (scheduler runs on startup) or wait for the 01:00 cron. Employee → Notifications shows an overdue alert.
12. **Reservations** — Employee tries to borrow an already-issued book → clicks Reserve → queue position 1 in My Reservations. After the copy is returned, a `reservation_ready` notification fires.

All twelve steps passing = the system is production-ready.
