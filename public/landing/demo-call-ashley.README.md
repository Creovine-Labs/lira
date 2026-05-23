# Demo call audio asset

This directory is where the landing-page demo modal looks for its audio file.

## Required file

**`demo-call-ashley.mp3`** — the recorded call (currently missing — drop the
final mix in this folder with this exact filename and the modal will pick it up
automatically).

Recommended specs:
- Format: MP3
- Bitrate: 96 kbps (mono speech) — keeps file under ~1.5 MB
- Length: ~78 seconds (matches the VTT cues)
- Channels: mono
- Sample rate: 44.1 kHz

## Companion file (already in repo)

**`demo-call-ashley.vtt`** — WebVTT captions. The transcript array in
`src/components/marketing/DemoCallModal.tsx` mirrors these cues and drives the
live transcript scroller in the modal. If you change the script, update both
files in sync.

## Until the audio is provided

The modal will still open and the transcript will render — the play button
shows an "audio is being finalized" notice but the customer-facing transcript
is fully readable and seekable.

## Production checklist

- [ ] Record final mix to `demo-call-ashley.mp3`
- [ ] Verify cue timings in `.vtt` match the actual audio (re-time if needed)
- [ ] Update the `TRANSCRIPT` array in `DemoCallModal.tsx` to match
- [ ] QA on Chrome, Safari, Firefox + iOS Safari + Android Chrome
- [ ] Confirm autoplay-block fallback works (must require explicit play)
- [ ] Verify total file size is under 1.5 MB
