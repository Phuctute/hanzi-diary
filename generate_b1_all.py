import subprocess
import os
import re
import json
import gzip

VOICE = "zh-TW-HsiaoChenNeural"
OUT_DIR = "/app/data/audio_cache/dialogue/7"
DATA_PATH = "/app/data/lesson_contents.json"
OFF2_PATH = "/app/data/offline_curriculum_2.json"
OFF2_GZ = "/app/data/offline_curriculum_2.json.gz"

os.makedirs(OUT_DIR, exist_ok=True)

def parse_vtt(vtt_path):
    if not os.path.exists(vtt_path):
        return []
    with open(vtt_path, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = re.compile(
        r'(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*\n(.*?)(?=\n\n|\n\d+|\Z)',
        re.DOTALL
    )
    def to_sec(ts):
        parts = ts.replace(',', '.').split(':')
        return round(float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2]), 2)
    script_json = []
    idx = 1
    for match in pattern.finditer(content):
        start_ts, end_ts, text = match.groups()
        clean_text = re.sub(r'<[^>]+>', '', text.replace('\n', ' ')).strip()
        if clean_text:
            script_json.append({
                "id": idx,
                "text": clean_text,
                "start_time": to_sec(start_ts),
                "end_time": to_sec(end_ts)
            })
            idx += 1
    return script_json

def gen_tts(text, mp3_path, vtt_path):
    cmd = [
        "edge-tts",
        "--voice", VOICE,
        "--text", text,
        "--write-media", mp3_path,
        "--write-subtitles", vtt_path
    ]
    subprocess.run(cmd, check=True)
    return parse_vtt(vtt_path)

