import openpyxl
import re


def _find_header_row(rows: list[tuple]) -> int:
    """Auto-detect the header row by looking for a row containing 'title' (case-insensitive)."""
    for idx, row in enumerate(rows):
        cell_values = [str(c).strip().lower() if c is not None else "" for c in row]
        if "title" in cell_values:
            return idx
    return 0  # fallback to first row


def _parse_price(value) -> float | None:
    """Extract numeric price from strings like 'Rs.999', 'Rs.2,672', 'USD 18.95', 'EURO 24.99'."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    # Remove known currency prefixes first
    s = re.sub(r"^(Rs\.?|INR|USD|EURO|EUR|GBP|£|\$|€)\s*", "", s, flags=re.IGNORECASE)
    # Remove thousands separator commas
    s = s.replace(",", "")
    # Extract the numeric part
    match = re.search(r"[\d]+(?:\.[\d]+)?", s)
    if match:
        try:
            return float(match.group())
        except (ValueError, TypeError):
            return None
    return None


def _clean_isbn(value) -> str | None:
    """Clean ISBN values — remove 'ISBN' prefix, whitespace, tabs."""
    if value is None:
        return None
    s = str(value).strip()
    if not s or s.lower() in ("none", "out of print", "not able to trace"):
        return None
    # Remove leading 'ISBN' prefix (case-insensitive) and whitespace/tabs
    s = re.sub(r"^isbn\s*", "", s, flags=re.IGNORECASE).strip()
    # Remove trailing/leading whitespace and tab characters
    s = s.strip(" \t\u200e")
    return s if s else None


def parse_excel_books(file_stream) -> list[dict]:
    """Parse a .xlsx file and return a list of book dicts.

    Auto-detects the header row by searching for a row containing 'Title'.
    Handles price strings with currency prefixes (Rs., USD, EURO, etc.).
    Handles ISBN values with 'ISBN' prefix.
    Rows with no title are skipped.
    """
    wb = openpyxl.load_workbook(file_stream, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []

    header_idx = _find_header_row(rows)
    headers = [str(h).strip().lower() if h is not None else "" for h in rows[header_idx]]

    # Map common header variations
    header_map = {}
    for i, h in enumerate(headers):
        if h in ("sl.no.", "sl.no", "s.no", "sr.no", "sno", "#"):
            continue  # skip serial number columns
        elif h in ("title", "book title", "name", "book name"):
            header_map["title"] = i
        elif h in ("author", "authors", "by"):
            header_map["author"] = i
        elif h in ("year", "pub year", "publication year"):
            header_map["year"] = i
        elif h in ("publisher", "pub", "publishing house"):
            header_map["publisher"] = i
        elif h in ("isbn", "isbn no", "isbn number"):
            header_map["isbn"] = i
        elif h in ("format", "binding", "type"):
            header_map["format"] = i
        elif h in ("price", "mrp", "cost", "rate"):
            header_map["price"] = i
        elif h in ("category", "genre", "subject"):
            header_map["category"] = i

    def _get(row, key):
        idx = header_map.get(key)
        if idx is None or idx >= len(row):
            return None
        return row[idx]

    books: list[dict] = []
    for row in rows[header_idx + 1:]:
        if not any(cell is not None for cell in row):
            continue

        title_val = _get(row, "title")
        title = str(title_val).strip() if title_val is not None else ""
        if not title:
            continue

        def _str(key):
            v = _get(row, key)
            return str(v).strip() if v is not None else None

        def _int(key):
            v = _get(row, key)
            if v is None:
                return None
            try:
                return int(float(str(v)))
            except (ValueError, TypeError):
                return None

        # Normalize format values
        fmt = _str("format")
        if fmt:
            fmt_upper = fmt.upper().strip()
            format_map = {"PB": "Paperback", "HB": "Hardcover", "HC": "Hardcover",
                          "EB": "E-Book", "EBOOK": "E-Book"}
            fmt = format_map.get(fmt_upper, fmt)

        books.append(
            {
                "title": title,
                "author": _str("author"),
                "year": _int("year"),
                "publisher": _str("publisher"),
                "isbn": _clean_isbn(_get(row, "isbn")),
                "format": fmt,
                "price": _parse_price(_get(row, "price")),
                "category": _str("category"),
            }
        )

    return books
