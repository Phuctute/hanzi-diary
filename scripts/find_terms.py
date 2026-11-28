import os

search_terms = [
    'Cuối tuần này các cậu có kế hoạch',
    'bình thường cậu không thích đi chợ đêm',
    '你平常不愛逛夜市',
    'Dia, bình thường',
    'Đạm Thủy ngắm hoàng hôn',
    '看錶演'
]

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for f in files:
        if f.endswith(('.json', '.js', '.html', '.php', '.sql', '.py')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    for term in search_terms:
                        if term in content:
                            print(f'Found "{term}" in {path}')
            except Exception as e:
                pass
