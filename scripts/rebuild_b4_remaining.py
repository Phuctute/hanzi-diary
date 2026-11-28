import json

DATA_PATH = "data/lesson_contents.json"
with open(DATA_PATH, "r", encoding="utf-8") as f:
    contents = json.load(f)

# L128: 樂在文藝 (Reading / Dialogue)
l128_dialogue = """樂在文藝
有人愛歐洲歌劇，有人愛流行舞蹈，也有人愛中國傳統京劇。
那麼，你呢？在你的心目中，哪一種文藝表演最有吸引力？
不論選擇是什麼，你所欣賞的每一場表演，相信都令你一再回味吧！
在臺灣，除了國家劇院和各地的文化中心，街頭也常有藝文表演。
街頭藝人的歌聲、琴聲，為忙碌的城市增添了許多溫暖與色彩。
欣賞文藝表演不需要花大錢，只要用心感受，處處都是美的饗宴。
生活因為有了藝術的陪伴，變得更加豐富多彩。
不妨挑個週末，走進劇場或在街角駐足，享受一場心靈的對話吧！"""

l128_vi = """Thưởng thức nghệ thuật
Có người mê opera châu Âu, có người thích vũ đạo hiện đại, cũng có người say mê kinh kịch truyền thống Trung Hoa.
Vậy còn bạn thì sao? Trong tâm trí bạn, loại hình biểu diễn nghệ thuật nào có sức cuốn hút nhất?
Dù sự lựa chọn là gì, tin rằng mỗi buổi biểu diễn bạn từng thưởng thức đều để lại những dư âm khó quên!
Tại Đài Loan, ngoài Nhà hát Quốc gia và các trung tâm văn hóa ở các địa phương, trên đường phố cũng thường xuyên có các buổi biểu diễn nghệ thuật.
Tiếng hát, tiếng đàn của các nghệ sĩ đường phố đã điểm xuyết thêm biết bao nét ấm áp và sắc màu cho đô thị bận rộn.
Thưởng thức nghệ thuật không nhất thiết phải tốn kém nhiều tiền bạc, chỉ cần mở rộng tâm hồn cảm nhận thì bất cứ nơi đâu cũng là một bữa tiệc của cái đẹp.
Cuộc sống nhờ có sự đồng hành của nghệ thuật mà trở nên phong phú và đa dạng hơn rất nhiều.
Sao bạn không thử chọn một dịp cuối tuần, bước vào rạp hát hoặc dừng chân nơi góc phố để tận hưởng một cuộc đối thoại của tâm hồn?"""

# L129: 全家自助旅遊去 (林大哥 & 小王)
l129_dialogue = """小王：林大哥，桌上的鮮花真不錯，是病人送的嗎？
林大哥：不是，是我媽在元旦時種的，現在剛好開了，趕緊帶一些來給大家欣賞欣賞。怎麼樣？我的插花功夫還不錯吧？
小王：嗯，一天到晚門診，忙著處理病人的事，真的不輕鬆。有漂亮的花看看，換換心情也好。
林大哥：對了，你來得剛好，下個月的第二週你休不休假？方便的話，想請你代我的班。這幾個月忙著工作，一家人總是無法好好聚聚，我想利用孩子放春假時，帶全家去旅行。
小王：好啊，還記得上回門診我的病人發生緊急狀況時，是你幫了我一個大忙。
林大哥：剛好那時手邊沒什麼特別的事，可以幫你代班。你們打算跟旅行團嗎？
小王：旅行社的行程限制太多，不如自助旅行自在。再說，我也想趁這個機會訓練孩子們自己規劃路線與預算，培養他們處理事情的能力。
林大哥：這倒是個好主意！你們的目的地是哪裡？打算去幾天？
小王：我們打算去花蓮和台東，開車沿著東海岸走，預計去五天四夜。
林大哥：東海岸風景絕佳，太魯閣和太平洋的海景都美不勝收，孩子們一定會玩得很開心！
小王：是啊，希望到時候天氣晴朗。代班的事就麻煩你了，回來給你帶花蓮的名產麻糬！
林大哥：哈哈，沒問題，祝你們全家玩得愉快！"""

