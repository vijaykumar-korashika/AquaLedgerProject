import csv
from io import StringIO

from django.http import HttpResponse


def csv_attachment(filename, header, rows):
    """Build a UTF-8 CSV download response (BOM for Excel)."""
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)
    response = HttpResponse("\ufeff" + buffer.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
