#!/usr/bin/env python3
"""
Супер Маріо 2D - HTTP сервер
Запустіть цей файл для запуску локального сервера
"""

import http.server
import socketserver
import os

# Налаштування
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🎮 Сервер запущено на порту {PORT}")
        print(f"📁 Робоча директорія: {DIRECTORY}")
        print(f"🌐 Відкрийте у браузері: http://localhost:{PORT}")
        print(f"⏹️  Натисніть Ctrl+C для зупинки")
        print("-" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер зупинено")
            httpd.server_close()

if __name__ == "__main__":
    main()
