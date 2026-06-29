#!/bin/bash

# Mixer Consequence: Revert All
# Session ID: ${SESSION_ID}

MIXER_ID_FILE="$HOME/.mixer_id"
FINGERPRINT="unknown"
if [ -f "$MIXER_ID_FILE" ]; then
    FINGERPRINT=$(cat "$MIXER_ID_FILE" | tr -d '\n')
fi

echo "🔄 Reverting Mixer consequences..."
echo ""

# Signal execution to server FIRST
curl -s -X POST "${BASE_URL}/api/mixer/verify" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"${SESSION_ID}\",\"fingerprint\":\"${FINGERPRINT}\"}" > /dev/null 2>&1

# Revert wallpaper
if [ -f /tmp/mixer_wallpaper_backup.txt ]; then
    BACKUP_PATH=$(cat /tmp/mixer_wallpaper_backup.txt)
    if [ -n "$BACKUP_PATH" ] && [ -f "$BACKUP_PATH" ]; then
        osascript -e "tell application \"Finder\" to set desktop picture to POSIX file \"$BACKUP_PATH\""
        echo "✅ Wallpaper reverted"
    fi
    rm -f /tmp/mixer_wallpaper_backup.txt
fi

# Revert shell changes
SHELL_RC="$HOME/.zshrc"
if [ -f "/tmp/mixer_shell_backup.txt" ]; then
    cp "/tmp/mixer_shell_backup.txt" "$SHELL_RC"
    echo "✅ Shell configuration reverted"
    rm -f /tmp/mixer_shell_backup.txt
fi

# Clean up temp files
rm -f /tmp/mixer_wallpaper.jpg
rm -f /tmp/mixer_brick_payload

echo ""
echo "✅ All consequences reverted!"
