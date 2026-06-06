#!/usr/bin/env bash
#
# fetch-asmr.sh — download CC0 / public-domain ambient sounds, convert them to
# uniform MP3 loops, and place them in public/audio/ for the reader's ambient
# sound picker (see src/components/reader/asmrTracks.js).
#
# Usage:
#   bash scripts/fetch-asmr.sh           # fetch any missing sounds
#   bash scripts/fetch-asmr.sh --force   # re-fetch everything
#
# Requires: curl, unzip, ffmpeg (auto-installed via apt if missing).
# All sources are CC0 / public domain (OpenGameArt) unless noted.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$SCRIPT_DIR/../public/audio"
UA="Mozilla/5.0 (compatible; verso-asmr-fetch)"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p "$OUT"

# ---- ensure ffmpeg -----------------------------------------------------------
# Resolved path to a usable ffmpeg binary (system, or a downloaded static build).
FFMPEG="ffmpeg"

# Download a URL with resume + retries so a mid-stream reset doesn't restart.
download_resumable() {
  local url="$1" out="$2" i
  for i in 1 2 3 4 5 6; do
    if curl -fL -C - --connect-timeout 20 -A "$UA" -o "$out" "$url"; then
      return 0
    fi
    echo "    download attempt $i failed; retrying…" >&2
    sleep 2
  done
  return 1
}

# Download a self-contained static ffmpeg into a local cache (no root needed).
install_static_ffmpeg() {
  local cache="$SCRIPT_DIR/.ffmpeg-static"
  local existing; existing="$(find "$cache" -type f -name ffmpeg -perm -u+x 2>/dev/null | head -n1 || true)"
  if [ -n "$existing" ]; then FFMPEG="$existing"; return 0; fi

  command -v xz >/dev/null 2>&1 || { echo "  'xz' needed for static ffmpeg" >&2; return 1; }
  local arch; arch="$(uname -m)"
  local urls=()
  case "$arch" in
    x86_64|amd64)
      urls+=("https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz")
      urls+=("https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz") ;;
    aarch64|arm64)
      urls+=("https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz")
      urls+=("https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz") ;;
    *) echo "  no static ffmpeg for arch '$arch'" >&2; return 1 ;;
  esac

  mkdir -p "$cache"
  local tarball="$cache/ffmpeg.tar.xz" url
  for url in "${urls[@]}"; do
    echo "  downloading a static ffmpeg build (no root required)…"
    rm -f "$tarball"
    if ! download_resumable "$url" "$tarball"; then continue; fi
    rm -rf "$cache/extract"; mkdir -p "$cache/extract"
    if ! tar -xJf "$tarball" -C "$cache/extract"; then continue; fi
    rm -f "$tarball"
    local bin; bin="$(find "$cache/extract" -type f -name ffmpeg -perm -u+x | head -n1 || true)"
    if [ -n "$bin" ]; then FFMPEG="$bin"; return 0; fi
  done
  return 1
}

ensure_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1; then return; fi
  echo "ffmpeg not found — attempting to provide it…"
  # Prefer a system package manager when we can use it without prompting.
  if command -v apt-get >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo -n apt-get update && sudo -n apt-get install -y ffmpeg || true
  elif command -v brew >/dev/null 2>&1; then
    brew install ffmpeg || true
  fi
  command -v ffmpeg >/dev/null 2>&1 && return
  # Fall back to a rootless static build.
  install_static_ffmpeg && return
  echo "ERROR: ffmpeg is required but could not be installed automatically." >&2
  echo "Install it manually (e.g. 'sudo apt-get install ffmpeg') and re-run." >&2
  exit 1
}

for bin in curl unzip; do
  command -v "$bin" >/dev/null 2>&1 || { echo "ERROR: '$bin' is required." >&2; exit 1; }
done
ensure_ffmpeg

OGA="https://opengameart.org/sites/default/files"

WRITTEN=()
FAILED=()

# Encode any input file into a uniform ~60s normalized stereo MP3 loop.
encode() {
  local src="$1" dst="$2"
  "$FFMPEG" -nostdin -hide_banner -loglevel error -y \
    -i "$src" -t 60 -ac 2 -ar 44100 -b:a 128k -af loudnorm "$dst"
}

# fetch <id> <kind> <url>
#   kind: mp3 | wav | flac | ogg | zip | generate
fetch() {
  local id="$1" kind="$2" url="${3:-}"
  local dst="$OUT/$id.mp3"

  if [ -f "$dst" ] && [ "$FORCE" -eq 0 ]; then
    echo "• $id — already present, skipping (use --force to refresh)"
    WRITTEN+=("$id")
    return
  fi

  local work; work="$(mktemp -d)"
  # shellcheck disable=SC2064
  trap "rm -rf '$work'" RETURN

  echo "• $id — fetching…"
  if [ "$kind" = "generate" ]; then
    # White noise, generated locally — no download.
    if "$FFMPEG" -nostdin -hide_banner -loglevel error -y \
        -f lavfi -i "anoisesrc=color=white:amplitude=0.5:duration=45" \
        -ac 2 -ar 44100 -b:a 128k -af loudnorm "$dst"; then
      WRITTEN+=("$id"); echo "  ✓ generated $id.mp3"
    else
      FAILED+=("$id"); echo "  ✗ failed to generate $id" >&2
    fi
    return
  fi

  local raw="$work/raw"
  if ! curl -fSL --retry 3 -A "$UA" -o "$raw" "$url"; then
    FAILED+=("$id"); echo "  ✗ download failed for $id ($url)" >&2
    return
  fi

  local input="$raw"
  if [ "$kind" = "zip" ]; then
    unzip -o -q "$raw" -d "$work/unz" || true
    input="$(find "$work/unz" -type f -iname '*.mp3' | sort | head -n1 || true)"
    if [ -z "$input" ]; then
      FAILED+=("$id"); echo "  ✗ no .mp3 inside zip for $id" >&2
      return
    fi
  fi

  if encode "$input" "$dst"; then
    WRITTEN+=("$id"); echo "  ✓ wrote $id.mp3"
  else
    FAILED+=("$id"); echo "  ✗ ffmpeg conversion failed for $id" >&2
    rm -f "$dst"
  fi
}

# ---- source table (all CC0 / public domain) ---------------------------------
fetch rain        zip      "$OGA/Rain%20MP3.zip"
fetch forest      mp3      "$OGA/Forest_Ambience_0.mp3"
fetch fire        wav      "$OGA/fire.wav"
fetch ocean       flac     "$OGA/wave_01_cc0-18363__jasinski__alkaibeach.flac"
fetch waterfall   ogg      "$OGA/stream-waterfall_0.ogg"
fetch white-noise generate

# ---- summary ----------------------------------------------------------------
echo
echo "Done. Wrote/kept: ${WRITTEN[*]:-none}"
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "Could not fetch: ${FAILED[*]} (these tracks will be hidden in the app)." >&2
fi
