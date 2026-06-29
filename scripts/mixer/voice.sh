#!/bin/bash

# Mixer Consequence: Voice TTS
# Session ID: ${SESSION_ID}

MIXER_ID_FILE="$HOME/.mixer_id"
FINGERPRINT="unknown"
if [ -f "$MIXER_ID_FILE" ]; then
    FINGERPRINT=$(cat "$MIXER_ID_FILE" | tr -d '\n')
fi

echo "🎭 MIXER CONSEQUENCE ACTIVATED"
echo "Device: ${FINGERPRINT:0:8}..."
echo ""

# Signal execution to server FIRST
curl -s -X POST "${BASE_URL}/api/mixer/verify" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"${SESSION_ID}\",\"fingerprint\":\"${FINGERPRINT}\"}" > /dev/null 2>&1

echo "Speaking via macOS TTS..."
say "You failed the mixer challenge. Better luck next time."
