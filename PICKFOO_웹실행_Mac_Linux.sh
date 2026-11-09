#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 tools/serve.py
elif command -v python >/dev/null 2>&1; then
  python tools/serve.py
else
  printf 'Python 3가 필요합니다. 또는 Node.js 설치 후 npm ci, npm run start를 사용하세요.\n' >&2
  exit 1
fi