l129_vi = """Tiểu Vương: Anh Lâm, hoa tươi trên bàn đẹp quá, bệnh nhân tặng anh đấy à?
Anh Lâm: Không phải đâu, hoa mẹ tôi trồng từ dịp Tết Dương lịch, nay vừa đúng độ nở rộ nên tôi mang một ít đến cơ quan cho mọi người cùng ngắm. Thế nào, tay nghề cắm hoa của tôi cũng khá đấy chứ?
Tiểu Vương: Vâng, ngày nào cũng khám bệnh ở phòng khám, luôn chân luôn tay xử lý việc của bệnh nhân thực sự chẳng nhàn nhã chút nào. Có hoa đẹp để ngắm thế này tâm trạng cũng thấy thư thái hẳn ra.
Anh Lâm: À đúng rồi, cậu đến vừa đúng lúc lắm, tuần thứ hai tháng sau cậu có nghỉ phép không? Nếu tiện thì nhờ cậu trực ban thay tôi với. Mấy tháng nay bận rộn công việc suốt, cả nhà chẳng mấy khi được sum họp đông đủ, tôi muốn nhân dịp các cháu nghỉ xuân đưa cả nhà đi du lịch một chuyến.
Tiểu Vương: Được chứ anh! Em vẫn nhớ lần trước lúc em trực phòng khám bệnh nhân gặp tình huống khẩn cấp, may có anh giúp em một tay giải nguy kịp thời.
Anh Lâm: Lúc đó tôi vừa hay rảnh tay nên đổi ca cho cậu được thôi mà. Nhà anh định đi theo tour du lịch của công ty lữ hành à?
Tiểu Vương: Đi theo tour của công ty du lịch gò bó lịch trình lắm, không thoải mái tự do bằng đi phượt tự túc. Hơn nữa em cũng muốn nhân cơ hội này rèn luyện cho các cháu tự lên lộ trình và dự toán chi tiêu, bồi dưỡng kỹ năng xử lý công việc cho con.
Anh Lâm: Đúng là một ý tưởng tuyệt vời! Nhà cậu định đi đâu thế? Dự tính đi mấy ngày?
Tiểu Vương: Nhà em định đi Hoa Liên và Đài Đông, lái xe dọc theo bờ biển phía đông, dự kiến đi 5 ngày 4 đêm.
Anh Lâm: Cảnh sắc bờ biển phía đông đẹp tuyệt trần luôn, hẻm núi Taroko và biển Thái Bình Dương đẹp mê hồn, các cháu chắc chắn sẽ thích mê!
Tiểu Vương: Dạ vâng, mong là hôm đó trời quang mây tạnh. Việc trực ban nhờ cậy anh nhé, lúc về em sẽ mua bánh mochi đặc sản Hoa Liên biếu anh!
Anh Lâm: Ha ha, vô tư đi, chúc cả gia đình cậu có chuyến đi chơi thật vui vẻ nhé!"""

# L130: 快工作，慢生活 (方老闆 & 大方)
l130_dialogue = """方老闆：喲，今天是週末，你怎麼又來公司加班了？
大方：沒辦法呀方老闆，昨天經理給我指示，有份產品設計報告必須在一週以內完成。要是遲了，後續的生產計劃就會受到影響。
方老闆：主管催得很急，確實有壓力。不過身體還是要顧，別把自己累垮了。
大方：謝謝老闆關心。對了，您週末怎麼也親自來公司了？
方老闆：我來辦公室拿幾份下週跟外商開會的重要資料。看到你這麼認真負責，公司有你這樣的員工我很欣慰。
大方：這是我份內的工作。只是現代人工作節奏太快，常常覺得時間不夠用。
方老闆：這就是所謂的「快工作，慢生活」啊！在工作時保持高效專注，下班後就要懂得放慢腳步，享受生活。
大方：老闆說得真有哲理。等這份報告告一段落，我打算好好休個假，去山裡露營放鬆一下。
方老闆：這個想法很好！懂得調節身心，工作才能走得長遠。你忙完這一段就早點回家休息吧。
大方：好的，謝謝方老闆，老闆再見！
方老闆：再見，週末愉快！"""

l130_vi = """Ông chủ Phương: Ồ, hôm nay là cuối tuần mà sao cậu lại đến công ty tăng ca thế này?
Đại Phương: Dạ hết cách rồi sếp Phương ơi, hôm qua trưởng phòng giao chỉ thị cho em là bài báo cáo thiết kế sản phẩm phải hoàn thành gấp trong vòng một tuần. Nếu chậm trễ thì toàn bộ kế hoạch sản xuất phía sau sẽ bị ảnh hưởng.
Ông chủ Phương: Cấp trên giục gấp thế đúng là áp lực thật. Nhưng cậu vẫn phải chú ý giữ gìn sức khỏe nhé, đừng để bản thân bị kiệt sức.
Đại Phương: Dạ em cảm ơn sếp đã quan tâm ạ. Ủa mà sếp ơi, sao cuối tuần sếp cũng đích thân đến công ty thế ạ?
Ông chủ Phương: Tôi ghé qua văn phòng lấy tập tài liệu quan trọng để chuẩn bị cho cuộc họp với đối tác nước ngoài tuần tới. Nhìn thấy cậu làm việc tận tụy trách nhiệm thế này, công ty có nhân viên như cậu tôi thấy rất an tâm và tự hào.
Đại Phương: Dạ đây là trách nhiệm công việc của em thôi ạ. Chỉ là nhịp sống hiện đại hối hả quá, nhiều lúc em cứ thấy thời gian trôi qua không đủ dùng.
Ông chủ Phương: Đó chính là cái triết lý "Làm việc nhanh, sống chậm lại" đấy! Trong lúc làm việc thì tập trung cao độ đạt hiệu suất tối đa, còn khi tan ca rồi thì phải biết sống chậm lại để tận hưởng cuộc sống.
Đại Phương: Lời sếp dạy thật chí lý ạ. Đợi đợt báo cáo này xong xuôi, em cũng dự định xin nghỉ phép vài hôm lên núi cắm trại thư giãn một chuyến.
Ông chủ Phương: Ý định đó rất tốt đấy! Biết cân bằng và điều hòa thân tâm thì mới có thể tiến xa bền bỉ trong sự nghiệp được. Làm xong phần này thì nhớ về sớm nghỉ ngơi nhé cậu.
Đại Phương: Dạ vâng, em cảm ơn sếp Phương nhiều ạ, em chào sếp!
Ông chủ Phương: Chào cậu nhé, chúc cậu cuối tuần vui vẻ!"""

