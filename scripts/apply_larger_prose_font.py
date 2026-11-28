import os

old_target_punct = 'class="${punctClass} text-[23px] sm:text-[26px] md:text-[28px] text-slate-700 font-semibold font-tc"'
new_target_punct = 'class="${punctClass} text-[27px] sm:text-[30px] md:text-[32px] text-slate-700 font-semibold font-tc"'

old_target_char = '<span class="py-text text-[12px] sm:text-[13px] md:text-[14px] text-slate-400 font-medium font-sans mb-0.5 tracking-tight">${py}</span><span class="char-hanzi text-[23px] sm:text-[26px] md:text-[28px] text-slate-800 font-semibold font-tc">${char}</span>'
new_target_char = '<span class="py-text text-[13px] sm:text-[14px] md:text-[15px] text-slate-400 font-medium font-sans mb-0.5 tracking-tight">${py}</span><span class="char-hanzi text-[27px] sm:text-[30px] md:text-[32px] text-slate-800 font-semibold font-tc">${char}</span>'

old_leading = 'leading-[2.2] sm:leading-[2.4]'
new_leading = 'leading-[2.3] sm:leading-[2.5]'

files_to_update = [
    "index.html",
    "templates/index.html",
    "static/js/offline-store.js",
    "static/js/app.js",
    "sw.js",
    "static/sw.js"
]

for fpath in files_to_update:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Update prose typography if in html files
        if fpath.endswith(".html"):
            content = content.replace(old_target_punct, new_target_punct)
            content = content.replace(old_target_char, new_target_char)
            content = content.replace(old_leading, new_leading)
        
        # Bump version 2.4.5 -> 2.4.6
        content = content.replace("2.4.5", "2.4.6").replace("v2.4.5", "v2.4.6")
        
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {fpath}")

print("Typography update and version bump to v2.4.6 complete.")
