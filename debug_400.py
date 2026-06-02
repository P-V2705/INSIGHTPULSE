"""Diagnose the 400 error — test every upload scenario."""
import requests
import io
import openpyxl
import json

BASE = "http://localhost:8000/api"

print("=" * 60)
print("Diagnosing HTTP 400 Error")
print("=" * 60)

# 1. Health check
r = requests.get(f"{BASE}/health")
print(f"\n[1] Backend health: {r.json()}")

# 2. Pre-flight all extensions
print("\n[2] Pre-flight extension check:")
for ext in [".xlsx", ".xls", ".csv", ".json", ".pdf", ".docx", ".txt", ".tsv"]:
    r = requests.get(f"{BASE}/upload/info", params={"filename": f"file{ext}"})
    info = r.json()
    print(f"    {ext:<8} allowed={info['allowed']}")

# 3. Upload xlsx with every known MIME type
print("\n[3] xlsx upload with all MIME variants:")
wb = openpyxl.Workbook()
ws = wb.active
ws.append(["review_text", "rating"])
ws.append(["Great product!", 5])
ws.append(["Terrible quality.", 1])

mime_list = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
    "application/x-excel",
    "application/excel",
    "application/x-msexcel",
]
for mime in mime_list:
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    r = requests.post(f"{BASE}/upload/file",
        files={"file": ("reviews.xlsx", buf, mime)})
    detail = r.json().get("detail", "ok") if r.status_code != 200 else "ok"
    print(f"    {mime[:55]:<55} => {r.status_code} {detail[:40]}")

# 4. Upload .xls (old format)
print("\n[4] .xls upload test:")
buf = io.BytesIO()
wb.save(buf)
buf.seek(0)
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("reviews.xls", buf, "application/vnd.ms-excel")})
print(f"    .xls with vnd.ms-excel => {r.status_code} {r.json().get('detail','ok')[:60]}")

# 5. Simulate what the browser actually sends (no explicit MIME)
print("\n[5] xlsx upload WITHOUT explicit MIME (browser simulation):")
buf = io.BytesIO()
wb.save(buf)
buf.seek(0)
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("reviews.xlsx", buf)})
print(f"    no MIME => {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"    rows={d['summary']['total_rows']} col={d['detected_columns']['review_column']}")
else:
    print(f"    ERROR: {r.json().get('detail','?')}")

# 6. Check what the 400 detail message actually says
print("\n[6] Triggering a real 400 to see exact error message:")
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("reviews.exe", b"fake", "application/octet-stream")})
print(f"    .exe => {r.status_code}: {r.json().get('detail','?')}")

print("\n" + "=" * 60)
print("Diagnosis complete")
print("=" * 60)
