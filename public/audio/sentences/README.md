# Custom Example Sentence Audio

Contains `.mp3` voice files for example sentences (`<sentence_key>.mp3`), where `<sentence_key>` is generated deterministically by `getSentenceAudioKey(sentence)` in `src/lib/audio.ts` and `scripts/generate-word-audio.py` (for example, `"I see a big red dog."` -> `i_see_a_big_red_dog_35d8aa70.mp3`).

### Generating Sentence & Word Voices
Run the resumable batch generator:
```bash
npm run generate:words
```
Or generate a specific grade or category first:
```bash
python scripts/generate-word-audio.py --grade 1
python scripts/generate-word-audio.py --grade 2
python scripts/generate-word-audio.py --category animals
```

### Fallback Behavior
If a sentence `.mp3` file is not yet in `public/audio/sentences/manifest.json`, the game automatically speaks the sentence using the browser's natural text-to-speech voice (`speakSentence`).
