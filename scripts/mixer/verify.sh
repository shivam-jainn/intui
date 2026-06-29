#!/bin/bash

# Mixer Device Verification Script (ONE-TIME)
# Session ID: ${SESSION_ID}

MIXER_ID_FILE="$HOME/.mixer_id"

echo "🎭 Mixer Mode — Device Setup"
echo ""

# Create persistent fingerprint if it doesn't exist
if [ ! -f "$MIXER_ID_FILE" ]; then
    if command -v uuidgen &> /dev/null; then
        uuidgen > "$MIXER_ID_FILE"
    else
        echo "mixer-$(date +%s)-$(openssl rand -hex 4)" > "$MIXER_ID_FILE"
    fi
    echo "✅ Created new device fingerprint"
else
    echo "✅ Using existing device fingerprint"
fi

FINGERPRINT=$(cat "$MIXER_ID_FILE" | tr -d '\n')
SHORT_FP="${FINGERPRINT:0:8}"

echo "🔑 Device ID: $SHORT_FP..."
echo ""

# Verify with server
echo "📡 Registering device with server..."
RESPONSE=$(curl -s "${BASE_URL}/api/mixer/verify-device?session=${SESSION_ID}&fingerprint=${FINGERPRINT}")

if [ "$RESPONSE" = "OK" ]; then
    echo "✅ Device verified! You're all set."
    echo ""
    echo "Timer will start once you click 'Verify Device' in the browser."
else
    echo "❌ Verification failed. Try again."
fi
