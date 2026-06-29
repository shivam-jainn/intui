#!/bin/bash

# Mixer Consequence: Wallpaper Change
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

echo "Your desktop is about to get a makeover..."

# Array of random wallpapers
WALLPAPERS=(
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920"
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920"
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920"
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920"
    "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=1920"
)

# Pick random wallpaper
RANDOM_INDEX=$((RANDOM % ${#WALLPAPERS[@]}))
WALLPAPER_URL="${WALLPAPERS[$RANDOM_INDEX]}"

# Get current wallpaper path for revert
CURRENT_WALLPAPER=$(osascript -e 'tell application "Finder" to get POSIX path of (get desktop picture as alias)' 2>/dev/null || echo "")

# Save current wallpaper for revert
echo "$CURRENT_WALLPAPER" > /tmp/mixer_wallpaper_backup.txt

# Download new wallpaper
echo "📥 Downloading new wallpaper..."
curl -s -o /tmp/mixer_wallpaper.jpg "$WALLPAPER_URL"

if [ -f /tmp/mixer_wallpaper.jpg ]; then
    osascript -e "tell application \"Finder\" to set desktop picture to POSIX file \"/tmp/mixer_wallpaper.jpg\"" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Wallpaper changed! Your desktop now looks like a modern art museum."
    else
        echo "⚠️  Wallpaper downloaded but could not be set automatically."
        echo "    File saved at: /tmp/mixer_wallpaper.jpg"
        echo "    Right-click and 'Set Desktop Picture' to apply."
    fi
else
    echo "❌ Failed to download wallpaper."
fi

echo ""
echo "To revert: curl -s ${BASE_URL}/shell/revert?session=${SESSION_ID} | bash"
