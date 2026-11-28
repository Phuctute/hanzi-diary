import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

# ----------------------------------------------------
# 1. FIX LESSON 83
# ----------------------------------------------------
l83 = contents["83"]

# Item 0: 我的中文課（課本對話一）
# ZH:
# 國安：友美，這幾個句子的意思我不太懂，妳可以教我嗎？
# 友美：我覺得有點兒難，我也不太懂。
# 國安：這課真的不好學。
# 友美：我們可以去問家樂，他非常聰明，我想他懂。
# 國安：那麼我們現在去找他。
# 友美：現在他在上書法課，我們四點去吧。
# 國安：可是從四點到五點半我要上英文課，六點去，怎麼樣？
# 友美：好。我先回宿舍做功課，再跟你一起去找他。
l83[0]["vietnamese"] = """Quốc An: Tomomi, ý nghĩa của mấy câu này mình không hiểu lắm, cậu chỉ cho mình được không?
Tomomi: Mình thấy hơi khó một chút, mình cũng không hiểu lắm.
Quốc An: Bài này đúng là không dễ học thật.
Tomomi: Chúng mình có thể đi hỏi Gia Lạc, cậu ấy rất thông minh, mình nghĩ cậu ấy hiểu đấy.
Quốc An: Vậy bây giờ chúng mình đi tìm cậu ấy nhé.
Tomomi: Bây giờ cậu ấy đang học lớp thư pháp, bốn giờ chúng mình đi nhé.
Quốc An: Nhưng từ bốn giờ đến năm giờ rưỡi mình phải học tiếng Anh, sáu giờ đi được không?
Tomomi: Được thôi. Mình về ký túc xá làm bài tập trước, rồi sẽ cùng cậu đi tìm cậu ấy."""

# Item 1: 準備期中考（課本對話二）
# ZH:
# 中明：期中考快要到了，老師說我們可以去圖書館對面的大教室看書。
# 家樂：太好了！在那裡看書很舒服。我們每天都能用那間教室嗎？
# 中明：我們班只能禮拜一跟禮拜二下午用。
# 家樂：可是這些時間我都有語言交換，不能去。
# 中明：別的時間可以嗎？
# 家樂：我朋友最近比較忙，別的時間他沒有空。
# 中明：我們去問老師，也許他可以幫你。
# 家樂：好，希望老師可以幫我。
l83[1]["vietnamese"] = """Trung Minh: Sắp đến kỳ thi giữa kỳ rồi, thầy giáo bảo chúng mình có thể đến phòng học lớn đối diện thư viện để ôn bài.
Gia Lạc: Tuyệt quá! Đọc sách ở đó rất dễ chịu. Ngày nào chúng mình cũng được dùng phòng học đó à?
Trung Minh: Lớp mình chỉ được dùng vào chiều thứ Hai và chiều thứ Ba thôi.
Gia Lạc: Nhưng những giờ đó mình đều có lịch trao đổi ngôn ngữ, không đi được rồi.
Trung Minh: Đổi sang giờ khác được không?
Gia Lạc: Bạn mình dạo này khá bận, giờ khác bạn ấy không rảnh.
Trung Minh: Chúng mình đi hỏi thầy giáo xem, có lẽ thầy giúp được cậu đấy.
Gia Lạc: Được, hy vọng thầy giáo có thể giúp mình."""

