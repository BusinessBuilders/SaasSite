#!/usr/bin/env bash
# tests/e2e/fixtures/make-atlas-visitor.sh — builds atlas-visitor.wav, the fake
# microphone track Chromium plays into tests/e2e/AtlasLive.e2e.ts
# (--use-file-for-fake-audio-capture).
#
# Chrome LOOPS the file, so it is shaped as one whole conversation turn:
#
#   [ leading silence ][ one real spoken question ][ long trailing silence ]
#
#   * leading silence — Atlas greets first and its greeting is spoken verbatim
#     with allow_interruptions=False (plugins/web_voice/worker.py), so the
#     visitor must not start talking until the greeting has finished.
#   * the question — REAL speech from the local Chatterbox server on :8004, the
#     same server Atlas speaks with. Not a tone and not a canned file: the point
#     of the live test is that whisper transcribes a human-sounding sentence.
#   * trailing silence — long enough that Atlas finishes its answer before the
#     file wraps around and the visitor "asks" the same question again.
#
# MEASUREMENT (2026-09-14, redo this after any greeting change):
#   The landscaping greeting — "Hi, I'm Atlas, an AI receptionist built by
#   Business Builder. For this demo I'm answering for Maple Street Landscaping,
#   a sample landscaping business. Ask me something the way one of their
#   customers would." — rendered by the live TTS with the worker's own voice
#   (WEB_VOICE_TTS_VOICE default Elena.wav) is 11.24 s of audio, measured with
#   ffprobe. 11.24 s + 3 s of headroom = 14.24 s, rounded up to a whole 15 s.
#   The greeting also starts a second or two AFTER the microphone opens (agent
#   dispatch, then TTS time-to-first-byte), so the real margin is larger again.
#   15 s is still far inside the worker's 45 s idle check.
#
# Usage (the TTS server must be up; there is no offline fallback on purpose —
# a fixture built from silence would make the live test pass while proving
# nothing):
#   bash tests/e2e/fixtures/make-atlas-visitor.sh
set -euo pipefail
cd "$(dirname "$0")"

TTS_BASE="${ATLAS_TTS_URL:-http://127.0.0.1:8004}"
VISITOR_VOICE="${ATLAS_VISITOR_VOICE:-Emily.wav}"
LEAD_SILENCE_S=15
TAIL_SILENCE_S=40
# Plain ASCII, no quotes and no backslashes, so it drops straight into the JSON
# body below without escaping.
QUESTION="Hi. My name is Dana Reyes and I run Reyes Landscaping. Do you do fall cleanups?"

echo "Rendering the visitor's question with ${VISITOR_VOICE} on ${TTS_BASE} ..."
curl -fsS -m 120 -o q.wav \
  -H 'Content-Type: application/json' \
  -d "{\"model\":\"tts-1\",\"input\":\"${QUESTION}\",\"voice\":\"${VISITOR_VOICE}\",\"response_format\":\"wav\"}" \
  "${TTS_BASE}/v1/audio/speech"

# A 200 with a stub body is the failure this fixture must never ship: it would
# hand the live test a silent microphone and the test would fail somewhere far
# away from the cause. Fail here, loudly, with the size we actually got.
bytes=$(stat -c %s q.wav)
if [ "$bytes" -lt 60000 ]; then
  echo "FATAL: ${TTS_BASE} returned only ${bytes} bytes of audio — that is not a spoken sentence." >&2
  exit 1
fi

ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t "$LEAD_SILENCE_S" pre.wav
ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t "$TAIL_SILENCE_S" post.wav
ffmpeg -y -loglevel error -i pre.wav -i q.wav -i post.wav \
  -filter_complex '[0:a][1:a][2:a]concat=n=3:v=0:a=1' \
  -ar 48000 -ac 1 -sample_fmt s16 atlas-visitor.wav
rm -f pre.wav post.wav q.wav

duration=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 atlas-visitor.wav)
echo "Wrote atlas-visitor.wav — ${duration} s (question starts at ${LEAD_SILENCE_S} s)."
