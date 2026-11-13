# Custom Word Audio

Place custom `.mp3` files for individual words in this directory.

### Naming Convention
Name the file using the lowercase word:
- `cat.mp3`
- `dog.mp3`
- `elephant.mp3`

### Fallback Behavior
If an audio file does not exist for a given word, the game will automatically fall back to browser text-to-speech (Web Speech API).

You can also specify a custom path in the word definition JSON (`data/grade16.json` or `data/others.json`) using the `"audio"` property:
```json
{
  "w": "CAT",
  "i": "🐱",
  "audio": "/audio/words/cat.mp3"
}
```

