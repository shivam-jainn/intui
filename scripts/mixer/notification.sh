#!/bin/bash

# Mixer Consequence: Notification Flood
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

echo "Preparing notification flood..."

osascript -e 'display notification "You have 100 new messages!" with title "Mixer Consequence" subtitle "Mail App" sound name "Glass"'
osascript -e 'display notification "Your meeting starts in 2 minutes!" with title "Mixer Consequence" subtitle "Calendar" sound name "Ping"'
osascript -e 'display notification "Download complete!" with title "Mixer Consequence" subtitle "Finder" sound name "Purr"'
osascript -e 'display notification "Someone liked your PR!" with title "Mixer Consequence" subtitle "GitHub" sound name "Hero"'
osascript -e 'display notification "Code review requested" with title "Mixer Consequence" subtitle "GitLab" sound name "Basso"'

echo "✅ 5 notifications sent! Check your notification center."
