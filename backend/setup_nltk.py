"""Run this once to download all required NLTK data."""
import nltk

packages = [
    "punkt",
    "punkt_tab",
    "stopwords",
    "wordnet",
    "averaged_perceptron_tagger",
    "vader_lexicon",
    "omw-1.4",
]

for pkg in packages:
    print(f"Downloading {pkg}...")
    nltk.download(pkg, quiet=False)

print("\nAll NLTK packages downloaded successfully.")
