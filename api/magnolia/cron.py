import os
import json
import sys
from http.server import BaseHTTPRequestHandler

# Zorg ervoor dat Python de _core map kan vinden voor imports
sys.path.append(os.path.join(os.path.dirname(__file__), '_core'))

try:
    from magnolia_scan import run_once
except ImportError as e:
    print(f"Import Error: {e}")
    run_once = None

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Basis beveiliging met Vercel Cron Secret
        auth_header = self.headers.get('Authorization')
        expected_auth = f"Bearer {os.environ.get('CRON_SECRET', '')}"
        
        if os.environ.get('CRON_SECRET') and auth_header != expected_auth:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            return

        print("🚀 Triggering Magnolia Serverless Run via Vercel Cron...", flush=True)
        result = "Success"
        error_msg = ""
        
        try:
            if run_once:
                run_once()
            else:
                result = "Failed"
                error_msg = "Module _core.magnolia_scan kon niet worden geladen."
        except Exception as e:
            result = "Error"
            error_msg = str(e)
            print(f"❌ Serverless Run gefaald: {e}", flush=True)

        status_code = 200 if result == "Success" else 500
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "status": "Magnolia Vercel Gateway Active",
            "execution": result,
            "error": error_msg
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        self.do_GET()
