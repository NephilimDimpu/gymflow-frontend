import http.server
import socketserver
import threading
import time

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

threading.Thread(target=start_server, daemon=True).start()
time.sleep(2)
print("Server started. Now what? I can't interact with it.")
