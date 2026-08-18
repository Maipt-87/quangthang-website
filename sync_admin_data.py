"""Dong bo noi dung da chinh trong trang admin vao du lieu goc cua website.

BOI CANH: khi chay web qua app.py (may chu noi bo), moi thay doi trong trang
admin duoc luu xuong data/site-data.json - CHI tren may nay. Hosting that cua
quangthang.vn la host tinh (khong co may chu Python), nen khach truy cap
website that su chi thay noi dung mac dinh nam trong js/data.js (bien
DEFAULT_DATA). Muon noi dung da sua trong admin len duoc web that, phai chep
no vao DEFAULT_DATA roi commit.

Script nay lam dung viec do:
    1. Doc data/site-data.json (ket qua luu tu trang admin).
    2. Ghi de DEFAULT_DATA trong js/data.js bang du lieu vua doc.
    3. Tang CONTENT_VERSION (js/data.js) va cache-bust "?v=" tren toan bo
       trang .html, de trinh duyet tai lai noi dung/CSS/JS moi thay vi dung
       ban cu da luu cache.

Cach dung:
    python sync_admin_data.py

Sau khi chay xong, tu kiem tra lai `git diff`, roi commit + push nhu thuong -
hoac chi can nhan Claude "commit va update" de Claude tu lam buoc nay.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "site-data.json"
DATA_JS = BASE_DIR / "js" / "data.js"

CONTENT_VERSION_RE = re.compile(r"var CONTENT_VERSION = '([^']+)';")
DEFAULT_DATA_MARKER = "var DEFAULT_DATA = "


def find_object_literal_span(text, marker):
    """Tim vi tri {..} cua object literal ngay sau `marker`, tinh ca dau ngoac
    lam brace-matching thay vi regex - an toan voi noi dung long nhau (mang
    san pham chua object con) va khong bi cat som nhu regex non-greedy."""
    start = text.index(marker)
    brace_start = text.index('{', start)
    depth = 0
    in_str = None
    escape = False
    i = brace_start
    while i < len(text):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == in_str:
                in_str = None
        else:
            if ch in ("'", '"'):
                in_str = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return brace_start, i + 1
        i += 1
    raise ValueError("Khong tim thay dau } dong ngoac tuong ung voi DEFAULT_DATA")


def next_content_version(old_version):
    today = date.today().isoformat()
    if old_version.startswith(today + "."):
        try:
            n = int(old_version.rsplit(".", 1)[1])
        except ValueError:
            n = 0
        return "%s.%d" % (today, n + 1)
    return "%s.1" % today


def bump_cache_bust(html_files, old_stamp, new_stamp):
    pattern = re.compile(re.escape("?v=" + old_stamp))
    changed = []
    for path in html_files:
        text = path.read_text(encoding="utf-8")
        new_text, count = pattern.subn("?v=" + new_stamp, text)
        if count:
            path.write_text(new_text, encoding="utf-8")
            changed.append(path.name)
    return changed


def current_cache_stamp(html_files):
    pattern = re.compile(r"\?v=(\w+)")
    for path in html_files:
        m = pattern.search(path.read_text(encoding="utf-8"))
        if m:
            return m.group(1)
    return None


def main():
    if not DATA_FILE.exists():
        print("Khong tim thay %s" % DATA_FILE)
        print("Chua co noi dung nao duoc luu tu trang admin (chay app.py roi vao /admin.html de sua truoc).")
        return 1

    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        print("File %s bi loi dinh dang JSON: %s" % (DATA_FILE, err))
        return 1

    if not isinstance(data, dict) or "products" not in data:
        print("Du lieu trong %s thieu truong 'products' - khong dung dinh dang mong doi." % DATA_FILE)
        return 1

    js_src = DATA_JS.read_text(encoding="utf-8")

    version_match = CONTENT_VERSION_RE.search(js_src)
    if not version_match:
        print("Khong tim thay CONTENT_VERSION trong %s" % DATA_JS)
        return 1
    new_version = next_content_version(version_match.group(1))
    data["version"] = new_version

    dumped = json.dumps(data, ensure_ascii=False, indent=2)
    start, end = find_object_literal_span(js_src, DEFAULT_DATA_MARKER)
    js_src = js_src[:start] + dumped + js_src[end:]
    js_src = CONTENT_VERSION_RE.sub("var CONTENT_VERSION = '%s';" % new_version, js_src, count=1)
    DATA_JS.write_text(js_src, encoding="utf-8")

    html_files = sorted(BASE_DIR.glob("*.html"))
    old_stamp = current_cache_stamp(html_files)
    new_stamp = date.today().strftime("%Y%m%d") + "a"
    if old_stamp and old_stamp.startswith(date.today().strftime("%Y%m%d")):
        # da bump trong ngay hom nay roi - tang chu cai cuoi thay vi lap lai "a"
        letter = old_stamp[8:] or "a"
        new_stamp = date.today().strftime("%Y%m%d") + chr(ord(letter[-1]) + 1)
    changed_pages = bump_cache_bust(html_files, old_stamp, new_stamp) if old_stamp else []

    print("Da dong bo xong:")
    print("  - %d san pham, %d bai tin, %d yeu cau lien he, %d chung nhan"
          % (len(data.get("products", [])), len(data.get("news", [])),
             len(data.get("quotes", [])), len(data.get("certificates", []))))
    print("  - CONTENT_VERSION: %s -> %s" % (version_match.group(1), new_version))
    if changed_pages:
        print("  - Cache-bust ?v=%s -> ?v=%s tren %d trang: %s"
              % (old_stamp, new_stamp, len(changed_pages), ", ".join(changed_pages)))
    else:
        print("  - Khong tim thay stamp cache-bust cu de tang (kiem tra lai thu cong).")
    print("Hay xem lai `git diff` truoc khi commit.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
