import { NextRequest, NextResponse } from "next/server";

function generateVerifyScript(baseUrl: string, userId?: string): string {
  const userIdParam = userId ? `&userId=${userId}` : '';
  const userIdBody = userId ? `, \\"userId\\": \\"${userId}\\"` : '';
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
    echo "✅ Config found locally."
    echo "   UUID: $EXISTING_UUID"
    echo ""
    echo "Checking server registration..."
    SERVER_CHECK=$(curl -s "${baseUrl}/api/mixermode/verify?uuid=$EXISTING_UUID")
    if echo "$SERVER_CHECK" | grep -q '"verified":true'; then
      echo "✅ Server confirmed — device already verified."
      exit 0
    fi
    echo "⚠️  Not found on server. Re-registering..."
    curl -s -X POST "${baseUrl}/api/mixermode/verify" \
      -H "Content-Type: application/json" \
      -d "{\\"uuid\\": \\"$EXISTING_UUID\\"${userIdBody}}" > /dev/null 2>&1
    echo "✅ Re-registered."
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
curl -s -X POST "${baseUrl}/api/mixermode/verify" \
  -H "Content-Type: application/json" \
  -d "{\\"uuid\\": \\"$DEVICE_UUID\\"${userIdBody}}" > /dev/null 2>&1

echo "✅ Verified! You can now use Mixer mode."
echo ""
`;
}

// ── Helpers ──────────────────────────────────────────────────────

function readUuidBlock(baseUrl: string): string {
  return `
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
}

function verifyBlock(baseUrl: string, runid: string): string {
  return `
echo "📡 Verifying penalty acceptance..."
curl -s -X POST "${baseUrl}/api/mixermode/penalty-verify/${runid}" \
  -H "Content-Type: application/json" \
  -d "{\\"uuid\\": \\"$UUID\\"}"
echo ""
echo "✅ Then click 'Verify My Penalty' in the browser."
`;
}

function headerBlock(title: string): string {
  return `
echo "🎭 INTUI MIXER — ${title}"
echo "${'='.repeat(title.length + 18)}"
echo ""
`;
}

type ScriptFn = (
  baseUrl: string,
  runid: string,
  readUuid: string,
  verifyCall: string
) => string;

// ── EASY pool ───────────────────────────────────────────────────

const easyWallpaper: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("EASY PENALTY")}

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
${vc}
`;

const easyDesktopNoise: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("EASY PENALTY")}

DESKTOP="$HOME/Desktop"
if [ ! -d "$DESKTOP" ]; then
  DESKTOP="$HOME"
fi

echo "Dropping some taunts on your desktop..."

for f in "you_lost_$(date +%s)" "intui_owns_$(date +%s)" "try_harder_$(date +%s)" "beaten_by_clock_$(date +%s)" "should_have_submitted_$(date +%s)"; do
  echo "Intui says: git gud." > "$DESKTOP/\${f}.txt"
done

echo "✅ 5 taunt files dropped on desktop"
echo "   rm -f \$HOME/Desktop/you_lost_* \$HOME/Desktop/intui_owns_*"
echo ""
${vc}
`;

const easyBeeps: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("EASY PENALTY")}

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  BACKUP_DIR="$HOME/.intui/backups/${runid}"
  mkdir -p "$BACKUP_DIR"
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'INTUI_BEEP'
PROMPT_COMMAND='tput bel 2>/dev/null; echo -e "\\033[38;5;208m🔔 Intui says: type faster!\\033[0m"'
INTUI_BEEP
  echo "✅ Terminal beeps + taunts activated"
  echo "   source $SHELL_RC to enable"
  echo "   🔒 Backup locked — finish a challenge to restore"
else
  echo "⚠️  No shell config found"
fi
echo ""
${vc}
`;

// ── MEDIUM pool ─────────────────────────────────────────────────

const mediumAliases: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("MEDIUM PENALTY")}

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  BACKUP_DIR="$HOME/.intui/backups/${runid}"
  mkdir -p "$BACKUP_DIR"
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'ALIASES'

# Intui Mixer Penalty
alias ls='ls -la'
alias cd='cd && ls'
alias clear='echo "No clearing allowed 😈"'
alias rm='echo "Blocked by Intui 🛡️"'
PS1='\\[\\033[38;5;208m\\]💀 INTUI ZONE\\[\\033[0m\\]:\\w$ '
ALIASES
  echo "✅ Shell aliases added to $SHELL_RC"
  echo "🔒 Backup locked — finish a challenge to restore"
fi

echo "⏰ Adding reminder cron job..."
crontab -l 2>/dev/null > "$BACKUP_DIR/crontab_backup" || true
(crontab -l 2>/dev/null; echo "*/5 * * * * echo '🎯 Practice more coding!' >> /tmp/intui_reminders.log") | crontab - 2>/dev/null || true

echo ""
echo "🔥 Terminal 'enhanced'. Restart shell or run: source $SHELL_RC"
echo ""
${vc}
`;

