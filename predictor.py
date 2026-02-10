import re
from collections import defaultdict, Counter

class MarkovModel:
    def __init__(self, n=2):
        self.n = n
        self.chains = defaultdict(list)
        self.vocabulary = set()

    def tokenize(self, text):
        # Clean and tokenize text
        text = text.lower()
        # Remove special characters except spaces
        text = re.sub(r'[^\w\s]', '', text)
        words = text.split()
        return words

    def train(self, text):
        words = self.tokenize(text)
        if len(words) < self.n:
            return

        for i in range(len(words) - self.n + 1):
            # Key is the sequence of n-1 words
            key_parts = words[i:i + self.n - 1]
            key = ' '.join(key_parts)
            
            # The next word is the target
            next_word = words[i + self.n - 1]

            self.chains[key].append(next_word)
            self.vocabulary.add(next_word)

    def predict(self, input_text, max_results=5):
        words = self.tokenize(input_text)
        if not words:
            return []

        # Try to find the longest possible match based on N
        # We start from the current N and back off if no match is found
        for current_n in range(self.n, 1, -1):
            if len(words) < current_n - 1:
                continue

            key_parts = words[-(current_n - 1):]
            key = ' '.join(key_parts)

            if key in self.chains:
                possibilities = self.chains[key]
                return self.get_top_predictions(possibilities, max_results)
        
        return []

    def get_top_predictions(self, possibilities, max_results):
        counts = Counter(possibilities)
        # Return most common words as suggestions
        return [word for word, count in counts.most_common(max_results)]

    def clear(self):
        self.chains.clear()
        self.vocabulary.clear()

    def set_n(self, n):
        self.n = int(n)
