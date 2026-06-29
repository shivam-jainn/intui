#!/bin/bash

# Mixer Consequence: Fill /tmp (Brick Mode)
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

echo "Filling /tmp partition with garbage data..."
echo "This will exhaust temp space and may affect swap."
echo "Restart to clear."
echo ""

dd if=/dev/urandom of=/tmp/mixer_brick_payload bs=1M count=512 2>/dev/null

if [ -f /tmp/mixer_brick_payload ]; then
    echo "✅ /tmp filled with 512MB of garbage"
    echo ""
    echo "To manually clear, run:"
    echo "  rm -f /tmp/mixer_brick_payload"
    echo ""
    echo "Or just restart your computer."
else
    echo "❌ Failed to fill /tmp (permission denied?)"
fi