# Item 2: 我喜歡學中文（課本短文）
# ZH:
# 這個學期開始，從星期一到星期五我都有華語課，每天從上午八點四十分到中午十二點上課，下午一點寫功課，有時候也跟同學練習說中文。
# 最近我的台灣朋友想學日文，請我教他，我也請他教我中文。現在我非常忙，沒有很多時間讀書，可是因為有語言交換，所以我的中文進步了。
# 下個星期華語課有期中考，我有一點兒緊張，所以每天晚上都讀書，也練習寫字，希望下個星期的考試能考得很好。
l83[2]["vietnamese"] = """Học kỳ này bắt đầu, từ thứ Hai đến thứ Sáu tôi đều có tiết học tiếng Hoa. Mỗi ngày từ 8 giờ 40 phút sáng đến 12 giờ trưa tôi lên lớp, 1 giờ chiều làm bài tập, thỉnh thoảng cũng cùng bạn học luyện nói tiếng Trung.
Gần đây người bạn Đài Loan của tôi muốn học tiếng Nhật, nhờ tôi dạy bạn ấy, tôi cũng nhờ bạn ấy dạy tiếng Trung cho tôi. Bây giờ tôi rất bận, không có nhiều thời gian đọc sách, nhưng nhờ có trao đổi ngôn ngữ nên tiếng Trung của tôi đã tiến bộ.
Tuần sau lớp tiếng Hoa có kỳ thi giữa kỳ, tôi hơi hồi hộp một chút nên mỗi tối đều ôn bài và luyện viết chữ, hy vọng kỳ thi tuần tới sẽ đạt kết quả thật tốt."""

# ----------------------------------------------------
# 2. FIX LESSON 85
# ----------------------------------------------------
l85 = contents["85"]

# Item 0: 你們是怎麼認識的？（課本對話一）
# ZH:
# 家樂：國安，你昨天是不是跟一個女生去喝咖啡？
# 國安：你怎麼知道？
# 家樂：昨天下午我也在那家咖啡店。那個女生是誰？妳的女朋友嗎？
# 國安：不是，她是我的高中同學，叫美美。
# 家樂：你們是怎麼認識的？
# 國安：我們在美國念同一個高中，那時候就認識了。
# 家樂：她也是來台灣學中文的嗎？
# 國安：不是，她來台灣工作。
# 家樂：她在哪裡工作？
# 國安：她在一所小學教英文。
l85[0]["vietnamese"] = """Gia Lạc: Quốc An, hôm qua có phải cậu đi uống cà phê với một bạn nữ không?
Quốc An: Sao cậu biết?
Gia Lạc: Chiều hôm qua mình cũng ở quán cà phê đó. Bạn nữ đó là ai thế? Bạn gái cậu à?
Quốc An: Không phải, cô ấy là bạn học cấp ba của mình, tên là Mỹ Mỹ.
Gia Lạc: Các cậu quen nhau thế nào vậy?
Quốc An: Chúng mình học cùng một trường cấp ba ở Mỹ, hồi đó đã quen nhau rồi.
Gia Lạc: Cô ấy cũng đến Đài Loan học tiếng Trung à?
Quốc An: Không phải, cô ấy đến Đài Loan làm việc.
Gia Lạc: Cô ấy làm việc ở đâu?
Quốc An: Cô ấy dạy tiếng Anh ở một trường tiểu học."""

# Item 1: 見面（課本對話二）
# ZH:
# 宜文：美美，好久不見！
# 美美：好久不見！妳越來越漂亮了。
# 宜文：謝謝。妳什麼時候來台灣的？
# 美美：我上個月來的。
# 宜文：妳住在學校附近嗎？
# 美美：不，我住在台北車站附近。
# 宜文：今天晚上我們一起去吃台灣小吃，怎麼樣？
# 美美：好啊，我很想吃小籠包。
# 宜文：那我們去鼎泰豐吃吧。
l85[1]["vietnamese"] = """Nghi Văn: Mỹ Mỹ, lâu rồi không gặp!
Mỹ Mỹ: Lâu rồi không gặp! Cậu ngày càng xinh đẹp ra đấy.
Nghi Văn: Cảm ơn cậu. Cậu đến Đài Loan khi nào thế?
Mỹ Mỹ: Mình đến từ tháng trước.
Nghi Văn: Cậu sống ở gần trường à?
Mỹ Mỹ: Không, mình sống ở gần ga Đài Bắc.
Nghi Văn: Tối nay chúng mình cùng đi ăn món ăn vặt Đài Loan nhé, được không?
Mỹ Mỹ: Được chứ, mình rất muốn ăn bánh bao xúp (tiểu long bao).
Nghi Văn: Vậy chúng mình đến Đỉnh Thái Phong ăn nhé."""

# ----------------------------------------------------
# 3. FIX LESSON 86
# ----------------------------------------------------
l86 = contents["86"]