const mediumSlowMode: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("MEDIUM PENALTY")}

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  BACKUP_DIR="$HOME/.intui/backups/${runid}"
  mkdir -p "$BACKUP_DIR"
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'INTUI_SLOW'
__intui_slow() { sleep 2; }
trap '__intui_slow' DEBUG
INTUI_SLOW
  echo "✅ Slow mode activated (2s delay on every command)"
  echo "   source $SHELL_RC to enable"
  echo "   🔒 Backup locked — finish a challenge to restore"
else
  echo "⚠️  No shell config found"
fi
echo ""
${vc}
`;

const mediumFortune: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("MEDIUM PENALTY")}

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  BACKUP_DIR="$HOME/.intui/backups/${runid}"
  mkdir -p "$BACKUP_DIR"
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'INTUI_TAUNT'
__intui_zings=( "You had ONE job." "Tick tock, loser." "Imagine being beaten by a timer." "Intui: 1 — You: 0" "Keyboard > you." "Did you submit? No. No you did not." "This penalty? You earned it." "Maybe try fingers on keys next time." "Clock waits for no one. Especially you." "Your speed: glacial." )
PROMPT_COMMAND='echo -e "\\033[38;5;208m💬 Intui: \${__intui_zings[\$RANDOM % \${#__intui_zings[@]}]}\\033[0m"'
INTUI_TAUNT
  echo "✅ Random taunts on every command"
  echo "   source $SHELL_RC to enable"
  echo "   🔒 Backup locked — finish a challenge to restore"
else
  echo "⚠️  No shell config found"
fi
echo ""
${vc}
`;

// ── HARD pool ───────────────────────────────────────────────────

const hardFileFlood: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("HARD PENALTY")}

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
${vc}
`;

const hardDesktopSwarm: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("HARD PENALTY")}

DESKTOP="$HOME/Desktop"
if [ ! -d "$DESKTOP" ]; then
  DESKTOP="$HOME"
fi

SWARM_DIR="$DESKTOP/intui_maze_$(date +%s)"
mkdir -p "$SWARM_DIR"

echo "Building folder maze..."
for i in $(seq 1 8); do
  P=""
  for j in $(seq 1 $i); do
    P="\${P}/nope_$j"
  done
  mkdir -p "$SWARM_DIR\${P}"
done
for i in $(seq 1 8); do
  P=""
  for j in $(seq 1 $i); do
    P="\${P}/wrong_way_$j"
  done
  mkdir -p "$SWARM_DIR\${P}"
  touch "$SWARM_DIR\${P}/still_wrong.txt"
done

echo "✅ Recursive folder maze created on desktop"
echo "   🧹 rm -rf $SWARM_DIR"
echo ""
${vc}
`;

const hardBrowserChaos: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("HARD PENALTY")}

URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "Opening reminder tabs..."
for i in $(seq 1 3); do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$URL" 2>/dev/null || true
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$URL" 2>/dev/null || true
  fi
  sleep 0.5
done
echo "✅ 3 rickroll tabs opened"

BACKUP_DIR="$HOME/.intui/backups/${runid}"
mkdir -p "$BACKUP_DIR"
crontab -l 2>/dev/null > "$BACKUP_DIR/crontab_backup" || true
NOTIFY=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  NOTIFY="osascript -e 'display notification \\"You forgot to submit!\\" with title \\"💀 Intui\\"'"
elif command -v notify-send &> /dev/null; then
  NOTIFY="notify-send \\"💀 Intui\\" \\"You forgot to submit!\\""
fi
if [ -n "$NOTIFY" ]; then
  (crontab -l 2>/dev/null; echo "*/2 * * * * $NOTIFY") | crontab - 2>/dev/null || true
  echo "✅ Desktop notifications every 2 minutes added"