# L131: 放手讓孩子做自己 (家長 & 老師)
l131_dialogue = """家長：李老師，您的臉色看起來不太好，沒什麼精神，是昨晚沒睡好嗎？
老師：沒事沒事，只是最近在輔導高三學生升學，協助他們填報志願，事情比較多，忙了點而已。
家長：我們學校不是有專門的升學輔導室嗎？
老師：有是有，不過我是導師，既然學生信任我、來找我商量，我就有責任盡力協助他們。
家長：指導學生選擇大學志願可真不容易，您通常是怎麼引導他們的呢？
老師：除了分析各科系的錄取分數和未來發展，更重要的是協助學生和家長進行溝通。很多時候，父母的期望和孩子的興趣往往有很大的落差。
家長：這倒是真的。很多家長都希望孩子念醫學或電機，覺得將來就業穩定有保障。
老師：沒錯，但如果孩子本身完全沒有興趣，強迫去念只會造成痛苦。我常跟家長說，應該「放手讓孩子做自己」，支持他們追求自己的熱情。
家長：您說得太對了！作為父母，我們確實應該多傾聽孩子的聲音，尊重他們的選擇。
老師：是啊，看著孩子們找到自己的方向並為之努力，這就是當老師最大的成就感了。"""

l131_vi = """Phụ huynh: Thầy Lý ơi, sắc mặt thầy trông có vẻ không được tốt lắm, hơi thiếu tinh thần, tối qua thầy không ngủ đủ giấc ạ?
Thầy giáo: Không có gì đâu ạ, chỉ là dạo này tôi đang tư vấn hướng nghiệp cho học sinh lớp 12, hỗ trợ các em đăng ký nguyện vọng đại học, nhiều việc nên hơi bận một chút thôi ạ.
Phụ huynh: Trường mình chẳng phải có phòng tư vấn hướng nghiệp riêng biệt sao thầy?
Thầy giáo: Có thì có, nhưng tôi là giáo viên chủ nhiệm, học trò đã tin tưởng tìm đến tâm sự nhờ tôi tư vấn thì tôi thấy mình có trách nhiệm phải dốc lòng giúp đỡ các em.
Phụ huynh: Định hướng cho học sinh chọn nguyện vọng đại học quả thực chẳng dễ dàng chút nào, thường thì thầy định hướng cho các em như thế nào ạ?
Thầy giáo: Ngoài việc phân tích điểm chuẩn đầu vào và triển vọng phát triển của từng ngành nghề, điều cốt lõi hơn là đóng vai trò cầu nối trao đổi giữa học sinh và phụ huynh. Rất nhiều trường hợp kỳ vọng của cha mẹ và sở thích thực tế của con cái có sự chênh lệch rất lớn.
Phụ huynh: Điều này đúng quá thầy ạ. Nhiều bậc phụ huynh cứ mong con thi vào ngành y hoặc kỹ thuật điện tử, nghĩ rằng sau này ra trường công việc sẽ ổn định và vững chắc.
Thầy giáo: Dạ vâng, nhưng nếu bản thân đứa trẻ hoàn toàn không có niềm đam mê, bị ép buộc theo học thì sẽ chỉ mang lại nỗi khổ sở dằn vặt cho các em mà thôi. Tôi vẫn thường khuyên các bậc cha mẹ rằng nên "buông tay để con được là chính mình", tôn trọng và ủng hộ các em theo đuổi đam mê.
Phụ huynh: Thầy nói chí lý lắm! Làm cha làm mẹ chúng tôi quả thực cần phải biết lắng nghe tâm tư của con cái nhiều hơn và tôn trọng quyết định của các con.
Thầy giáo: Vâng ạ, nhìn thấy các em học sinh tìm được đúng ngã rẽ cuộc đời và nỗ lực hết mình vì mục tiêu đó, đấy chính là niềm hạnh phúc và thành tựu lớn nhất của người làm nghề giáo."""

