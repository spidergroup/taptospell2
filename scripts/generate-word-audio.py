#!/usr/bin/env python3
"""
Resumable batch generator for natural neural voice MP3s for all words and
example sentences in data/grade16.json and data/others.json using edge-tts.

Outputs:
  - public/audio/words/<word>.mp3
  - public/audio/sentences/<sentence_key>.mp3
  - public/audio/words/manifest.json
  - public/audio/sentences/manifest.json

Examples:
  # Generate all words and primary example sentences (resumable):
  python scripts/generate-word-audio.py

  # Generate Grade 1 & Grade 2 first:
  python scripts/generate-word-audio.py --grade 1
  python scripts/generate-word-audio.py --grade 2

  # Generate High School category:
  python scripts/generate-word-audio.py --category animals

  # Include secondary example sentences too:
  python scripts/generate-word-audio.py --all-examples
"""

import argparse
import asyncio
import json
import re
import subprocess
import sys
import time
from pathlib import Path

DEFAULT_VOICE = "en-US-AnaNeural"
DEFAULT_RATE = "-5%"
DEFAULT_PITCH = "+0Hz"
DEFAULT_CONCURRENCY = 16


def ensure_edge_tts() -> None:
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Installing edge-tts...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "edge-tts"])


def get_sentence_audio_key(sentence: str) -> str:
    clean = re.sub(r"[^a-z0-9]+", "_", sentence.strip().lower()).strip("_")
    h = 0x811C9DC5
    for ch in clean:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    prefix = clean[:24].rstrip("_")
    return f"{prefix}_{h:08x}"


def update_manifests(words_dir: Path, sentences_dir: Path) -> tuple[int, int]:
    words_dir.mkdir(parents=True, exist_ok=True)
    sentences_dir.mkdir(parents=True, exist_ok=True)

    word_files = sorted(
        p.stem.lower()
        for p in words_dir.glob("*.mp3")
        if p.is_file() and p.stat().st_size > 0
    )
    sentence_files = sorted(
        p.stem.lower()
        for p in sentences_dir.glob("*.mp3")
        if p.is_file() and p.stat().st_size > 0
    )

    (words_dir / "manifest.json").write_text(
        json.dumps(word_files) + "\n", encoding="utf-8"
    )
    (sentences_dir / "manifest.json").write_text(
        json.dumps(sentence_files) + "\n", encoding="utf-8"
    )
    return len(word_files), len(sentence_files)


def collect_items(
    repo_root: Path,
    grade_filter: int | None,
    category_filter: str | None,
    all_examples: bool,
) -> tuple[list[str], list[tuple[str, str]]]:
    grade16_path = repo_root / "data" / "grade16.json"
    others_path = repo_root / "data" / "others.json"

    grade16 = json.loads(grade16_path.read_text(encoding="utf-8")).get("grades", {})
    others = json.loads(others_path.read_text(encoding="utf-8")).get("data", {})

    words_seen: dict[str, None] = {}
    sentences_seen: dict[str, str] = {}

    def process_entries(entries: list[dict]) -> None:
        for entry in entries:
            w = (entry.get("w") or "").strip().lower()
            if w and w.isalpha():
                words_seen.setdefault(w, None)
            examples = entry.get("examples") or []
            selected = examples if all_examples else examples[:1]
            for sent in selected:
                sent_str = (sent or "").strip()
                if sent_str:
                    key = get_sentence_audio_key(sent_str)
                    sentences_seen.setdefault(key, sent_str)

    if grade_filter is not None:
        grade_key = f"grade_{grade_filter}"
        tiers = grade16.get(grade_key, {})
        for entries in tiers.values():
            if isinstance(entries, list):
                process_entries(entries)
    elif category_filter is not None:
        cat_key = category_filter.strip().lower().replace(" ", "_")
        tiers = others.get(cat_key, {})
        for entries in tiers.values():
            if isinstance(entries, list):
                process_entries(entries)
    else:
        for tiers in grade16.values():
            for entries in tiers.values():
                if isinstance(entries, list):
                    process_entries(entries)
        for tiers in others.values():
            for entries in tiers.values():
                if isinstance(entries, list):
                    process_entries(entries)

    return list(words_seen.keys()), list(sentences_seen.items())


async def synthesize_file(
    text: str,
    out_path: Path,
    voice: str,
    rate: str,
    pitch: str,
    semaphore: asyncio.Semaphore,
    retries: int = 3,
) -> bool:
    import edge_tts

    async with semaphore:
        for attempt in range(1, retries + 1):
            try:
                tmp_path = out_path.with_suffix(".mp3.tmp")
                communicate = edge_tts.Communicate(
                    text=text,
                    voice=voice,
                    rate=rate,
                    pitch=pitch,
                )
                await communicate.save(str(tmp_path))
                if tmp_path.exists() and tmp_path.stat().st_size > 0:
                    tmp_path.replace(out_path)
                    return True
            except Exception as exc:
                if attempt == retries:
                    print(f"  [WARN] Failed '{text[:40]}': {exc}")
                    return False
                await asyncio.sleep(0.8 * attempt)
    return False


