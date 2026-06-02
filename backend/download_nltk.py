"""
Build-time NLTK data downloader.
Run once during deployment: python download_nltk.py
"""
import nltk
import sys

# Full list — covers both older and newer NLTK versions
PACKAGES = [
    "punkt",                        # sentence/word tokenizer (legacy)
    "punkt_tab",                    # tokenizer tables (NLTK 3.8.2+, required)
    "stopwords",                    # English stopwords
    "wordnet",                      # lemmatizer
    "omw-1.4",                      # Open Multilingual WordNet
    "averaged_perceptron_tagger",   # POS tagger (legacy name)
    "averaged_perceptron_tagger_eng",  # POS tagger (NLTK 3.9+)
    "vader_lexicon",                # VADER sentiment lexicon
]

failed = []
for pkg in PACKAGES:
    print(f"  Downloading: {pkg}", flush=True)
    try:
        nltk.download(pkg, quiet=False)
        print(f"  OK: {pkg}", flush=True)
    except Exception as e:
        # Non-fatal — some packages may not exist in older/newer versions
        print(f"  WARN: {pkg} — {e}", flush=True)
        failed.append(pkg)

print("\n✓ NLTK data download complete.", flush=True)
if failed:
    print(f"  Skipped (non-fatal): {failed}", flush=True)
