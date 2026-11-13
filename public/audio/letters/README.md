# Custom Letter Audio

Contains `.mp3` voice files for all 26 letters (`a.mp3` – `z.mp3`).

### Naming Convention
Name each file using the lowercase letter:
- `a.mp3`
- `b.mp3`
- ...
- `z.mp3`

### Regenerating Voices
To regenerate all 26 letter voices using Microsoft Edge Neural TTS (`edge-tts`):
```bash
npm run generate:letters
```
Or specify a different neural voice:
```bash
python scripts/generate-letter-audio.py --voice en-US-AriaNeural
```

### Fallback Behavior
If an audio file fails to load for any letter, the game automatically falls back to browser text-to-speech (`speakLetter`).