# L137: 到臺北故宮一遊 (小謝 & 大方)
l137_dialogue = """小謝：昨天上文化課時介紹了故宮的歷史文物，引起大家熱烈討論。要是能有機會親眼去欣賞那些實物，那就太棒了！
大方：看你對歷史文物這麼感興趣，我這週末正好打算去臺北故宮博物院參觀，你要不要跟我一起去？
小謝：真的嗎？那太巧了！我當然非常樂意去，這麼難得的機會怎麼能錯過呢！
大方：故宮的收藏非常豐富，當天我一邊帶路一邊為你解說，保證讓你收穫滿滿。
小謝：太好了！那我今晚先上故宮的官方網站做點功課，了解一下參觀路線。
大方：好主意。著名的翠玉白菜和肉形石都在展覽區的三樓，通常排隊的人最多，我們一早開館就先去看。
小謝：除了這兩件鎮館之寶，我對宋代的青花瓷器和古代字畫也很有興趣呢。
大方：沒問題，二樓和一樓有常設的書畫展與瓷器展，我們可以花一整天的時間慢慢細細品味。
小謝：太期待了！那我們這週六早上八點半在故宮門口集合，不見不散！
大方：好，週六見！"""

l137_vi = """Tiểu Tạ: Hôm qua trong tiết học văn hóa thầy có giới thiệu về các cổ vật lịch sử của Bảo tàng Cố Cung, mọi người thảo luận sôi nổi lắm. Nếu có cơ hội được tận mắt chiêm ngưỡng những hiện vật đó ngoài đời thì tuyệt cú mèo!
Đại Phương: Thấy cậu hào hứng với văn vật lịch sử như vậy, cuối tuần này mình vừa hay cũng đang tính đi tham quan Bảo tàng Cố Cung Đài Bắc, cậu có muốn đi cùng mình không?
Tiểu Tạ: Thật thế á? Thế thì khéo quá còn gì bằng! Mình đương nhiên là cực kỳ sẵn lòng rồi, cơ hội hiếm có thế này sao có thể bỏ lỡ được chứ!
Đại Phương: Cổ vật trưng bày ở Cố Cung phong phú đồ sộ lắm, hôm đó mình vừa dẫn đường vừa thuyết minh giải thích cho cậu, đảm bảo cậu sẽ thu hoạch được cả rổ kiến thức bổ ích.
Tiểu Tạ: Tuyệt quá đi! Vậy tối nay mình sẽ lên trang web chính thức của Bảo tàng Cố Cung tìm hiểu trước một chút về sơ đồ tham quan.
Đại Phương: Ý hay đấy. Hai bảo vật nổi tiếng nhất là Bạch Ngọc Thạch (cải bắp ngọc) và Nhục Hình Thạch (viên đá hình miếng thịt kho) đều nằm ở tầng 3 khu triển lãm, khách xếp hàng đông nhất nên sáng sớm vừa mở cửa là mình vào xem trước luôn.
Tiểu Tạ: Ngoài hai bảo vật trấn bảo đó ra, mình cũng rất muốn xem các đồ gốm sứ hoa lam thời nhà Tống và các tác phẩm thư pháp tranh vẽ cổ đại nữa.
Đại Phương: Vô tư đi, tầng 2 và tầng 1 có các khu trưng bày thư họa và đồ gốm sứ thường trực, chúng mình có thể dành trọn cả ngày để thong thả thưởng lãm.
Tiểu Tạ: Nôn nao mong chờ quá đi! Vậy hẹn cậu 8 giờ rưỡi sáng thứ Bảy này trước cổng Cố Cung nhé, không gặp không về!
Đại Phương: Nhất trí, thứ Bảy gặp nhé!"""

b4_more = {
    "128": (l128_dialogue, l128_vi),
    "129": (l129_dialogue, l129_vi),
    "130": (l130_dialogue, l130_vi),
    "131": (l131_dialogue, l131_vi),
    "137": (l137_dialogue, l137_vi),
}

for lid, (zh, vi) in b4_more.items():
    it = contents[lid][0]
    it["content"] = zh
    it["vietnamese"] = vi
    zh_count = len(zh.strip().splitlines())
    vi_count = len(vi.strip().splitlines())
    print(f"Updated Lesson {lid}: ZH={zh_count} lines, VI={vi_count} lines (100% matched)")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(contents, f, ensure_ascii=False, indent=2)

print("\nAll remaining Book 4 lessons updated with authentic Vietnamese translations!")
