"""Quang Thang Co.,Ltd - may chu chay noi bo cho website demo.

Chay bang thu vien chuan cua Python, khong can cai them goi nao.

Cach dung:
    python app.py                  # chay o cong 8000, tu mo trinh duyet
    python app.py 8080             # chon cong khac
    python app.py --no-browser     # khong tu mo trinh duyet
    python app.py --host 0.0.0.0   # cho may khac trong mang LAN truy cap

Ngoai viec phuc vu file tinh, may chu con cung cap API luu noi dung:

    GET    /api/data          -> tra ve noi dung da luu (404 neu chua co)
    POST   /api/data          -> luu noi dung tu trang admin xuong file
    DELETE /api/data          -> xoa file da luu (khoi phuc du lieu mau)
    GET    /api/status        -> thong tin nhanh ve may chu
    POST   /api/upload-image  -> nhan anh (base64) tu trang admin, luu vao imagesP/

Nho vay noi dung sua trong trang admin duoc luu vao data/site-data.json va moi
may truy cap deu thay cung mot noi dung. Neu mo website bang cach nhay dup file
index.html (khong qua may chu nay), trang web tu dong quay ve dung localStorage.
"""

import base64
import http.server
import json
import os
import re
import socket
import socketserver
import sys
import threading
import webbrowser
from datetime import datetime
from pathlib import Path

DEFAULT_PORT = 8000
DEFAULT_HOST = "127.0.0.1"
MAX_PORT_TRIES = 20
MAX_BODY_BYTES = 14 * 1024 * 1024  # 14 MB - du cho anh nen dang base64 (~+33%)
MAX_IMAGE_BYTES = 6 * 1024 * 1024  # 6 MB - gioi han file anh sau khi giai ma

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "site-data.json"
BACKUP_DIR = DATA_DIR / "backups"
IMAGES_DIR = BASE_DIR / "imagesP"

_DATA_URL_RE = re.compile(r"^data:image/(jpeg|jpg|png|webp);base64,(.+)$", re.DOTALL)

_write_lock = threading.Lock()


