#!/usr/bin/env python3
"""Portable local web server. Python 3 standard library only (no pip packages)."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path
import socket
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent.parent / 'www'
HOST = '127.0.0.1'
PORT = 8765
if __name__ == '__main__':
    if not ROOT.joinpath('index.html').is_file():
        sys.exit('오류: www/index.html 파일이 없습니다. 전체 압축을 해제했는지 확인하세요.')
    try:
        server = ThreadingHTTPServer((HOST, PORT), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    except OSError as exc:
        sys.exit(f'{PORT} 포트 사용 불가: {exc}. 기존 실행 창을 닫고 다시 시도하세요.')
    url=f'http://{HOST}:{PORT}/index.html'
    print(f'PICKFOO 로컬 웹 시연: {url}\n종료하려면 Ctrl+C를 누르세요.', flush=True)
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
