import { NextRequest, NextResponse } from "next/server";

function generateVerifyScript(baseUrl: string): string {
  return `#!/bin/bash
# Intui Mixer Mode — One-time Device Verification
set -e

CONFIG_DIR="$HOME/.intui"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "🔐 Intui Mixer — Device Verification"
echo "====================================="
echo ""

mkdir -p "$CONFIG_DIR"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING_UUID=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8')).uuid||'')}catch(e){console.log('')}" 2>/dev/null || echo "")
  if [ -n "$EXISTING_UUID" ]; then
    echo "✅ Device already verified!"
    echo "   UUID: $EXISTING_UUID"
    echo ""
    echo "Verifying with server..."
    curl -s "${baseUrl}/api/mixermode/verify?uuid=$EXISTING_UUID" > /dev/null 2>&1
    echo "Done."
    echo ""
    exit 0
  fi
fi

if command -v node &> /dev/null; then
  DEVICE_UUID=$(node -e "console.log(require('crypto').randomUUID())")
elif command -v python3 &> /dev/null; then
  DEVICE_UUID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
elif command -v uuidgen &> /dev/null; then
  DEVICE_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
else
  DEVICE_UUID="intui-$(date +%s)-$$"
fi

echo "📋 UUID: $DEVICE_UUID"

cat > "$CONFIG_FILE" << EOF
{
  "uuid": "$DEVICE_UUID",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "verified": true
}
EOF

echo "📡 Registering..."
curl -s -X POST "${baseUrl}/api/mixermode/verify" \\
  -H "Content-Type: application/json" \\
  -d "{\\"uuid\\": \\"$DEVICE_UUID\\"}" > /dev/null 2>&1

echo "✅ Verified! You can now use Mixer mode."
echo ""
`;
}

function generatePenaltyScript(
  baseUrl: string,
  difficulty: string,
  runid: string
): string {
  const readUuid = `
UUID=""
if [ -f "$HOME/.intui/config.json" ]; then
  UUID=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$HOME/.intui/config.json','utf8')).uuid||'')}catch(e){console.log('')}" 2>/dev/null || echo "")
fi
if [ -z "$UUID" ]; then
  echo "⚠️  No device UUID found. Run verification first:"
  echo "   curl -sL \\"${baseUrl}/api/mixermode/verify.sh\\" | bash"
  exit 1
fi
`;

  const verifyCall = `
echo "📡 Verifying penalty acceptance..."
curl -s -X POST "${baseUrl}/api/mixermode/penalty-verify/${runid}" \\
  -H "Content-Type: application/json" \\
  -d "{\\"uuid\\": \\"$UUID\\"}" > /dev/null 2>&1
echo "✅ Penalty verified. You may now continue."
`;

  if (difficulty === "hard") {
    return `#!/bin/bash
set -e
${readUuid}

echo "🎭 INTUI MIXER — HARD PENALTY"
echo "=============================="
echo ""

CHAOS_DIR="/tmp/intui_chaos_$(date +%s)"
mkdir -p "$CHAOS_DIR"

echo "Creating 5000 files..."
for i in $(seq 1 5000); do
  echo "Intui penalty #$i" > "$CHAOS_DIR/penalty_$i.txt"
done
echo "✅ Created 5000 files in $CHAOS_DIR"

echo ""
for i in $(seq 1 15); do
  echo "$(shuf -i 0-1 -n 32 | tr -d '\\n' | sed 's/0/░/g; s/1/▓/g')"
  sleep 0.1
done
echo ""

echo ""
echo "🧹 Clean up: rm -rf $CHAOS_DIR"
echo ""
${verifyCall}
`;
  }

  if (difficulty === "medium") {
    return `#!/bin/bash
set -e
${readUuid}

echo "🎭 INTUI MIXER — MEDIUM PENALTY"
echo "================================"
echo ""

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  cp "$SHELL_RC" "$SHELL_RC.intui_backup_$(date +%s)"
  cat >> "$SHELL_RC" << 'ALIASES'

# Intui Mixer Penalty
alias ls='ls -la'
alias cd='cd && ls'
alias clear='echo "No clearing allowed 😈"'
alias rm='echo "Blocked by Intui 🛡️"'
PS1='\\[\\033[38;5;208m\\]💀 INTUI ZONE\\[\\033[0m\\]:\\w$ '
ALIASES
  echo "✅ Shell aliases added to $SHELL_RC"
  echo "📝 Backup saved"
fi

echo "⏰ Adding reminder cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * echo '🎯 Practice more coding!' >> /tmp/intui_reminders.log") | crontab - 2>/dev/null || true

echo ""
echo "🔥 Terminal 'enhanced'. Restart shell or run: source $SHELL_RC"
echo ""
${verifyCall}
`;
  }

  // Easy
  return `#!/bin/bash
set -e
${readUuid}

echo "🎭 INTUI MIXER — EASY PENALTY"
echo "==============================="
echo ""

WALLPAPER_PATH="/tmp/intui_wallpaper_$(date +%s).png"

echo "Downloading new wallpaper..."
curl -sL "https://picsum.photos/1920/1080?random=$(date +%s)" -o "$WALLPAPER_PATH" 2>/dev/null || true

if [[ "$OSTYPE" == "darwin"* ]]; then
  osascript -e "tell application \\"Finder\\" to set desktop picture to POSIX file \\"$WALLPAPER_PATH\\"" 2>/dev/null || true
  echo "✅ Wallpaper changed"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  gsettings set org.gnome.desktop.background picture-uri "file://$WALLPAPER_PATH" 2>/dev/null || true
  echo "✅ Wallpaper changed"
fi

echo ""
${verifyCall}
`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty");
  const runid = searchParams.get("runid");
  const baseUrl =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";

  let script: string;

  if (difficulty && runid) {
    script = generatePenaltyScript(baseUrl, difficulty, runid);
  } else {
    script = generateVerifyScript(baseUrl);
  }

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/x-shellscript; charset=utf-8",
      "Content-Disposition": 'inline; filename="intui-mixer.sh"',
      "Cache-Control": "no-store",
    },
  });
}
