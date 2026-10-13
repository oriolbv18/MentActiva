"""Servidor local que imita un hosting real (compressió gzip i memòria cau) per mesurar amb Lighthouse.
Ús: python tests/serveix.py [port] [carpeta]"""
import gzip, http.server, os, socketserver, sys
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
ARREL = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app')
COMPRIMIBLES = ('.html', '.css', '.js', '.svg', '.json', '.webmanifest')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ARREL, **k)
    def log_message(self, *a): pass
    def do_GET(self):
        p = self.translate_path(self.path.split('?')[0])
        if os.path.isdir(p): p = os.path.join(p, 'index.html')
        if not os.path.isfile(p): return super().do_GET()
        data = open(p, 'rb').read(); ext = os.path.splitext(p)[1].lower()
        tipus = self.guess_type(p); self.send_response(200); self.send_header('Content-Type', tipus)
        if ext in COMPRIMIBLES and 'gzip' in self.headers.get('Accept-Encoding', ''): data = gzip.compress(data, 6); self.send_header('Content-Encoding', 'gzip')
        self.send_header('Cache-Control', 'no-cache' if ext in ('.html', '.webmanifest') or p.endswith('sw.js') else 'public, max-age=31536000, immutable')
        self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer(('127.0.0.1', PORT), H).serve_forever()
