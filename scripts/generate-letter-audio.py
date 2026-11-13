#!/usr/bin/env python3
"""
Generates friendly neural voice MP3 files for all 26 letters (a.mp3 - z.mp3)
in public/audio/letters/ using Microsoft Edge Neural TTS (edge-tts).

Usage:
  python scripts/generate-letter-audio.py
  python scripts/generate-letter-audio.py --voice en-US-AriaNeural
"""

import argparse
import asyncio
import json
import string
import subprocess
import sys
from pathlib import Path

DEFAULT_VOICE = "en-US-AnaNeural"
DEFAULT_RATE = "-5%"
DEFAULT_PITCH = "+0Hz"

# Clear phonetic hints for any letter that a TTS normalizer might otherwise
# treat as an article when spoken in isolation.
LETTER_PROMPTS: dict[str, str] = {
    "a": "A",
    "b": "B.",
    "c": "C.",
    "d": "D.",
    "e": "E.",
    "f": "F.",
    "g": "G.",
    "h": "H.",
    "i": "I.",
    "j": "J.",
    "k": "K.",
    "l": "L.",
    "m": "M.",
    "n": "N.",
    "o": "O.",
    "p": "P.",
    "q": "Q.",
    "r": "R.",
    "s": "S.",
    "t": "T.",
    "u": "U.",
    "v": "V.",
    "w": "W.",
    "x": "X.",
    "y": "Y.",
    "z": "Z.",
}


def ensure_edge_tts():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Installing edge-tts...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "edge-tts"])


async def generate_letter(
    letter: str,
    out_dir: Path,
    voice: str,
    rate: str,
    pitch: str,
    semaphore: asyncio.Semaphore,
) -> str:
    import edge_tts

    prompt = LETTER_PROMPTS.get(letter, f"{letter.upper()}.")
    out_path = out_dir / f"{letter}.mp3"

    async with semaphore:
        communicate = edge_tts.Communicate(
            text=prompt,
            voice=voice,
            rate=rate,
            pitch=pitch,
        )
        await communicate.save(str(out_path))

    size_kb = out_path.stat().st_size / 1024
    print(f"  Generated {out_path.as_posix()} ({size_kb:.1f} KB)")
    return letter


async def main_async(voice: str, rate: str, pitch: str) -> None:
    repo_root = Path(__file__).resolve().parent.parent
    out_dir = repo_root / "public" / "audio" / "letters"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generating 26 letter voices in {out_dir.as_posix()} using {voice}...")
    semaphore = asyncio.Semaphore(6)
    letters = list(string.ascii_lowercase)

    await asyncio.gather(
        *(generate_letter(ch, out_dir, voice, rate, pitch, semaphore) for ch in letters)
    )

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(letters) + "\n", encoding="utf-8")
    print(f"Saved manifest to {manifest_path.as_posix()} ({len(letters)} letters).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate letter voice MP3s.")
    parser.add_argument(
        "--voice",
        default=DEFAULT_VOICE,
        help=f"Edge TTS neural voice name (default: {DEFAULT_VOICE})",
    )
    parser.add_argument(
        "--rate",
        default=DEFAULT_RATE,
        help=f"Speech rate adjustment (default: {DEFAULT_RATE})",
    )
    parser.add_argument(
        "--pitch",
        default=DEFAULT_PITCH,
        help=f"Pitch adjustment (default: {DEFAULT_PITCH})",
    )
    args = parser.parse_args()

    ensure_edge_tts()
    asyncio.run(main_async(args.voice, args.rate, args.pitch))


if __name__ == "__main__":
    main()
