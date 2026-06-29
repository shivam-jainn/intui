#!/bin/bash

# Mixer Consequence: Dock Alias
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

echo "Adding mixer alias to your shell..."

# Backup original
cp "$HOME/.zshrc" "/tmp/mixer_shell_backup.txt" 2>/dev/null

# Add mixer alias
echo "" >> "$HOME/.zshrc"
echo "# 🎭 Mixer Mode - You lost!" >> "$HOME/.zshrc"
echo "alias mixer='open \"${BASE_URL}\"'" >> "$HOME/.zshrc"
echo "alias youlost='echo \"You lost a mixer challenge\"'" >> "$HOME/.zshrc"

echo "✅ Dock aliases added! Type 'mixer' in new terminal to open Mixer."
