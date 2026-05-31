import nltk
import os

packages = ['punkt', 'punkt_tab', 'stopwords', 'wordnet', 'vader_lexicon', 'averaged_perceptron_tagger', 'omw-1.4']
for p in packages:
    print(f"Downloading {p}...", flush=True)
    nltk.download(p, quiet=False)
    print(f"  Done: {p}", flush=True)

print("ALL NLTK DATA DOWNLOADED", flush=True)