# Item 1: 在麵包店工作（課本對話二）
# ZH:
# 友美：中明，你在麵包店打工，工作忙不忙？
# 中明：週末很忙，平日還好。
# 友美：你在那裡做什麼？
# 中明：我負責收銀，有時候也幫忙排麵包。
# 友美：老闆跟同事對你好嗎？
# 中明：他們都對我很好，常常送我新鮮的麵包。
# 友美：真好！那我也想去打工。
# 中明：下個月我們店裡要找新人，妳要來試試看嗎？
# 友美：好啊，請你幫我問問老闆。
# 中明：沒問題，明天我上班的時候問他。
l86[1]["vietnamese"] = """Tomomi: Trung Minh, cậu làm thêm ở tiệm bánh mì, công việc có bận không?
Trung Minh: Cuối tuần thì rất bận, ngày thường thì cũng vừa phải.
Tomomi: Cậu làm những việc gì ở đó?
Trung Minh: Mình phụ trách thu ngân, thỉnh thoảng cũng phụ xếp bánh mì.
Tomomi: Ông chủ và đồng nghiệp đối xử với cậu có tốt không?
Trung Minh: Mọi người đều rất tốt với mình, thường tặng mình bánh mì tươi mới ra lò.
Tomomi: Thích thật đấy! Thế mình cũng muốn đến làm thêm.
Trung Minh: Tháng sau tiệm mình tuyển người mới, cậu có muốn đến thử không?
Tomomi: Được chứ, nhờ cậu hỏi ông chủ giúp mình nhé.
Trung Minh: Không thành vấn đề, ngày mai lúc đi làm mình sẽ hỏi ông ấy."""

# ----------------------------------------------------
# 4. FIX LESSON 121 (QUYỂN 3 BÀI 15 - ĐẠM THỦY)
# ----------------------------------------------------
l121 = contents["121"]
# Sửa Item 0: Thay thế toàn bộ chữ lỗi chính tả STT và bản dịch ngớ ngẩn gà xương/mèo đỏ
it121_0 = l121[0]
raw_c = it121_0.get("content", "")
# Sửa các từ sai chính tả tiếng Trung
fixed_c = raw_c
stt_rep = {
    "骨雞": "古蹟",
    "紅貓城": "紅毛城",
    "四秒": "寺廟",
    "餐館龍山寺": "參觀龍山寺",
    "克的": "刻得",
    "發採": "發財",
    "家傷": "家鄉",
    "攤關": "參觀",
    "有修理": "又修理",
    "預期雕刻": "玉器雕刻"
}
for k, v in stt_rep.items():
    fixed_c = fixed_c.replace(k, v)

it121_0["content"] = fixed_c

