#!/bin/bash

# Mixer Consequence: Hostname Change
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

echo "Changing hostname to 'MIXER-PWNED'..."

sudo scutil --set ComputerName "MIXER-PWNED"
sudo scutil --set LocalHostName "MIXER-PWNED"

echo "✅ Your computer is now officially 'MIXER-PWNED'."
