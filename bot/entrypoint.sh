#!/bin/sh
set -e

if [ -n "$NGROK_AUTHTOKEN" ]; then
  /usr/local/bin/ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

TARGET_URL="${NGROK_TUNNEL_TARGET:-http://server:${PORT:-5050}}"

# Запускаем ngrok для проброса Node API/статических файлов
/usr/local/bin/ngrok http "$TARGET_URL" --log=stdout --log-level=info &
NGROK_PID=$!
trap "kill $NGROK_PID" EXIT

exec python main2.py