LESSONS_DATA = {
    75: {
        "bd1": {
            "title": "新同學（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """中明：宜文，她是誰？
宜文：她是新同學，叫友美。她很可愛。
中明：她是哪國人？妳知道嗎？
宜文：我知道，她是日本人。
中明：她很漂亮。"""
        },
        "bd2": {
            "title": "認識友美（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """中明：妳好！我是李中明，請問妳叫什麼名字？
友美：我姓小林，叫友美。
中明：請問妳是哪國人？
友美：我是日本人，你呢？
中明：我是印尼人。妳喜歡台灣嗎？
友美：我喜歡台灣。"""
        },
        "bd3": {
            "title": "自我介紹（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """大家好！我姓小林，叫友美，我是日本人。我喜歡臺灣，台灣朋友很可愛。我愛吃水果，愛喝珍珠奶茶。謝謝大家！"""
        }
    },
    76: {
        "bd1": {
            "title": "你幾點去學校？（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """媽媽：今天是星期一，你不去學校嗎？
中明：我早上沒有課，九點去圖書館。
媽媽：中午呢？你中午回家嗎？
中明：我下午有課，中午不回家。
媽媽：你幾點下課？
中明：我四點四十分下課。"""
        },
        "bd2": {
            "title": "週末來我家（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """宜文：今天是星期五，明天是週末，你們要不要來我家？
中明：明天是九月二十三號……啊！是妳的生日！
友美：宜文，生日快樂！
宜文：謝謝！明天晚上六點來我家，好不好？
中明：沒問題。
友美：好，明天見。"""
        },
        "bd3": {
            "title": "友美做什麼？（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """友美是學生，十九歲。她早上六點三十分起床，七點去學校，八點四十分上課；中午十二點下課、吃午飯；下午一點去圖書館；四點回家做飯，晚上六點吃飯，十點睡覺。友美很忙！"""
        }
    },
    77: {
        "bd1": {
            "title": "友美的生日（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """宜文：明天是友美的生日，我想送她一個禮物。
中明：妳想送她什麼？
宜文：友美愛看書，我想送她兩本中文書，你呢？
中明：我想買一些花和一個大蛋糕。
宜文：我們一起去買，好不好？
中明：好啊！"""
        },
        "bd2": {
            "title": "買禮物（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """宜文：這種小鉛筆怎麼樣？
中明：很可愛，友美喜歡可愛的東西。
宜文：我們買兩枝，好不好？兩枝五十塊錢。
中明：五十塊錢很便宜！妳看，哪個顏色漂亮？
宜文：紅色、白色都好看。
中明：我想友美喜歡白色，她常常穿白色的衣服。
宜文：好，我們買白的。"""
        },
        "bd3": {
            "title": "友美的生日（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """今天是友美的生日，她請我、中明和國安一起去她家玩。我們送友美花、兩本中文書、兩枝可愛的小鉛筆和一個大蛋糕，她很喜歡這些禮物。友美請我們吃點心和水果，大家都很開心。"""
        }
    },
    78: {
        "bd1": {
            "title": "去喝飲料（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """中明：天氣好熱，我們去喝飲料，好不好？
友美：好啊！你想喝什麼？咖啡還是茶？
中明：咖啡、茶，我都喜歡。我也很餓，想吃一點兒東西。
友美：這家餐廳人太多，我們去那家餐廳，好嗎？他們的牛肉麵很好吃，也很便宜。
中明：太好了！我最愛吃牛肉麵。他們也賣飲料嗎？
友美：他們賣很多種飲料。
中明：我們現在去，好嗎？
友美：好。"""
        },
        "bd2": {
            "title": "點餐（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """中明：小姐，我們要點兩碗牛肉麵和兩杯茶。
女店員：請問兩位要紅茶還是綠茶？
友美：我要紅茶。
中明：請給我們一杯紅茶、一杯綠茶。請問一共多少錢？
女店員：一共兩百一十五塊錢。
女店員：找您七百八十五塊錢，謝謝。
中明：一共兩百多塊錢，好便宜！"""
        },
        "bd3": {
            "title": "買飲料（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """台灣夏天的天氣很熱，很多人都喜歡喝飲料。飲料店很多，他們賣很多種飲料。果汁、牛奶、咖啡、茶都很好喝，有的很便宜，一杯二十多塊錢。我和朋友都很愛喝，我們每天都去買。"""
        }
    },
    79: {
        "bd1": {
            "title": "喝下午茶（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """中明：友美，妳這個週末要做什麼？
友美：我要在家看書、聽音樂。
中明：妳星期六下午有空嗎？我們一起去喝下午茶，怎麼樣？
友美：好啊！你想去哪裡？
中明：我知道一家很不錯的咖啡廳，那裡的冰淇淋很好吃。
友美：他們有巧克力冰淇淋嗎？
中明：有啊！他們有很多種冰淇淋。
友美：我們這個星期六下午兩點半去吧。
中明：好。"""
        },
        "bd2": {
            "title": "找錢包（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """中明：媽，我跟友美要去喝下午茶，可是我的錢包不在房間裡。
媽媽：客廳的桌子上有一個錢包，是不是你的？
中明：那不是我的，是哥哥的。我的錢包不在客廳裡。
媽媽：沙發下面呢？
中明：沙發上面、下面跟旁邊都沒有。媽，妳幫我找，好嗎？
媽媽：我很忙，現在要去廚房做飯，你再去房間找吧。
中明：啊！在這裡！錢包在我的書下面。"""
        },
        "bd3": {
            "title": "我的房間（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """我的房間裡有一張桌子、一張床跟一張沙發。沙發前面有一台很新的電視機，可是我不常看電視，我最喜歡在沙發上看書。我的書很多，有中文書，也有英文書。我房間的窗戶很大，我的貓喜歡在窗戶旁邊曬太陽。"""
        }
    },
    80: {
        "bd1": {
            "title": "去運動（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """國安：今天天氣不錯，海邊的風景也很漂亮，我想去游泳，妳們想去嗎？
友美：我不會游泳。宜文，妳會游泳嗎？
宜文：我會游泳，可是游得不太好。
國安：我們去跑步，怎麼樣？
友美：我不喜歡跑步，我跑步跑得很慢。
宜文：打網球怎麼樣？中明說妳的網球打得很好，我們一起去打吧。
友美：好啊。"""
        },
        "bd2": {
            "title": "看電影與運動（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """國安：聽說這部電影很有趣，我們晚上一起去看，好不好？
中明：我覺得有一點兒累，我想回家休息。
國安：你不要常常在家上網、看電腦、玩手機，應該去運動。明天我有空，我們可以一起去騎腳踏車。
中明：可是我只想聽音樂、睡覺。
國安：後天去呢？
中明：這兩天天氣有點兒冷，我們週末去，好嗎？"""
        },
        "bd3": {
            "title": "我的興趣（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """我有幾個好朋友，我們都喜歡學中文、聽音樂、唱歌。中明最愛唱歌，他的中文歌唱得很好。平常我們都有點兒忙，可是週末我們常一起去運動，宜文游泳游得不錯，國安的籃球打得很好，我喜歡打網球，有時候我們也一起去看運動比賽。有這幾個好朋友，我真高興！"""
        }
    },
    81: {
        "bd1": {
            "title": "怎麼去天美飯店？（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """友美：元真，我們明天幾點去找妳的韓國朋友？
元真：我們下午四點要到天美飯店，她在那裡等我們。
友美：我們要怎麼去？坐捷運還是坐公車？
元真：聽說那家飯店不遠，我想我們可以從學校走路去。
友美：可是我不知道怎麼走，妳知道嗎？
元真：我也不知道。我們可以先上網看地圖。
友美：啊！上課了！我們先上課吧。
元真：好。"""
        },
        "bd2": {
            "title": "坐捷運去（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """元真：友美，妳看，天美飯店在大學路。我現在知道怎麼走了。
友美：啊！天美飯店在這裡！我知道這個地方，附近有郵局跟超級市場。
元真：我想走路去一定沒問題。
友美：可是我覺得那裡有點兒遠，走路去太累了。
元真：妳想怎麼去？
友美：坐捷運又方便又舒服，我們可以坐捷運。
元真：好，我們明天坐捷運去吧。"""
        },
        "bd3": {
            "title": "從我家坐捷運很方便（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """我家附近有三條捷運線，一條紅的、一條綠的和一條藍的。我平常坐紅線去學校上課，週末也坐捷運去運動、看電影。朋友常來找我，他們都覺得坐捷運來我家，又快又方便。
從我家到機場也不遠，開車去、坐捷運去都可以。機場附近的風景也很漂亮，我常常去看風景、看飛機。"""
        }
    },
    82: {
        "bd1": {
            "title": "買衣服（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """宜文：元真，妳的這條裙子真好看，我很喜歡。
元真：謝謝，這是我去年的生日禮物。
宜文：聽說這個牌子的東西很貴，可是很多人喜歡。
元真：是啊，因為這個牌子很有名，衣服、褲子和裙子也都很好看，所以很多人買。
宜文：妳知道去哪裡買這個牌子的衣服嗎？
元真：知道，百貨公司都有，不難找。
宜文：我很想去看，可是我最近胖了五公斤，我怕衣服不好買。
元真：妳胖了嗎？我不覺得啊，我跟妳一起去看。我也想去買今年夏天的新衣服。
宜文：好，我們找時間一起去。"""
        },
        "bd2": {
            "title": "在百貨公司（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """宜文：妳看，這條黃色的褲子不錯吧？
元真：很好看。這條藍的也很漂亮，藍色是今年很流行的顏色。
宜文：這兩條我都去穿穿看。
元真：妳覺得怎麼樣？
宜文：都太短，也太小了。
元真：沒關係，我們可以下個週末再來看。對了，妳要買鞋子吧？
宜文：是啊，我想買一雙黑色的。
元真：鞋子都在一樓，我們到樓下去吧！九點了，百貨公司快要關了。
宜文：電梯在那裡！我們現在去買。"""
        },
        "bd3": {
            "title": "年輕人喜歡新東西（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """百貨公司裡有很多衣服、鞋子和皮包，都是最新的，所以很多年輕女生喜歡到百貨公司去，漂亮的、流行的衣服，她們都想穿穿看。
很多年輕男生愛在書店看汽車雜誌，汽車很貴，他們不一定可以買新車，可是都看得很開心。
我覺得有的舊東西很不錯，有的新東西也很有趣，我很喜歡看新車、新衣服，可是因為我的錢不多，所以我不常買。"""
        }
    },
    83: {
        "bd1": {
            "title": "我的中文課（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """國安：友美，這幾個句子的意思我不太懂，妳可以教我嗎？
友美：我覺得有點兒難，我也不太懂。
國安：這課真的不好學。
友美：我們可以去問家樂，他非常聰明，我想他懂。
國安：那麼我們現在去找他。
友美：現在他在上書法課，我們四點去吧。
國安：可是從四點到五點半我要上英文課，六點去，怎麼樣？
友美：好。我先回宿舍做功課，再跟你一起去找他。"""
        },
        "bd2": {
            "title": "大教室看書（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """中明：期中考快要到了，老師說我們可以去圖書館對面的大教室看書。
家樂：太好了！在那裡看書很舒服。我們每天都能用那間教室嗎？
中明：我們班只能禮拜一跟禮拜二下午用。
家樂：可是這些時間我都有語言交換，不能去。
中明：別的時間可以嗎？
家樂：我朋友最近比較忙，別的時間他沒有空。
中明：我們去問老師，也許他可以幫你。
家樂：好，希望老師可以幫我。"""
        },
        "bd3": {
            "title": "我喜歡學中文（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """這個學期開始，從星期一到星期五我都有華語課，每天從上午八點四十分到中午十二點上課，下午一點寫功課，有時候也跟同學練習說中文。
最近我的台灣朋友想學日文，請我教他，我也請他教我中文。現在我非常忙，沒有很多時間讀書，可是因為有語言交換，所以我的中文進步了。
下個星期華語課有期中考，我有一點兒緊張，所以每天晚上都讀書，也練習寫字，希望下個星期的考試能考得很好。"""
        }
    },
    84: {
        "bd1": {
            "title": "最近感冒的人很多（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """元真：老師，國安今天要請假。他發燒了，不能來上課。
老師：他發燒了？那他應該去看醫生。
元真：國安跟我說，他今天去看醫生，他家附近有一家不錯的醫院。
老師：最近很多人感冒，你們要戴口罩，也要常常洗手。
元真：老師，我很健康，不常生病。
老師：平常不生病的人也要注意。
元真：對，我應該多注意身體健康。
老師：妳可以帶一些水果去看國安，跟他說應該多喝水，也要多休息。
元真：好，我明天帶一些蘋果去看他。"""
        },
        "bd2": {
            "title": "看醫生（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """醫生：你覺得哪裡不舒服？
國安：我咳嗽、頭痛，鼻子也不舒服。
醫生：最近天氣冷了，很多人感冒了。
國安：對啊！聽說我們學校感冒、發燒的學生很多。
醫生：最近也有很多人肚子痛。
國安：是因為吃的東西不乾淨嗎？
醫生：不是，這也是因為感冒。
國安：請問我需要吃藥嗎？
醫生：我會給你三天的藥。你要記得多喝一點兒水，要是發燒了，就吃紅色的藥。
國安：好，謝謝醫生。"""
        },
        "bd3": {
            "title": "我的同學感冒了（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """最近感冒的人很多，我的同學國安也感冒了，今天開始發燒了。他打電話跟我說，他不能來上課，請我幫他請假。我很擔心他，請他去看醫生，也告訴他要聽醫生的話，不要忘記多喝水、多休息。他說他會去看醫生，請我們不要擔心，如果他好了，就會來學校上課。今天我要帶一些水果去看他，也會跟他說今天的功課。我們都希望他明天能回學校上課。"""
        }
    },
    85: {
        "bd1": {
            "title": "你們是怎麼認識的？（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """宜文：友美，今天的功課妳寫了嗎？
友美：我已經寫了，我現在在寫卡片。
宜文：給誰的卡片？
友美：一個新朋友。妳看，這是他送我的卡片。
宜文：他寫的字真好看。你們是怎麼認識的？
友美：我們是上網認識的，我看到他寫的文章，然後留言問了他一個問題，他回答得很有趣。
宜文：你們常上網聊天嗎？
友美：對啊，差不多每個晚上都聊。昨天他說他想跟我見面。
宜文：妳呢？妳要跟他見面嗎？
友美：我還沒決定。"""
        },
        "bd2": {
            "title": "見面（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """宜文：妳跟那位新朋友見面了沒有？
友美：我還沒決定要不要跟他見面。
宜文：妳擔心什麼？
友美：我有點兒緊張，我以前沒有這種經驗，所以覺得這樣有點兒奇怪。
宜文：妳不要緊張，我有辦法，我跟妳一起去。
友美：太好了，謝謝妳幫我的忙。
宜文：不客氣。妳打算什麼時候跟他見面？
友美：可能這個週末吧。如果妳有空，我再跟他約時間。
宜文：有空啊，但是我明天不會來學校，等妳決定了，再給我打電話吧。"""
        },
        "bd3": {
            "title": "我的新朋友（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """今天我跟一個日本女生見面，她姓小林，叫友美。我們是在網路上認識的。友美看了我寫的文章，留言給我，她覺得我很有趣。我們常上網聊天，上個星期我寄了張卡片給她，約她見面。
我們在一家餐廳見面，友美的同學也來了。那家餐廳很有名，菜單也做得很好看、很特別。我們點了幾盤菜，然後開始聊天，聊得很開心，也一起照了幾張相片。
今天我的心情真好，因為友美太可愛了！我還想再約她出去，希望以後機會常常跟她見面、聊天。"""
        }
    },
    86: {
        "bd1": {
            "title": "你想做什麼工作？（課本對話一）",
            "dropdown_option": "Bài khoá 1",
            "type": "dialogue",
            "content": """中明：你昨天怎麼沒來上課？
國安：我去參加畫畫比賽。你們上課上了什麼？
中明：老師問我們想做什麼工作，大家都說得很高興。
國安：我知道友美想當護理師。別的同學呢？
中明：宜文希望可以用中文和英文工作，所以她以後想當記者，元真相在銀行工作。
國安：那你畢業以後想做什麼？
中明：我以前想當大公司的老闆，可是老闆要做的事情太多，現在覺得當醫生比較好。那你想做什麼？
國安：當醫生很不錯，但是太忙了，我只想每天可以準時上班、下班。"""
        },
        "bd2": {
            "title": "在麵包店工作（課本對話二）",
            "dropdown_option": "Bài khoá 2",
            "type": "dialogue",
            "content": """中明：國安，你每天下課以後都要去麵包店工作，辛苦嗎？
國安：不辛苦。我很喜歡這個工作，因為可以學怎麼做麵包，而且同事也都對我很好。
中明：這樣你在學校的成績，不會有問題嗎？
國安：不會啊！我都先做功課，再去工作。
中明：我以前在餐廳上班過，因為太累了，常常睡得不夠。
國安：這樣真的很辛苦。
中明：有時候早上起得太晚，上課遲到了，而且沒時間準備考試，所以就不做了。
國安：我下午四點到六點上班，工作時間不長，所以沒問題。
中明：兩個小時也可以嗎？那我們麵包店還需要人嗎？
國安：不知道，我明天看到老闆的時候，幫你問他。"""
        },
        "bd3": {
            "title": "工作（課本短文）",
            "dropdown_option": "Bài khoá 3",
            "type": "lesson_text",
            "content": """昨天我看了一個電視節目，有很多父母在節目上談自己的孩子，他們說現在年輕人覺得結不結婚不重要，快樂比較重要；找工作的時候，錢多不多不重要，重要的是喜不喜歡這個工作。
節目裡有人說，很多年輕人喜歡在有冷氣的辦公室裡工作，休息時間還可以喝咖啡、上網，工廠裡辛苦的工作沒有人要做，所以工人常常不夠。
如果大家都只喜歡做舒服的工作，那辛苦的工作誰要做呢？"""
        }
    }
}

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

for lid, texts in LESSONS_DATA.items():
    s_lid = str(lid)
    items = data.get(s_lid, [])
    if len(items) < 2:
        print(f"WARNING: Lesson {lid} has less than 2 items! Skipping.")
        continue

    # Preserving existing dialogue 1 and dialogue 2
    h1 = items[0]
    h2 = items[1]
    h1["dropdown_option"] = "Hội thoại 1"
    h2["dropdown_option"] = "Hội thoại 2"

    new_items = [h1, h2]

    for key in ["bd1", "bd2", "bd3"]:
        info = texts[key]
        mp3_name = f"bk_{lid}_{key}.mp3"
        vtt_name = f"bk_{lid}_{key}.vtt"
        mp3_path = os.path.join(OUT_DIR, mp3_name)
        vtt_path = os.path.join(OUT_DIR, vtt_name)

        print(f"Generating TTS for Lesson {lid} {info['dropdown_option']} ({info['title']})...")
        subs = gen_tts(info["content"], mp3_path, vtt_path)

        new_items.append({
            "title": info["title"],
            "dropdown_option": info["dropdown_option"],
            "type": info["type"],
            "content": info["content"],
            "audio_url": f"audio/dialogue/7/{mp3_name}",
            "script_json": subs
        })
        print(f" -> {len(subs)} sentences synced")

    data[s_lid] = new_items
    print(f"Lesson {lid}: Successfully configured 5 items!")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Update offline bundles
with open(OFF2_PATH, "r", encoding="utf-8") as f:
    off2 = json.load(f)
off2["lesson_contents"] = data

with open(OFF2_PATH, "w", encoding="utf-8") as f:
    json.dump(off2, f, ensure_ascii=False)

with gzip.open(OFF2_GZ, "wb") as f:
    f.write(json.dumps(off2, ensure_ascii=False).encode("utf-8"))

print("ALL LESSONS 75 TO 86 CONFIGURED WITH 5 ITEMS AND SYNCED!")