# Dịch chuẩn xác tiếng Việt cho Item 0 (L121)
it121_0["vietnamese"] = """Dong-hyun: Thầy giáo yêu cầu chúng tôi viết một bài báo cáo.
Gia Hào: Chủ đề là các di tích lịch sử của Đài Loan.
Dong-hyun: Tôi muốn giới thiệu về Hồng Mao Thành (Fort San Domingo).
Gia Hào: Cuối tuần này phải đi một chuyến rồi.
Dong-hyun: Hồng Mao Thành mà cậu nói, chính là di tích lịch sử nổi tiếng ở Đạm Thủy đúng không?
Gia Hào: Tôi biết, Hồng Mao Thành là một tòa nhà di tích cổ kính.
Dong-hyun: Nó có nét đặc sắc gì thế?
Gia Hào: Hồng Mao Thành do người Hà Lan xây dựng từ ba bốn trăm năm trước.
Dong-hyun: Trong lịch sử Đài Loan, nó mang ý nghĩa chính trị và ngoại giao quan trọng.
Gia Hào: Nghe thú vị thật đấy. Cuối tuần tôi đi cùng cậu nhé.
Dong-hyun: Được thôi!
Gia Hào: Thế thì trước tiên tôi sẽ đưa cậu đi tham quan chùa Long Sơn.
Dong-hyun: Ở đó có những cột rồng chạm khắc bằng đá, khắc vô cùng sống động.
Gia Hào: Những ai từng xem đều bảo mấy con rồng đó trông như sắp bay lên vậy, là tác phẩm nghệ thuật vô cùng tuyệt vời.
Dong-hyun: Trang web du lịch cũng nói chùa Long Sơn có vị thế tôn giáo rất quan trọng, rất đáng để tham quan.
Gia Hào: Đối với người Đài Loan, chùa Long Sơn không chỉ là một di tích lịch sử, mà còn là nơi bái Phật cầu bình an, sức khỏe và phát tài.
Dong-hyun: Nghe cậu kể làm tôi nhớ đến nhà thờ ở quê nhà. Từ khi tôi có ký ức, cả nhà tôi chủ nhật nào cũng đi nhà thờ.
Gia Hào: Quảng trường cạnh nhà thờ, cứ đến ngày nghỉ là có người đến dựng quầy bán đồ lưu niệm tôn giáo, đồ ăn và đồ dùng nhỏ.
Dong-hyun: Nơi này cũng rất giống Đài Loan. Ở Đài Loan, chùa chiền thường là trung tâm đời sống của người dân địa phương.
Gia Hào: Người sống gần đó ngoài việc thường đến thắp hương cầu nguyện, còn buôn bán xung quanh, cứ đến cuối tuần là náo nhiệt vô cùng.
Dong-hyun: Tôi từng đến Văn Miếu ở Đài Nam, rồi các ngôi chùa Phật giáo, Đạo giáo, tình hình cũng tương tự như vậy.
Gia Hào: Cậu từ nhỏ đã theo đạo Thiên Chúa, có dịp tôi sẽ đưa cậu đi tham quan các nhà thờ Thiên Chúa và Tin Lành.
Dong-hyun: Một số nhà thờ cổ kính được bảo tồn lại, giờ đã trở thành di tích lịch sử nổi tiếng đấy.
Gia Hào: Tuyệt quá! Như vậy tôi có thể hiểu rõ hơn sự khác biệt giữa văn hóa tôn giáo phương Đông và phương Tây.
Dong-hyun: Thực ra, việc bảo tồn tốt các di tích lịch sử là vô cùng quan trọng. Mấy năm trước tôi thấy tin một di tích bị thiêu rụi, lúc đó cảm thấy rất đau lòng, không từ ngữ nào diễn tả được.
Gia Hào: Tôi hiểu cảm xúc của cậu. Nếu mọi người không coi trọng sự tồn tại của di tích, bị tàn phá rồi mới tu sửa thì xét về giá trị văn hóa và lịch sử đều vô cùng đáng tiếc.
Dong-hyun: Đúng vậy, di tích lịch sử ghi lại dấu ấn tổ tiên từng sinh sống trên mảnh đất này. Nếu mất đi thì ký ức về quê hương cũng không còn nữa.
Gia Hào: Thôi nào, cậu đừng lo lắng quá, chúng mình chuyển sang chủ đề vui vẻ hơn đi!
Dong-hyun: Ừ, ngoài Hồng Mao Thành ra, tôi còn có thể đưa cậu ra bến tàu Đạm Thủy ngắm hoàng hôn. Ai cũng khen hoàng hôn ở đó đẹp không chê vào đâu được.
Gia Hào: Tuyệt vời! May mà có cậu là bạn thân của tôi, sẵn sàng làm hướng dẫn viên, nếu không tôi đã chẳng được ngắm hoàng hôn tuyệt đẹp, càng không hiểu được các di tích lịch sử Đài Loan.
Dong-hyun: Cậu đừng đùa nữa, tôi đâu phải là hướng dẫn viên chuyên nghiệp đâu. Cuối tuần này tôi định trò chuyện với người dân địa phương, nghe lịch sử từ chính miệng họ kể chắc chắn sẽ thú vị hơn nhiều.
Gia Hào: Đúng vậy, thế thì hẹn cậu cuối tuần nhé!"""

with open("data/lesson_contents.json", "w", encoding="utf-8") as f:
    json.dump(contents, f, ensure_ascii=False, indent=2)

print("FIX COMPLETE FOR L83, L85, L86, L121!")
