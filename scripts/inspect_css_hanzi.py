with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = re.findall(r'\.char-hanzi[^{]*\{[^}]*\}', text)
print("CSS for .char-hanzi:", matches)

matches2 = re.findall(r'\.prose-word[^{]*\{[^}]*\}', text)
print("CSS for .prose-word:", matches2)