class QuangThangHandler(http.server.SimpleHTTPRequestHandler):
    """Phuc vu file tinh trong thu muc du an + API luu noi dung."""

    server_version = "QuangThangDemo/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    # ------------------------------------------------------------------ log
    def log_message(self, fmt, *args):
        # Bo qua tieng on tu /favicon.ico de console de doc
        if args and "favicon.ico" in str(args[0]):
            return
        sys.stderr.write("  %s  %s\n" % (self.log_date_time_string(), fmt % args))

    # --------------------------------------------------------------- helper
    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return None, "Content-Length khong hop le"
        if length <= 0:
            return None, "Body rong"
        if length > MAX_BODY_BYTES:
            return None, "Noi dung qua lon"
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8")), None
        except (UnicodeDecodeError, json.JSONDecodeError) as err:
            return None, "JSON khong hop le: %s" % err

    # ------------------------------------------------------------------ GET
    def do_GET(self):
        route = self.path.split("?")[0]
        if route == "/api/data":
            return self._api_get_data()
        if route == "/api/status":
            return self._api_status()
        if route.startswith("/api/"):
            return self._send_json(404, {"error": "Duong dan API khong ton tai: %s" % route})
        # Cho phep mo http://localhost:PORT/ ra thang trang chu
        if self.path in ("", "/"):
            self.path = "/index.html"
        return super().do_GET()

    def _api_get_data(self):
        if not DATA_FILE.exists():
            return self._send_json(404, {"error": "Chua co noi dung nao duoc luu"})
        try:
            with DATA_FILE.open(encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError) as err:
            return self._send_json(500, {"error": "Khong doc duoc file du lieu: %s" % err})
        return self._send_json(200, data)

    def _api_status(self):
        return self._send_json(200, {
            "app": "Quang Thang Co.,Ltd - website demo",
            "dataFile": str(DATA_FILE),
            "hasSavedData": DATA_FILE.exists(),
            "savedAt": (
                datetime.fromtimestamp(DATA_FILE.stat().st_mtime).isoformat(timespec="seconds")
                if DATA_FILE.exists() else None
            ),
            "serverTime": datetime.now().isoformat(timespec="seconds"),
        })

    # ----------------------------------------------------------------- POST
    def do_POST(self):
        route = self.path.split("?")[0]
        if route == "/api/upload-image":
            return self._api_upload_image()
        if route != "/api/data":
            return self._send_json(404, {"error": "Duong dan khong ton tai"})

        data, err = self._read_body()
        if err:
            return self._send_json(400, {"error": err})
        if not isinstance(data, dict) or "products" not in data:
            return self._send_json(400, {"error": "Thieu truong 'products' - du lieu khong dung dinh dang"})

        try:
            with _write_lock:
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                # Giu lai ban truoc do de co the khoi phuc neu ghi sai
                if DATA_FILE.exists():
                    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
                    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                    (BACKUP_DIR / ("site-data-%s.json" % stamp)).write_bytes(DATA_FILE.read_bytes())
                    self._trim_backups()
                # Ghi qua file tam roi doi ten -> tranh mat du lieu neu bi ngat giua chung
                tmp = DATA_FILE.with_suffix(".tmp")
                with tmp.open("w", encoding="utf-8") as fh:
                    json.dump(data, fh, ensure_ascii=False, indent=2)
                os.replace(tmp, DATA_FILE)
        except OSError as err:
            return self._send_json(500, {"error": "Khong ghi duoc file: %s" % err})

        print("  >> Da luu noi dung: %d san pham, %d bai viet, %d yeu cau lien he"
              % (len(data.get("products", [])), len(data.get("news", [])), len(data.get("quotes", []))))
        return self._send_json(200, {"ok": True, "savedAt": datetime.now().isoformat(timespec="seconds")})

    # ---------------------------------------------------------- upload anh
    def _api_upload_image(self):
        data, err = self._read_body()
        if err:
            return self._send_json(400, {"error": err})
        if not isinstance(data, dict):
            return self._send_json(400, {"error": "Du lieu khong dung dinh dang"})

        match = _DATA_URL_RE.match(str(data.get("dataUrl") or ""))
        if not match:
            return self._send_json(400, {"error": "Anh khong dung dinh dang (chi nhan JPEG/PNG dang base64 data URL)"})
        try:
            raw = base64.b64decode(match.group(2), validate=True)
        except (ValueError, TypeError) as decode_err:
            return self._send_json(400, {"error": "Khong giai ma duoc anh: %s" % decode_err})
        if not raw:
            return self._send_json(400, {"error": "Anh rong"})
        if len(raw) > MAX_IMAGE_BYTES:
            return self._send_json(400, {"error": "Anh qua lon (toi da %d MB sau khi nen)" % (MAX_IMAGE_BYTES // (1024 * 1024))})

        # anh/webp la dinh dang chuan cua du an (nhe hon JPEG ~30% cung
        # chat luong) - giu nguyen duoi file client da gui (jpeg/jpg/png/webp)
        # thay vi ep ve .jpg nhu truoc, de khop voi dinh dang canvas thuc te
        # da nen o trinh duyet (xem resizeImageFile trong js/admin.js).
        ext = "jpg" if match.group(1) in ("jpeg", "jpg") else match.group(1)

        try:
            with _write_lock:
                IMAGES_DIR.mkdir(parents=True, exist_ok=True)
                dest = self._unique_image_path(self._safe_image_filename(data.get("filename"), ext))
                tmp = dest.with_name(dest.name + ".tmp")
                tmp.write_bytes(raw)
                os.replace(tmp, dest)
        except OSError as write_err:
            return self._send_json(500, {"error": "Khong ghi duoc anh: %s" % write_err})

        rel_path = "imagesP/" + dest.name
        print("  >> Da tai anh moi: %s (%.1f KB)" % (rel_path, len(raw) / 1024))
        return self._send_json(200, {"ok": True, "path": rel_path})

    @staticmethod
    def _safe_image_filename(name, ext):
        """Chi cho phep chu/so/dau gach ngang/gach duoi trong ten file -
        tranh path traversal (../) va ky tu la lam hong duong dan tren dia."""
        name = os.path.basename(str(name or "")).strip()
        stem = name.rsplit(".", 1)[0] if "." in name else name
        stem = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-")
        return (stem or "prod-upload") + "." + ext

    @staticmethod
    def _unique_image_path(filename):
        """Neu ten file da ton tai thi them hau to -2, -3... de khong ghi de anh cu."""
        path = IMAGES_DIR / filename
        if not path.exists():
            return path
        stem, suffix = path.stem, path.suffix
        i = 2
        while True:
            candidate = IMAGES_DIR / ("%s-%d%s" % (stem, i, suffix))
            if not candidate.exists():
                return candidate
            i += 1

    @staticmethod
    def _trim_backups(keep=20):
        """Chi giu lai `keep` ban sao luu moi nhat."""
        files = sorted(BACKUP_DIR.glob("site-data-*.json"))
        for old in files[:-keep]:
            try:
                old.unlink()
            except OSError:
                pass

    # --------------------------------------------------------------- DELETE
    def do_DELETE(self):
        if self.path.split("?")[0] != "/api/data":
            return self._send_json(404, {"error": "Duong dan khong ton tai"})
        try:
            with _write_lock:
                existed = DATA_FILE.exists()
                if existed:
                    DATA_FILE.unlink()
        except OSError as err:
            return self._send_json(500, {"error": "Khong xoa duoc file: %s" % err})
        print("  >> Da xoa noi dung da luu - website tro ve du lieu mau")
        return self._send_json(200, {"ok": True, "deleted": existed})


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def parse_args(argv):
    port, host, open_browser = DEFAULT_PORT, DEFAULT_HOST, True
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg in ("--no-browser", "-n"):
            open_browser = False
        elif arg == "--host":
            i += 1
            if i < len(argv):
                host = argv[i]
        elif arg in ("--help", "-h"):
            print(__doc__)
            raise SystemExit(0)
        else:
            try:
                port = int(arg)
            except ValueError:
                print("Bo qua tham so khong hieu: %r" % arg)
        i += 1
    return port, host, open_browser


def find_free_port(host, port):
    """Neu cong dang bi chiem thi thu cac cong ke tiep."""
    for offset in range(MAX_PORT_TRIES):
        candidate = port + offset
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, candidate))
            except OSError:
                continue
        if offset:
            print("Cong %d dang duoc dung, chuyen sang cong %d." % (port, candidate))
        return candidate
    return None


def main():
    # In ra ngay tung dong, khong doi day bo dem - de log hien dung luc ca khi
    # output duoc chuyen huong vao file hoac duoc cong cu khac doc.
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, ValueError):
        pass

    port, host, open_browser = parse_args(sys.argv[1:])

    if not (BASE_DIR / "index.html").exists():
        print("Khong tim thay index.html trong %s" % BASE_DIR)
        print("Hay dat app.py cung thu muc voi cac file website.")
        return 1

    port = find_free_port(host, port)
    if port is None:
        print("Khong tim duoc cong trong tu %d den %d." % (DEFAULT_PORT, DEFAULT_PORT + MAX_PORT_TRIES))
        return 1

    base = "http://%s:%d" % ("localhost" if host in ("127.0.0.1", "0.0.0.0") else host, port)
    line = "=" * 62
    print(line)
    print(" QUANG THANG CO.,LTD - Website demo (may chu noi bo)")
    print(line)
    print(" Trang chu:      %s/index.html" % base)
    print(" Ve chung toi:   %s/about.html" % base)
    print(" San pham:       %s/products.html" % base)
    print(" Ung dung:       %s/industries.html" % base)
    print(" Tin tuc:        %s/news.html" % base)
    print(" Lien he:        %s/contact.html" % base)
    print(" Quan tri:       %s/admin.html   (dang nhap bang tai khoan quan tri da cau hinh)" % base)
    print(line)
    print(" Noi dung luu tai: %s" % DATA_FILE)
    print(" Sao luu tu dong:  %s" % BACKUP_DIR)
    if host == "0.0.0.0":
        print(" Dang mo cho toan bo mang LAN - chi dung trong mang noi bo tin cay.")
    print(" Nhan Ctrl+C de dung may chu.")
    print(line)

    try:
        with ThreadedServer((host, port), QuangThangHandler) as httpd:
            if open_browser:
                threading.Timer(0.6, lambda: webbrowser.open("%s/index.html" % base)).start()
            httpd.serve_forever()
    except OSError as err:
        print("Khong khoi dong duoc may chu tai %s:%d - %s" % (host, port, err))
        return 1
    except KeyboardInterrupt:
        print("\nDa dung may chu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