fi
echo ""
${vc}
`;

// ── EXTREME pool ────────────────────────────────────────────────

const extremeChaosCombo: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("HARD PENALTY")}

DESKTOP="$HOME/Desktop"
[ ! -d "$DESKTOP" ] && DESKTOP="$HOME"

# ── 1. Desktop taunts ──
for f in "absolute_owned_$(date +%s)" "intui_owner_$(date +%s)" "rage_quit_ready_$(date +%s)" "step_it_up_$(date +%s)" "yikes_$(date +%s)"; do
  echo "Extreme penalty. You messed up." > "$DESKTOP/\${f}.txt"
done
echo "✅ Taunt files on desktop"

# ── 2. Desktop maze ──
MAZE="$DESKTOP/intui_extreme_$(date +%s)"
mkdir -p "$MAZE"
for i in $(seq 1 5); do
  mkdir -p "$MAZE/stage_$i/keep/going/deeper/why"
  touch "$MAZE/stage_$i/keep/going/deeper/why/oops.txt"
done
echo "✅ Folder maze on desktop"

# ── 3. Shell carnage ──
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi
BACKUP_DIR="$HOME/.intui/backups/${runid}"
mkdir -p "$BACKUP_DIR"
if [ -n "$SHELL_RC" ]; then
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'INTUI_XTREME'
alias ls='ls -la'
alias cd='cd && ls && echo "🚀 Nope."'
alias clear='echo "🧹 Live in your mess."'
alias rm='echo "🛡️ Denied."'
alias gcc='echo "🔨 Wishful thinking."'
alias python='echo "🐍 Python says no."'
alias node='echo "🟩 Node refuses."'
sleep 1
PROMPT_COMMAND='sleep 1; echo -e "\\033[38;5;196m💀 EXTREME INTUI\\033[0m"'
PS1='\\[\\033[38;5;196m\\]☠️ XTREME\\[\\033[0m\\]:\\w> '
INTUI_XTREME
  echo "✅ Aliases + delays + taunts installed"
fi

# ── 4. Backup crontab ──
crontab -l 2>/dev/null > "$BACKUP_DIR/crontab_backup" || true

# ── 5. Notifications ──
if [[ "$OSTYPE" == "darwin"* ]]; then
  (crontab -l 2>/dev/null; echo "*/3 * * * * osascript -e 'display notification \\"XTREME: submit next time!\\" with title \\"☠️ Intui\\"'") | crontab - 2>/dev/null || true
elif command -v notify-send &> /dev/null; then
  (crontab -l 2>/dev/null; echo "*/3 * * * * notify-send \\"☠️ Intui\\" \\"XTREME: submit next time!\\"") | crontab - 2>/dev/null || true
fi
echo "✅ Notifications every 3 min"

# ── 6. Temp file flood ──
TMP="/tmp/intui_xtreme_$(date +%s)"
mkdir -p "$TMP"
for i in $(seq 1 1000); do
  echo "xtreme $i" > "$TMP/x_$i.txt"
done
echo "✅ 1000 files in $TMP"

echo ""
echo "✅ All backups secured — finish a challenge to unlock auto-cleanup"
echo ""
${vc}
`;

// ── NIGHTMARE pool ──────────────────────────────────────────────

