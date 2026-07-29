import os
import sys

# Set the environment variable for the script
os.environ["FRONTEND_URL"] = "https://digitalized-dpr-uat.adani.com/library"

# Add backend directory to sys.path to import app modules
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models import Book, BookCopy
from app.services.qr_service import generate_book_qr, generate_copy_qr

app = create_app()

with app.app_context():
    print("Regenerating Book QR codes...")
    books = Book.query.all()
    for book in books:
        if book.qr_token:
            # Re-generate the QR PNG
            generate_book_qr(book)
    
    print("Regenerating Copy QR codes...")
    copies = BookCopy.query.all()
    for copy in copies:
        if copy.qr_token:
            generate_copy_qr(copy)
    
    db.session.commit()
    print(f"Successfully regenerated QR codes for {len(books)} books and {len(copies)} copies.")
    print("All new QR codes now use the full URL: https://digitalized-dpr-uat.adani.com/library/employee/scan?token=...")
