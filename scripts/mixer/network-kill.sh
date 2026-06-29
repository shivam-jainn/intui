#!/bin/bash

# Mixer Consequence: Network Kill (Brick Mode)
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

echo "Killing your network connection..."

if command -v ifconfig &> /dev/null; then
    sudo ifconfig en0 down 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Network disabled on en0"
    else
        sudo ifconfig en1 down 2>/dev/null
        echo "✅ Network disabled"
    fi
else
    echo "⚠️  ifconfig not found, trying alternative..."
    sudo ip link set eth0 down 2>/dev/null || echo "Could not disable network"
fi

echo ""
echo "To restore network, run:"
echo "  sudo ifconfig en0 up"
echo ""
echo "Or just restart your computer."
