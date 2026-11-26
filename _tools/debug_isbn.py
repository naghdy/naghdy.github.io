import urllib.request
import urllib.parse
import json

title = "Economics in One Lesson"
author = "Henry Hazlitt"

query = urllib.parse.urlencode({'title': title, 'author': author})
url = f"https://openlibrary.org/search.json?{query}"

print(f"Querying: {url}")

try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode()
        data = json.loads(content)
        print(f"Num Found: {data.get('numFound')}")
        found = False
        for i, doc in enumerate(data.get('docs', [])):
            if 'isbn' in doc:
                print(f"Doc {i} has {len(doc['isbn'])} ISBNs: {doc['isbn'][:5]}...")
                found = True
            else:
                print(f"Doc {i} has NO ISBNs")
        if not found:
            print("No ISBNs found in any doc")
except Exception as e:
    print(f"Error: {e}")