const nightmareTotal: ScriptFn = (baseUrl, runid, ru, vc) => `#!/bin/bash
set -e
${ru}
${headerBlock("HARD PENALTY")}

# ── 1. Wallpaper ──
WP="/tmp/intui_nm_$(date +%s).png"
curl -sL "https://picsum.photos/1920/1080?random=$(date +%s)" -o "$WP" 2>/dev/null || true
if [[ "$OSTYPE" == "darwin"* ]]; then
  osascript -e "tell application \\"Finder\\" to set desktop picture to POSIX file \\"$WP\\"" 2>/dev/null || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  gsettings set org.gnome.desktop.background picture-uri "file://$WP" 2>/dev/null || true
fi
echo "✅ Wallpaper changed"

# ── 2. Desktop taunts ──
DESKTOP="$HOME/Desktop"
[ ! -d "$DESKTOP" ] && DESKTOP="$HOME"
for f in "nm_owned_$(date +%s)" "huge_trouble_$(date +%s)" "why_did_you_$(date +%s)" "intui_nm_$(date +%s)" "gg_wp_$(date +%s)"; do
  echo "NIGHTMARE — good luck." > "$DESKTOP/\${f}.txt"
done
echo "✅ Desktop taunts"

# ── 3. Desktop maze ──
MAZE="$DESKTOP/intui_nm_$(date +%s)"
mkdir -p "$MAZE"
for i in $(seq 1 10); do
  mkdir -p "$MAZE/why/though/level_$i/rip"
  touch "$MAZE/why/though/level_$i/rip/sigh.txt"
done
echo "✅ Folder maze"

# ── 4. File flood ──
TMP="/tmp/intui_nm_$(date +%s)"
mkdir -p "$TMP"
for i in $(seq 1 10000); do
  echo "nm $i" > "$TMP/nm_$i.txt"
done
echo "✅ 10000 files in /tmp"

# ── 5. Shell chaos ──
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
fi
BACKUP_DIR="$HOME/.intui/backups/${runid}"
mkdir -p "$BACKUP_DIR"
if [ -n "$SHELL_RC" ]; then
  cp "$SHELL_RC" "$BACKUP_DIR/shell_rc_backup"
  cat >> "$SHELL_RC" << 'INTUI_NM'
alias ls='echo "🔍 nope"; ls -la'
alias cd='echo "🚫 no"; cd && ls'
alias clear='echo "🧹 stop"'
alias rm='echo "💀 rm is ded"'
alias cat='echo "🐱 meow"'
alias vim='echo "📝 no"'
alias python='echo "🐍 no"'
alias node='echo "🟩 no"'
alias npm='echo "📦 run"'
alias git='echo "🔀 no"'
PROMPT_COMMAND='sleep 1; tput bel 2>/dev/null; echo -e "\\033[38;5;196m☠️ NIGHTMARE INTUI\\033[0m"'
PS1='\\[\\033[38;5;196m\\]🌙 NM\\[\\033[0m\\]:\\w> '
INTUI_NM
  echo "✅ Shell wrecked"
fi

# ── 6. Browser tabs ──
for i in $(seq 1 5); do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>/dev/null || true
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>/dev/null || true
  fi
done
echo "✅ 5 rickroll tabs"

# ── 7. Backup crontab + notifications ──
crontab -l 2>/dev/null > "$BACKUP_DIR/crontab_backup" || true
if [[ "$OSTYPE" == "darwin"* ]]; then
  (crontab -l 2>/dev/null; echo "*/1 * * * * osascript -e 'display notification \\"NIGHTMARE: you can\\'t escape Intui\\" with title \\"🌙 Intui NM\\"'") | crontab - 2>/dev/null || true
elif command -v notify-send &> /dev/null; then
  (crontab -l 2>/dev/null; echo "*/1 * * * * notify-send \\"🌙 Intui NM\\" \\"NIGHTMARE: you can't escape Intui\\"") | crontab - 2>/dev/null || true
fi
echo "✅ Notifications every 1 min"

# ── 8. Matrix ──
echo ""
for i in $(seq 1 20); do
  echo "$(shuf -i 0-1 -n 48 | tr -d '\\n' | sed 's/0/░/g; s/1/▓/g')"
  sleep 0.08
done

echo ""
echo "📦 All backups secured in ~/.intui/backups/${runid}"
echo "🔒 Finish a challenge to unlock automatic restore"
echo ""
${vc}
`;

// ── Pools ────────────────────────────────────────────────────────

const pools: Record<string, ScriptFn[]> = {
  easy: [easyWallpaper, easyDesktopNoise, easyBeeps],
  medium: [mediumAliases, mediumSlowMode, mediumFortune],
  hard: [hardFileFlood, hardDesktopSwarm, hardBrowserChaos, extremeChaosCombo, nightmareTotal],
};

// ── Generator ────────────────────────────────────────────────────

function generatePenaltyScript(
  baseUrl: string,
  difficulty: string,
  runid: string
): string {
  const ru = readUuidBlock(baseUrl);
  const vc = verifyBlock(baseUrl, runid);
  const pool = pools[difficulty];
  if (!pool || pool.length === 0) {
    return easyWallpaper(baseUrl, runid, ru, vc);
  }
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx](baseUrl, runid, ru, vc);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty");
  const runid = searchParams.get("runid");
  const userId = searchParams.get("userId") || undefined;
  const baseUrl =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";

  let script: string;

  if (difficulty && runid) {
    script = generatePenaltyScript(baseUrl, difficulty, runid);
  } else {
    script = generateVerifyScript(baseUrl, userId);
  }

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/x-shellscript; charset=utf-8",
      "Content-Disposition": 'inline; filename="intui-mixer.sh"',
      "Cache-Control": "no-store",
    },
  });
}