async def main_async(args: argparse.Namespace) -> None:
    repo_root = Path(__file__).resolve().parent.parent
    words_dir = repo_root / "public" / "audio" / "words"
    sentences_dir = repo_root / "public" / "audio" / "sentences"
    words_dir.mkdir(parents=True, exist_ok=True)
    sentences_dir.mkdir(parents=True, exist_ok=True)

    words, sentences = collect_items(
        repo_root,
        grade_filter=args.grade,
        category_filter=args.category,
        all_examples=args.all_examples,
    )

    tasks_to_run: list[tuple[str, str, Path]] = []

    if not args.sentences_only:
        for w in words:
            out_path = words_dir / f"{w}.mp3"
            if args.force or not (out_path.exists() and out_path.stat().st_size > 0):
                prompt = "A" if w == "a" else f"{w}."
                tasks_to_run.append(("word", prompt, out_path))

    if not args.words_only:
        for key, sent in sentences:
            out_path = sentences_dir / f"{key}.mp3"
            if args.force or not (out_path.exists() and out_path.stat().st_size > 0):
                tasks_to_run.append(("sentence", sent, out_path))

    if args.limit and args.limit > 0:
        tasks_to_run = tasks_to_run[: args.limit]

    total = len(tasks_to_run)
    print(
        f"Dataset matched: {len(words)} words, {len(sentences)} sentences | "
        f"Remaining to generate: {total} files (voice={args.voice}, concurrency={args.concurrency})"
    )

    if total == 0:
        w_count, s_count = update_manifests(words_dir, sentences_dir)
        print(f"All requested audio files already exist! Manifests updated ({w_count} words, {s_count} sentences).")
        return

    semaphore = asyncio.Semaphore(args.concurrency)
    completed = 0
    failed = 0
    start_ts = time.time()

    async def worker(kind: str, text: str, path: Path) -> None:
        nonlocal completed, failed
        ok = await synthesize_file(
            text=text,
            out_path=path,
            voice=args.voice,
            rate=args.rate,
            pitch=args.pitch,
            semaphore=semaphore,
        )
        if ok:
            completed += 1
            if completed % 25 == 0 or completed == total:
                elapsed = max(0.1, time.time() - start_ts)
                rate_per_sec = completed / elapsed
                eta_sec = int((total - completed) / max(0.1, rate_per_sec))
                print(
                    f"  Progress: {completed}/{total} ({rate_per_sec:.1f} files/s, ETA ~{eta_sec}s) — latest: {path.name}"
                )
            if completed % 100 == 0:
                update_manifests(words_dir, sentences_dir)
        else:
            failed += 1

    try:
        await asyncio.gather(*(worker(k, t, p) for k, t, p in tasks_to_run))
    finally:
        w_count, s_count = update_manifests(words_dir, sentences_dir)
        print(
            f"Done! Generated {completed} new files ({failed} failed). "
            f"Manifests updated: {w_count} words, {s_count} sentences."
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate natural voice MP3s for words and example sentences."
    )
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Edge TTS voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--rate", default=DEFAULT_RATE, help=f"Speech rate (default: {DEFAULT_RATE})")
    parser.add_argument("--pitch", default=DEFAULT_PITCH, help=f"Pitch (default: {DEFAULT_PITCH})")
    parser.add_argument(
        "--concurrency",
        type=int,
        default=DEFAULT_CONCURRENCY,
        help=f"Parallel requests (default: {DEFAULT_CONCURRENCY})",
    )
    parser.add_argument("--grade", type=int, choices=[1, 2, 3, 4, 5, 6], help="Only generate for a specific grade (1-6)")
    parser.add_argument("--category", type=str, help="Only generate for a High School category (e.g. animals, colors)")
    parser.add_argument("--words-only", action="store_true", help="Only generate word MP3s")
    parser.add_argument("--sentences-only", action="store_true", help="Only generate sentence MP3s")
    parser.add_argument("--all-examples", action="store_true", help="Generate all examples per word instead of primary example")
    parser.add_argument("--limit", type=int, default=0, help="Max number of new files to generate in this run")
    parser.add_argument("--force", action="store_true", help="Overwrite existing MP3 files")
    args = parser.parse_args()

    ensure_edge_tts()
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print("\nInterrupted by user. Progress and manifests have been saved — re-run anytime to resume.")


if __name__ == "__main__":
    main()
