#!/bin/bash

# Mixer Consequence: Terminal Message
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

echo "Your terminal is about to remember this day forever..."

# Determine shell RC file
SHELL_RC="$HOME/.zshrc"
if [ ! -f "$SHELL_RC" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ ! -f "$SHELL_RC" ]; then
    SHELL_RC="$HOME/.profile"
fi

# Backup original
cp "$SHELL_RC" "/tmp/mixer_shell_backup.txt" 2>/dev/null

# Add menacing mixer message
cat >> "$SHELL_RC" << 'MIXER_EOF'

# 🎭 MIXER MODE - YOU LOST
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ⚠️  MIXER CONSEQUENCE ACTIVE                                ║"
echo "║                                                               ║"
echo "║   You lost a coding challenge.                                ║"
echo "║   Your terminal will never forget this day.                   ║"
echo "║                                                               ║"
echo "║   To remove this message:                                     ║"
echo "║   curl -s ${BASE_URL}/shell/revert?session=SESSION_ID | bash  ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
MIXER_EOF

# Replace placeholders
sed -i.bak "s|\${BASE_URL}|${BASE_URL}|g" "$SHELL_RC" 2>/dev/null || \
    perl -pi -e "s|\$\{BASE_URL\}|${BASE_URL}|g" "$SHELL_RC" 2>/dev/null || \
    sed -i '' "s|\${BASE_URL}|${BASE_URL}|g" "$SHELL_RC" 2>/dev/null

sed -i.bak "s|SESSION_ID|${SESSION_ID}|g" "$SHELL_RC" 2>/dev/null || \
    perl -pi -e "s|SESSION_ID|${SESSION_ID}|g" "$SHELL_RC" 2>/dev/null || \
    sed -i '' "s|SESSION_ID|${SESSION_ID}|g" "$SHELL_RC" 2>/dev/null

echo "✅ Terminal message installed!"
echo "Open a new terminal tab to see your consequence."
echo ""
echo "To revert: curl -s ${BASE_URL}/shell/revert?session=${SESSION_ID} | bash"
