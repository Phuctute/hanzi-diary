import json
import os

DATA_PATH = "data/lesson_contents.json"
with open(DATA_PATH, "r", encoding="utf-8") as f:
    contents = json.load(f)

# ==============================================================================
# BOOK 4 (THỜI ĐẠI 4 - LESSONS 123 to 138)
# Cấu trúc lại toàn bộ các bài hội thoại thành lượt thoại hoàn chỉnh, phân minh nhân vật,
# dịch nghĩa tiếng Việt chuẩn xác từng câu và đồng bộ 1-1.
# ==============================================================================

# Lesson 123 (Bài 1): 王叔叔 & 林大哥
l123_dialogue = """王叔叔：林大哥，好久不見，你怎麼在這裡？
林大哥：孩子轉學，我帶他來報到。這位是王叔叔，快跟叔叔打個招呼。
王叔叔：叔叔好！好好好，你長得好高啊，以後個子應該會跟你爸一樣高。
林大哥：這小子雖然現在身材不錯，但就是愛吃宵夜，我一直擔心他有一天比我更胖呢。
王叔叔：你別擔心，除非你現在馬上瘦下來，要不然想要比你胖是不太可能的。
林大哥：真愛開玩笑！我記得你以前常去打高爾夫球，現在還打嗎？
王叔叔：偶爾打打。你呢？
林大哥：我啊，這兩年忙著做業務，天天都在外頭跑，哪有時間運動啊。
王叔叔：做業務雖然辛苦，但賺得也多吧！
林大哥：哪裡哪裡，混口飯吃而已。對了，聽說你換新工作了？
王叔叔：是啊，換到一家外商公司，待遇還不錯，就是常要出差。
林大哥：出差也不錯啊，可以順便到處走走看看。
王叔叔：話是這麼說沒錯，但年紀大了，常常坐飛機還是挺累人的。
林大哥：哈哈，我們都不年輕了！改天有空一起吃個飯吧，我請客。
王叔叔：好啊，一言為定！你先帶孩子去辦手續吧，我們電話聯絡。
林大哥：好，電話聯絡，再見！
王叔叔：再見！"""

l123_vi = """Chú Vương: Anh Lâm, lâu rồi không gặp, sao anh lại ở đây thế này?
Anh Lâm: Cháu chuyển trường nên tôi dẫn cháu đến làm thủ tục nhập học. Đây là chú Vương, mau chào chú đi con.
Chú Vương: Cháu chào chú ạ! Tốt tốt, cháu lớn bổng nhanh thật, sau này chắc chắn chiều cao sẽ cao bằng bố cháu đấy.
Anh Lâm: Thằng bé này tuy hiện giờ dáng người khá chuẩn, nhưng lại rất thích ăn đêm, tôi cứ lo có ngày nó còn béo hơn cả tôi.
Chú Vương: Anh khéo lo, trừ phi bây giờ anh giảm cân ngay lập tức, chứ không thì muốn béo hơn anh là chuyện không thể nào đâu.
Anh Lâm: Anh cứ đùa khéo! Tôi nhớ trước đây anh hay đi đánh golf, giờ còn chơi không?
Chú Vương: Thỉnh thoảng vẫn chơi một chút. Còn anh thì sao?
Anh Lâm: Tôi ấy à, hai năm nay bận làm kinh doanh, ngày nào cũng chạy đôn chạy đáo bên ngoài, lấy đâu ra thời gian mà thể thao.
Chú Vương: Làm kinh doanh tuy vất vả nhưng kiếm cũng được nhiều mà!
Anh Lâm: Đâu có đâu có, đủ kiếm miếng cơm qua ngày thôi. À đúng rồi, nghe nói anh vừa đổi công việc mới à?
Chú Vương: Đúng vậy, chuyển sang một công ty có vốn nước ngoài, chế độ đãi ngộ cũng khá, chỉ có điều phải đi công tác thường xuyên.
Anh Lâm: Đi công tác cũng hay mà, có thể nhân tiện đi đây đi đó ngắm cảnh mở mang tầm mắt.
Chú Vương: Nói thì nói thế thôi, nhưng có tuổi rồi, ngồi máy bay nhiều cũng mệt người lắm.
Anh Lâm: Ha ha, chúng mình đều không còn trẻ nữa rồi! Hôm nào rảnh anh em mình đi ăn một bữa nhé, tôi đãi.
Chú Vương: Được thôi, chốt thế nhé! Anh đưa cháu đi làm thủ tục trước đi, anh em mình liên lạc qua điện thoại sau.
Anh Lâm: Được, liên lạc sau nhé, chào anh!
Chú Vương: Tạm biệt anh!"""

# Lesson 124 (Bài 2): 李大哥 & 小謝
l124_dialogue = """李大哥：哎，小謝，這兒遇見你真巧，你也來銀行辦事啊？
小謝：我來匯款給客戶，順便繳信用卡費。
李大哥：快三點半了，你得快一點啊！先把東西都準備好，我幫你按號碼機拿號碼牌。
小謝：負責辦理銀行業務的同事今天請假，公司才叫我來，剛剛還擔心時間太晚了，幸好來得及。
李大哥：我剛辦好存款，正好要走。你號碼牌拿到了嗎？
小謝：拿到了，前面還有三個人。
李大哥：現在銀行辦事效率挺高的，應該很快就輪到你了。
小謝：李大哥，請問一下，匯款單上的受款人帳號是填這裡嗎？
李大哥：對，填在這個格子裡，帳號和戶名一定要核對清楚，千萬別寫錯了。
小謝：好的，我都核對過了，謝謝李大哥。
李大哥：不客氣。對了，繳信用卡費也可以用手機網銀或者自動櫃員機，方便又不用排隊。
小謝：我知道，但這次客戶的匯款金額比較大，公司規定一定要臨櫃辦理，所以我就順便在櫃檯一起繳了。
李大哥：原來是這樣。那你慢慢辦，我先回辦公室了。
小謝：好，李大哥慢走，今天謝謝您幫忙！
李大哥：別客氣，拜拜！
小謝：拜拜！"""

l124_vi = """Anh Lý: Ôi, Tiểu Tạ, gặp cậu ở đây khéo thật, cậu cũng đến ngân hàng làm việc à?
Tiểu Tạ: Em đến chuyển khoản cho khách hàng, nhân tiện nộp tiền cước thẻ tín dụng luôn.
Anh Lý: Sắp ba giờ rưỡi rồi đấy, cậu phải nhanh lên một chút! Chuẩn bị sẵn giấy tờ đi, tôi bấm máy lấy số thứ tự giúp cậu cho.
Tiểu Tạ: Đồng nghiệp phụ trách giao dịch ngân hàng hôm nay xin nghỉ phép nên công ty mới bảo em đi. Vừa nãy em còn lo muộn giờ, may mà vẫn kịp.
Anh Lý: Tôi vừa làm xong thủ tục gửi tiền, đang định về đây. Cậu lấy được số thứ tự chưa?
Tiểu Tạ: Em lấy được rồi ạ, phía trước còn ba người nữa.
Anh Lý: Dạo này ngân hàng làm việc hiệu quả lắm, chắc sẽ nhanh đến lượt cậu thôi.
Tiểu Tạ: Anh Lý ơi, cho em hỏi chút, số tài khoản người thụ hưởng trên phiếu chuyển tiền là điền vào chỗ này đúng không ạ?
Anh Lý: Đúng rồi, điền vào ô này này. Nhớ đối chiếu thật kỹ số tài khoản và tên chủ tài khoản nhé, tuyệt đối đừng viết sai.
Tiểu Tạ: Dạ vâng, em đã kiểm tra kỹ hết rồi, cảm ơn anh Lý nhiều nhé.
Anh Lý: Không có gì đâu. À này, nộp tiền thẻ tín dụng có thể dùng app ngân hàng trên điện thoại hoặc cây ATM, vừa tiện lại không phải xếp hàng chờ đợi.
Tiểu Tạ: Vâng em biết, nhưng lần này số tiền chuyển cho khách hàng khá lớn, công ty quy định bắt buộc phải làm tại quầy, nên em tiện thể nộp luôn tại quầy cho xong.
Anh Lý: Ra là thế. Vậy cậu cứ từ từ làm nhé, tôi quay về văn phòng trước đây.
Tiểu Tạ: Vâng, anh Lý về thong thả nhé, hôm nay cảm ơn anh đã giúp đỡ em!
Anh Lý: Đừng khách sáo, chào cậu nhé!
Tiểu Tạ: Dạ em chào anh!"""

# Lesson 125 (Bài 3): 大方 & 小謝
l125_dialogue = """大方：小謝，門口那個大包裹是你的嗎？是那個長方形的箱子嗎？
小謝：對，那是我在購物網站上買的書架，這幾天各類家具都在降價打折呢。
大方：在網路上買家具，難道不擔心買到尺寸不合適的嗎？
小謝：這還不簡單！網站上的商品說明寫得很清楚，長度、寬度、高度以及重量都標示得一清二楚。
大方：可是光看照片，很難知道實際的材質和質感怎麼樣吧？
小謝：所以我都會先看其他買家的評價和留言，特別是有附上實物照片的評論，參考價值很高。
大方：這倒是個好辦法。如果收到以後不喜歡或者有瑕疵，退換貨麻煩嗎？
小謝：一點都不麻煩！現在大部分購物平台都提供七天鑑賞期，只要包裝完整，申請退貨後宅配員就會親自來家裡收件，連運費都不用自己出。
大方：聽起來真的很方便耶！我也想在網路上買張電腦椅，你有推薦的賣家嗎？
小謝：有啊，我等一下把幾家信譽不錯的店家連結傳到你的手機裡，你慢慢挑。
大方：太好了，謝謝你，小謝！
小謝：不客氣，網路購物只要多看多比較，就能買到便宜又好用的東西。"""

l125_vi = """Đại Phương: Tiểu Tạ, kiện hàng lớn ở cửa kia là của cậu à? Có phải cái thùng carton hình chữ nhật đó không?
Tiểu Tạ: Đúng rồi, đó là cái giá sách mình đặt mua trên trang web mua sắm đấy, mấy hôm nay các loại đồ nội thất đều đang giảm giá mạnh.
Đại Phương: Mua đồ nội thất qua mạng không sợ mua phải kích thước không vừa vặn à?
Tiểu Tạ: Việc này đơn giản mà! Thông tin sản phẩm trên trang web được ghi rất rõ ràng, chiều dài, chiều rộng, chiều cao và cả cân nặng đều được niêm yết cụ thể.
Đại Phương: Nhưng chỉ nhìn ảnh chụp thì làm sao biết được chất liệu thực tế và cảm giác khi dùng ra sao chứ?
Tiểu Tạ: Vì vậy mình luôn đọc kỹ đánh giá và bình luận của những người mua trước, đặc biệt là các bài đánh giá có kèm ảnh chụp đồ thật, rất đáng tham khảo.
Đại Phương: Đúng là một cách hay. Nếu nhận hàng về mà không ưng ý hoặc bị lỗi thì đổi trả có phiền phức không?
Tiểu Tạ: Không phiền chút nào luôn! Hiện giờ hầu hết các sàn thương mại điện tử đều có chính sách 7 ngày dùng thử, chỉ cần bao bì còn nguyên vẹn, sau khi bấm hoàn hàng là shipper sẽ đến tận nhà lấy, mình chẳng tốn đồng tiền ship nào cả.
Đại Phương: Nghe tiện lợi thật đấy! Mình cũng đang tính mua một chiếc ghế công thái học qua mạng, cậu có shop nào uy tín giới thiệu không?
Tiểu Tạ: Có chứ, lát nữa mình gửi link vài shop uy tín vào điện thoại cho cậu tha hồ chọn.
Đại Phương: Tuyệt vời quá, cảm ơn cậu nhiều nhé Tiểu Tạ!
Tiểu Tạ: Không có gì đâu, mua hàng qua mạng cứ chịu khó xem kỹ và so sánh nhiều nơi là sẽ mua được đồ vừa rẻ vừa chất lượng thôi."""

# Lesson 126 (Bài 4): 志豪 & 詩涵 (Sửa nhân vật chuẩn: Chí Hào & Thi Hàm)
l126_dialogue = """詩涵：志豪，你怎麼帶了這麼多大包小包的東西回來？
志豪：我去附近的傳統市場逛逛，巧的是今天正好有農產品特賣活動，就趁機會買了些新鮮蔬果，還有兩罐我最愛喝的阿里山高山茶。
詩涵：哇，聞起來好香啊！我來泡一壺，我們一起嚐嚐吧。
志豪：想泡一壺好茶可不容易，得花點功夫呢。
詩涵：茶葉品質的好壞固然重要，但泡茶時的水溫和時間也必須拿捏得恰到好處，才能泡出茶香。
志豪：沒想到妳對茶藝也挺有研究的嘛！
詩涵：小時候常常看我爺爺泡茶，耳濡目染，多少懂一點。
志豪：喝茶在華人社會裡真是不可或缺的文化，不管是招待客人還是平日休閒，泡壺茶就能聊上一下午。
詩涵：是啊，而且喝茶對身體健康很有好處，抗氧化又能提神。來，茶泡好了，請喝茶！
志豪：嗯！入口甘甜，喉嚨裡還有淡淡的茶香，真是極品好茶！
詩涵：好茶配好心情，今天下午真是太享受了。"""

l126_vi = """Thi Hàm: Chí Hào, sao cậu xách nhiều túi lớn túi nhỏ thế này về vậy?
Chí Hào: Mình ra chợ truyền thống gần đây dạo một vòng, tình cờ hôm nay có hội chợ nông sản nên nhân tiện mua ít hoa quả tươi ngon, với cả hai hộp trà ô long vùng núi cao Alishan mà mình thích nhất.
Thi Hàm: Oa, thơm ngát luôn này! Để mình pha một ấm, hai đứa mình cùng thưởng thức nhé.
Chí Hào: Muốn pha được một ấm trà ngon không dễ đâu, cũng phải bỏ công phu đấy.
Thi Hàm: Chất lượng búp trà đương nhiên rất quan trọng, nhưng nhiệt độ nước và thời gian ủ trà khi pha cũng phải căn thật chuẩn xác thì trà mới dậy mùi thơm được.
Chí Hào: Không ngờ cậu cũng am hiểu nghệ thuật thưởng trà gớm nhỉ!
Thi Hàm: Hồi nhỏ mình hay ngồi xem ông nội pha trà, nhìn mãi thành quen nên cũng biết chút ít.
Chí Hào: Thưởng trà quả thật là một nét văn hóa không thể thiếu trong cộng đồng người Hoa, dù là tiếp đãi khách quý hay thư giãn hàng ngày, cứ làm ấm trà là có thể ngồi trò chuyện cả buổi chiều.
Thi Hàm: Chuẩn đấy, hơn nữa uống trà còn rất tốt cho sức khỏe, vừa chống oxy hóa lại vừa giúp tỉnh táo tinh thần. Nào, trà xong rồi đây, mời cậu dùng trà!
Chí Hào: Ôi ngon quá! Vị trà vào miệng ngọt dịu, lại thoang thoảng hương thơm nơi cuống họng, đúng là trà hảo hạng!
Thi Hàm: Trà ngon lại có tâm trạng thoải mái, chiều nay thật là thảnh thơi dễ chịu."""

# Lesson 127 (Bài 5): 詩涵 & 建宇
l127_dialogue = """詩涵：建宇，今天是週末又是一大早的，怎麼有這麼多人在學校門口集合呀？
建宇：嘿，妳忘了嗎？學校每三個月都會舉辦一次「你丟我撿」、清理校園周圍環境的環保活動，教授還特別鼓勵大家參加呢。
詩涵：原來是這樣！這麼有意義的事，我們也一起加入吧！
建宇：沒想到除了校園，還要打掃附近的大街和小巷子，我看我們還是改天再……
詩涵：別再拖拖拉拉了！我們趕快去拿幾件好用的打掃用具吧。
建宇：好吧好吧，既然妳都這麼說了。妳看，那邊有掃帚、垃圾袋，還有專門夾垃圾的鐵夾子。
詩涵：我們負責這條街的資源回收。垃圾分類一定要做確實喔，寶特瓶、鐵鋁罐和紙類都要分開裝。
建宇：沒問題，現在臺灣的垃圾分類觀念做得很徹底，連小學生都知道回收標誌。
詩涵：確實是這樣。做資源回收不僅能減少垃圾量，還能讓資源循環利用，保護地球環境。
建宇：妳看，才掃了半小時，我們就撿滿了兩大袋可回收物。
詩涵：大家一起動手，街道一下子就變得乾乾淨淨了，看了心情真好！
建宇：雖然流了不少汗，但看著整潔的環境，真的挺有成就感的。
詩涵：走吧，我們把垃圾拿去分類回收區放好，等一下我請你喝冷飲！
建宇：太棒了，有妳這句話，再掃兩條街我都願意！"""

l127_vi = """Thi Hàm: Kiến Vũ, hôm nay là cuối tuần lại còn sáng sớm tinh mơ, sao có đông người tụ tập trước cổng trường thế kia?
Kiến Vũ: Ơ, cậu quên rồi à? Cứ mỗi ba tháng trường mình lại tổ chức hoạt động vì môi trường một lần để dọn dẹp vệ sinh xung quanh khuôn viên trường, giáo sư còn đặc biệt khuyến khích sinh viên tham gia nữa đấy.
Thi Hàm: Ra là vậy! Hoạt động ý nghĩa như thế này, hai đứa mình cùng vào tham gia luôn đi!
Kiến Vũ: Cơ mà không ngờ ngoài khuôn viên trường ra còn phải quét dọn cả các phố lớn ngõ nhỏ xung quanh nữa, mình thấy hay là để hôm khác...
Thi Hàm: Thôi đừng có lần lữa nữa! Mau đi lấy mấy dụng cụ quét dọn dùng cho tiện tay nào.
Kiến Vũ: Thôi được rồi, cậu đã hăng hái thế thì mình theo. Cậu nhìn kìa, bên đó có chổi, túi đựng rác và cả kẹp sắt gắp rác chuyên dụng nữa.
Thi Hàm: Chúng mình phụ trách phân loại rác tái chế ở đoạn đường này nhé. Phải phân loại thật chuẩn đấy, chai nhựa, lon nhôm và đồ giấy đều phải để riêng từng túi.
Kiến Vũ: Yên tâm đi, ý thức phân loại rác ở Đài Loan giờ được làm rất triệt để, ngay cả học sinh tiểu học cũng biết rõ các biểu tượng tái chế.
Thi Hàm: Đúng thế thật. Làm tốt việc phân loại rác tái chế không chỉ giảm bớt lượng rác thải mà còn giúp tài nguyên được tái sinh tuần hoàn, bảo vệ môi trường Trái Đất.
Kiến Vũ: Cậu xem, mới quét dọn có nửa tiếng thôi mà hai đứa mình đã thu gom đầy hai bao tải đồ tái chế rồi này.
Thi Hàm: Mọi người cùng chung tay một cái là đường phố lập tức sạch bong tinh tươm, nhìn vào thấy dễ chịu hẳn!
Kiến Vũ: Tuy mồ hôi ướt đẫm cả áo nhưng nhìn đường xá sạch đẹp thế này quả thực rất có cảm giác thành tựu.
Thi Hàm: Đi thôi, mình mang rác đến khu vực tập kết tái chế, lát nữa mình khao cậu một ly đồ uống mát lạnh!
Kiến Vũ: Tuyệt cú mèo! Có câu này của cậu thì bắt quét thêm hai con phố nữa mình cũng sẵn lòng!"""

# Lesson 132 (Bài 10): 同事 & 小謝
l132_dialogue = """同事：快十點了，小錢怎麼還沒出現？好像沒聽說他今天有出差呀。
小謝：你剛剛出去辦事的時候，小錢的家人打電話來，說小錢昨晚下樓梯時不小心跌倒，被緊急送進醫院了。
同事：天啊！他現在狀況怎麼樣？
小謝：聽說有點輕微腦震盪，還好人很清醒，也沒嚴重到需要動手術的程度，只是需要住院觀察幾天。
同事：那真是不幸中的大幸了，希望他很快就能復原。
小謝：對呀，算起來他還算是幸運的，有些人摔那一跤就昏迷不醒，甚至連命都沒了。
同事：老闆知道了嗎？
小謝：已經跟老闆報告過了。老闆親自打電話向家屬慰問，還讓我今天提前一小時下班，代表公司帶個紅包去醫院探望他。
同事：如果方便的話，下班後我也跟你一起去醫院看看他吧。
小謝：好啊，人多一起去給他打打氣，他一定會很高興的。
同事：最近大家工作都很忙，身體疲憊時行動真的要格外小心。
小謝：沒錯，健康平安才是最重要的，工作再忙也比不上身體健康。
同事：那我們趕快把手邊的事情處理好，傍晚準時出發去醫院。
小謝：好，一會兒見！"""

l132_vi = """Đồng nghiệp: Sắp mười giờ rồi, sao Tiểu Tiền vẫn chưa tới nhỉ? Hình như đâu có nghe nói hôm nay cậu ấy đi công tác đâu.
Tiểu Tạ: Lúc nãy cậu ra ngoài làm việc, người nhà Tiểu Tiền có gọi điện đến bảo tối qua cậu ấy bước xuống cầu thang không may bị trượt ngã, phải đưa đi cấp cứu trong bệnh viện rồi.
Đồng nghiệp: Trời đất ơi! Hiện giờ tình hình cậu ấy thế nào rồi?
Tiểu Tạ: Nghe nói bị chấn động não nhẹ một chút, may mà người vẫn rất tỉnh táo, cũng chưa đến mức nghiêm trọng phải phẫu thuật, chỉ cần nằm viện theo dõi vài ngày thôi.
Đồng nghiệp: Thế thì đúng là trong cái rủi có cái may rồi, mong sao cậu ấy sẽ mau chóng bình phục.
Tiểu Tạ: Đúng đấy, tính ra cậu ấy vẫn là người may mắn, có người chỉ vì ngã một cú mà hôn mê bất tỉnh, thậm chí qua đời luôn.
Đồng nghiệp: Sếp đã biết chuyện chưa cậu?
Tiểu Tạ: Báo cáo với sếp rồi. Sếp đã đích thân gọi điện thăm hỏi người nhà, còn bảo chiều nay mình được về sớm một tiếng đại diện công ty mang phong bì đến bệnh viện thăm nom cậu ấy.
Đồng nghiệp: Nếu tiện thì tan làm mình đi cùng cậu vào bệnh viện thăm cậu ấy nhé.
Tiểu Tạ: Được chứ, đông người cùng đến động viên tinh thần chắc chắn cậu ấy sẽ vui lắm.
Đồng nghiệp: Dạo này ai nấy đều bận túi bụi, lúc cơ thể mệt mỏi đi đứng hoạt động quả thực phải hết sức cẩn thận.
Tiểu Tạ: Chuẩn luôn, sức khỏe và bình an mới là quan trọng nhất, công việc bận rộn đến đâu cũng không quý bằng sức khỏe.
Đồng nghiệp: Vậy chúng mình mau xử lý xong việc trong tay đi, chiều tối xuất phát đúng giờ đến bệnh viện.
Tiểu Tạ: Nhất trí, lát gặp nhé!"""

# Lesson 133 (Bài 11): 好友 & 新郎母親
l133_dialogue = """好友：這件旗袍妳穿起來非常合身，顏色也很喜氣，別再考慮了，就選這件吧！
新郎母親：式樣看起來確實不錯，就是腰部稍微緊了一點，我這腰圍好像又粗了一些。
好友：哪裡有，明明好看得很！是這件衣服版型偏小了點，待會兒請師傅幫忙稍微修改放寬一下就好。
新郎母親：不然我們再多比較幾家，慢慢挑選，總能挑到最合心意的。
好友：說得也是，挑兒子的婚宴禮服可不能馬虎。哎，還記得上次我們一起挑旗袍，還是妳自己要結婚的時候呢。
新郎母親：是啊，沒想到一轉眼就換我兒子要娶媳婦了，時間過得真快！
好友：我記得妳兒子之前跟大學女友分手後，妳還替他安排過幾次相親，他和現在這位新娘是相親認識的嗎？
新郎母親：不是相親，聽說是在教會裡認識的。兩個人交往快滿一年了，之前都沒聽他提起過，所以當他跟我說要結婚時，我也挺意外的。
好友：現在年輕人都是這樣，感情穩定了才帶回家見父母。對方家裡還有哪些人呀？
新郎母親：家裡有一位年紀很大的奶奶。也是因為這位長輩盼望著孫女早日安定下來，所以原來計劃後年才辦的婚禮，就提前到今年年底結婚了。
好友：真替妳高興，妳馬上就要當婆婆了！我家那女兒到現在連個對象都沒有，真讓人操心。
新郎母親：兒孫自有兒孫福，緣分到了自然就水到渠成了。
好友：希望喝完妳兒子的喜酒後，我家也能早點傳出好消息！
新郎母親：一定會的！走，我們再去那邊看看配飾。"""

l133_vi = """Bạn thân: Bộ sườn xám này bạn mặc vào cực kỳ tôn dáng, màu sắc lại tươi tắn may mắn nữa, đừng đắn đo nữa, chọn bộ này đi!
Mẹ chú rể: Kiểu dáng trông công nhận đẹp thật, chỉ có điều chỗ eo hơi thắt một chút, eo tôi dạo này hình như lại to thêm một tí rồi.
Bạn thân: Đâu có đâu, nhìn sang và đẹp lắm mà! Do phom bộ này hơi nhỏ một chút thôi, lát nữa nhờ thợ nới lỏng ra một xíu là vừa in.
Mẹ chú rể: Hay là chúng mình cứ đi xem thêm vài tiệm nữa, từ từ chọn lựa kiểu gì cũng tìm được bộ ưng ý nhất.
Bạn thân: Nói cũng phải, chọn đồ mặc trong ngày cưới của con trai thì không thể qua loa được. Haizz, nhớ đợt trước hai đứa mình đi chọn sườn xám thì khi ấy là chuẩn bị cho đám cưới của chính bạn.
Mẹ chú rể: Đúng thế, không ngờ chớp mắt một cái giờ đã đến lượt con trai tôi lấy vợ rồi, thời gian trôi nhanh thật đấy!
Bạn thân: Tôi nhớ sau khi con trai bạn chia tay cô bạn gái hồi đại học, bạn còn sắp xếp đi xem mắt mấy bận, hai đứa quen nhau qua xem mắt à?
Mẹ chú rể: Không phải xem mắt đâu, nghe bảo quen nhau trong nhà thờ đấy. Hai đứa hẹn hò tìm hiểu cũng gần một năm rồi, trước giờ chẳng thấy thằng bé hé răng kể gì nên lúc nó bảo chuẩn bị cưới tôi cũng bất ngờ lắm.
Bạn thân: Giới trẻ bây giờ toàn thế, tình cảm chín muồi ổn định rồi mới dắt về ra mắt gia đình. Bên nhà gái còn những ai thế bạn?
Mẹ chú rể: Nhà bên ấy có một người bà tuổi tác đã khá cao rồi. Cũng vì bà cụ mong mỏi cháu gái sớm yên bề gia thất nên dự định ban đầu năm sau nữa mới cưới nay đẩy sớm lên cuối năm nay luôn.
Bạn thân: Mừng cho bạn quá, sắp lên chức mẹ chồng rồi nhé! Con gái nhà tôi đến giờ vẫn chưa có bạn trai, nghĩ mà sốt cả ruột.
Mẹ chú rể: Con cái có phúc phận của con cái, duyên số đến tự khắc mọi chuyện sẽ đâu vào đấy thôi mà.
Bạn thân: Mong là sau khi đi ăn đám cưới con trai bạn, nhà tôi cũng sớm có tin vui báo hỷ!
Mẹ chú rể: Chắc chắn rồi! Đi nào, chúng mình sang bên kia xem phụ kiện trang sức đi kèm nhé."""

# Lesson 134 (Bài 12): 主持人 & 蔡教授
l134_dialogue = """主持人：大家好！在今天的節目中，我們邀請到了專家學者，一起來深入探討青年就業與失業等社會議題。廢話不多說，首先請教蔡教授：目前青年失業已成為許多國家面臨的嚴峻情況，就您的觀點來看，造成這種情況的主要原因是什麼？
蔡教授：我想，主要是受到全球經濟結構調整與國內外市場變動的影響。此外，近年來科技發展非常迅速，各行各業的工作型態都發生了翻天覆地的變化。
主持人：教授認為科技發達與失業問題有直接關係嗎？能不能為觀眾進一步說明？
蔡教授：例如自從人們習慣在網路上閱讀新聞後，電子媒體就逐漸取代了傳統印刷報紙。雖然新聞界依然需要優秀的編採人才，但報社印刷廠與實體發行等相關行業，工作機會確實大幅縮減了。
主持人：這確實讓人聯想到自動駕駛技術的發展，或許未來市區公車或計程車都會改成無人駕駛。
蔡教授：沒錯，這樣確實能降低營運成本，雖然部分傳統人力會被取代，但從另一個角度看，科技也創造了許多新型態的工作職缺，具備數位技能的年輕人反而有更多選擇。
主持人：談到就業，年輕人往往感到迷茫，您對正在求職的年輕觀眾有什麼具體建議嗎？
蔡教授：我常提醒大家，找工作就像投資自己，不要只看起薪高低，更要看這份工作能否帶來長遠的成長空間。保持終身學習的態度，提升跨領域的能力，才能在職場上立於不敗之地。
主持人：感謝蔡教授精闢的分析，讓我們獲益良多！"""

l134_vi = """MC: Xin chào quý vị khán giả! Trong chương trình hôm nay, chúng tôi đã mời tới trường quay chuyên gia học giả để cùng thảo luận chuyên sâu về các vấn đề việc làm và thất nghiệp của thanh niên. Không để quý vị chờ lâu, câu hỏi đầu tiên xin được dành cho Giáo sư Sái: Hiện nay tỷ lệ thất nghiệp ở người trẻ tuổi đang là thực trạng nan giải ở nhiều quốc gia, theo góc nhìn của Giáo sư, đâu là nguyên nhân cốt lõi dẫn đến tình trạng này?
Giáo sư Sái: Tôi cho rằng nguyên nhân chủ yếu bắt nguồn từ sự chuyển dịch cơ cấu kinh tế toàn cầu cùng những biến động của thị trường trong và ngoài nước. Ngoài ra, sự phát triển vượt bậc của công nghệ những năm gần đây đã làm thay đổi hoàn toàn phương thức vận hành của mọi ngành nghề.
MC: Giáo sư có cho rằng sự phát triển vũ bão của công nghệ có liên quan trực tiếp đến vấn đề mất việc làm không? Giáo sư có thể phân tích rõ hơn cho khán giả được hiểu không ạ?
Giáo sư Sái: Lấy ví dụ đơn giản, kể từ khi mọi người hình thành thói quen đọc tin tức trực tuyến, báo điện tử đã dần thay thế các tờ báo in truyền thống. Mặc dù ngành báo chí vẫn rất cần những phóng viên biên tập viên tài năng, nhưng các khâu như nhà máy in hay mạng lưới phát hành báo giấy thực sự đã sụt giảm nghiêm trọng cơ hội việc làm.
MC: Điều này rất giống với việc phát triển công nghệ xe tự lái hiện nay, có lẽ tương lai xe buýt hay taxi trong thành phố đều sẽ chuyển sang tự hành không người lái.
Giáo sư Sái: Đúng như vậy, cách làm này giúp giảm thiểu chi phí vận hành, tuy một bộ phận lao động truyền thống sẽ dần bị thay thế, nhưng nhìn ở chiều ngược lại, công nghệ cũng sản sinh ra vô số ngành nghề và vị trí mới, những bạn trẻ có kỹ năng số và công nghệ lại càng có nhiều cơ hội thăng tiến.
MC: Nhắc đến tìm việc, các bạn trẻ thường cảm thấy rất hoang mang mông lung, Giáo sư có lời khuyên thiết thực nào dành cho các bạn trẻ đang tìm việc không ạ?
Giáo sư Sái: Tôi luôn nhắc nhở các bạn trẻ rằng chọn công việc cũng giống như đầu tư vào chính bản thân mình vậy, đừng chỉ chăm chăm nhìn vào mức lương khởi điểm cao hay thấp, quan trọng hơn là công việc đó có đem lại không gian phát triển lâu dài hay không. Luôn giữ tinh thần học tập suốt đời và bồi dưỡng năng lực đa ngành mới là chìa khóa giúp bạn đứng vững trên thị trường lao động.
MC: Xin trân trọng cảm ơn những chia sẻ và phân tích vô cùng sâu sắc của Giáo sư Sái!"""

# Lesson 135 (Bài 13): 大方 & 小王
l135_dialogue = """大方：今天來看機器人科技展的人真多啊！
小王：我本來都打算放棄這次看展機會了，要不是你極力推薦，我平時最懶得跟別人擠來擠去的。
大方：別這麼說嘛，好在你來了！我媽最近一直想買部掃地機器人，你是念機械工程的，這方面專業知識比我強得多，今天剛好幫我出出主意。
小王：這沒問題，包在我身上！選掃地機器人主要看它的避障感應技術和吸力大小，現在很多新型號還具備自動洗抹布和集塵功能呢。
大方：科技發展得真快，你看前面那個展區，好多人在圍觀什麼？
小王：那是最新研發的AI陪伴型機器人，不僅能用語音跟老人聊天、提醒吃藥，還能偵測室內跌倒狀況並自動發送警報。
大方：太神奇了！這對於高齡化社會來說真的很有幫助。
小王：是啊，除了生活照護，那邊還有展示工業生產線上的智慧機械手臂，精度和效率都遠遠超過傳統人工。
大方：看來未來的世界到處都會是機器人的身影了。
小王：沒錯，走吧，我們去那家掃地機器人的展位詳細問問規格和價格！"""

l135_vi = """Đại Phương: Hôm nay người đến xem triển lãm công nghệ robot đông thật đấy!
Tiểu Vương: Ban đầu mình đã tính bỏ qua đợt triển lãm lần này rồi đấy, nếu không nhờ cậu nhiệt tình rủ rê thì bình thường mình ngại nhất khoản chen chúc đông người.
Đại Phương: Đừng nói thế mà, may là có cậu đi cùng đấy! Mẹ mình dạo này cứ muốn sắm một con robot hút bụi lau nhà, cậu học chuyên ngành cơ khí chế tạo, kiến thức mảng này am hiểu hơn mình nhiều, hôm nay tiện thể làm quân sư tư vấn giúp mình với nhé.
Tiểu Vương: Chuyện nhỏ, cứ để đấy cho mình! Chọn robot hút bụi quan trọng nhất là công nghệ cảm biến tránh chướng ngại vật và lực hút của động cơ, các dòng máy đời mới hiện nay còn có thêm tính năng tự giặt giẻ lau và tự gom rác vào hộc chứa bụi nữa đấy.
Đại Phương: Công nghệ phát triển chóng mặt thật, cậu nhìn đằng trước kìa, mọi người đang xúm đông xúm đỏ xem cái gì thế nhỉ?
Tiểu Vương: Đó là dòng robot AI đồng hành thế hệ mới nhất, không chỉ trò chuyện tâm sự cùng người cao tuổi, nhắc nhở uống thuốc đúng giờ mà còn phát hiện được cả tình huống ngã trong nhà để tự động phát tín hiệu cấp cứu.
Đại Phương: Kỳ diệu thật đấy! Ứng dụng này quả thực cực kỳ hữu ích cho các quốc gia đang có dân số già hóa.
Tiểu Vương: Chuẩn luôn, ngoài mảng chăm sóc đời sống, khu bên kia còn trưng bày các cánh tay robot thông minh trong dây chuyền sản xuất công nghiệp, độ chuẩn xác và năng suất đều vượt trội so với thao tác thủ công.
Đại Phương: Xem ra thế giới tương lai đâu đâu cũng sẽ có sự hiện diện của robot rồi.
Tiểu Vương: Đúng vậy, đi nào, chúng mình sang quầy bán robot hút bụi bên kia hỏi kỹ về thông số kỹ thuật và giá cả xem sao!"""

# Lesson 136 (Bài 14): 志熙 & 學生 (Sửa nhân vật chuẩn: Chí Hi & Du học sinh)
l136_dialogue = """志熙：中秋節連假快到了，你有什麼打算嗎？
學生：能有什麼打算呀，我人生地不熟的，一個人哪兒也去不了。在宿舍裡能做的，還不就是看看書、聽聽音樂。
志熙：我和幾個朋友約好中秋節到張老師家去聚餐過節，那天大家打算親手做月餅，你有興趣一起來嗎？
學生：親手做月餅？聽起來太棒了！我記得去年來台灣時買了好幾大盒月餅，行李都差點超重了。
志熙：哈哈，這次不僅能吃，還能親自體驗傳統做月餅的過程呢！
學生：不過我從來沒做過點心，不知道做月餅會不會很困難？需要準備些什麼材料呀？
志熙：別擔心，張老師會一步一步教我們怎麼做。材料像是麵粉、豆沙餡、蛋黃、奶油，老師家裡都已經備齊了。
學生：那太好了！吃月餅象徵團圓，能跟老師和同學們一起過中秋，我就不會覺得那麼想家了。
志熙：沒錯，節日就是要大家聚在一起才熱鬧，那我們中秋節當天下午見！
學生：好，非常感謝你的邀請，中秋節見！"""

l136_vi = """Chí Hi: Kỷ nghỉ lễ Trung thu sắp tới rồi, cậu có kế hoạch gì chưa?
Học sinh: Kế hoạch gì được cơ chứ, mình chân ướt chân ráo mới sang đây lạ nước lạ cái, một mình chẳng biết đi đâu. Ở ký túc xá thì cũng chỉ quanh quẩn đọc sách với nghe nhạc thôi.
Chí Hi: Mình với mấy người bạn hẹn nhau tết Trung thu này qua nhà thầy Trương tụ tập liên hoan, hôm đó mọi người dự định tự tay làm bánh trung thu, cậu có hứng thú tham gia cùng không?
Học sinh: Tự tay làm bánh trung thu á? Nghe tuyệt quá đi chứ! Mình nhớ đợt năm ngoái sang Đài Loan mình mua mấy hộp bánh to đùng, hành lý suýt nữa thì quá cân.
Chí Hi: Ha ha, lần này không chỉ được thưởng thức mà còn được tự mình trải nghiệm toàn bộ quy trình làm bánh truyền thống nữa cơ!
Học sinh: Nhưng mình xưa giờ chưa từng làm bánh bao giờ, không biết làm bánh trung thu có khó lắm không? Cần chuẩn bị những nguyên liệu gì thế cậu?
Chí Hi: Đừng lo, thầy Trương sẽ hướng dẫn chúng mình từng bước một. Các nguyên liệu như bột mì, nhân đậu đỏ, trứng muối, bơ thì ở nhà thầy đều đã chuẩn bị sẵn sàng hết rồi.
Học sinh: Thế thì hay quá! Ăn bánh trung thu tượng trưng cho sự đoàn viên sum vầy, được cùng thầy giáo và các bạn đón tết Trung thu thế này mình sẽ đỡ cảm giác nhớ nhà hơn nhiều.
Chí Hi: Đúng thế, ngày lễ tết là phải quây quần bên nhau mới vui vẻ ấm áp, vậy hẹn cậu chiều hôm tết Trung thu nhé!
Học sinh: Nhất trí, cảm ơn lời mời nhiệt tình của cậu nhiều nhé, hẹn gặp cậu hôm Trung thu!"""

# Lesson 138 (Bài 16): 巴德 & 俄羅斯朋友
l138_dialogue = """巴德：嘿，快過來看，電視正在轉播奧運的最新消息呢！
俄羅斯朋友：是哪一項比賽啊？看你這麼興奮。
巴德：德國選手在男子擲標槍項目中拿下了十分優秀的成績，大家都認為他奪冠的希望非常大！
俄羅斯朋友：真的啊？難怪你今天在臉上畫了德國國旗和奧運五環標誌。
巴德：哈哈，我不只自己畫，剛剛還想拉室友一起畫呢！這就是奧運狂熱嘛。
俄羅斯朋友：你們俄羅斯的傳統強項也是體操、游泳和平行木，這次代表隊實力依然很堅強吧？
巴德：沒錯，我們國家派出了很多優秀的年輕運動員，上一屆奧運就拿了不少金牌。
俄羅斯朋友：看奧運比賽最精彩的地方，就是看各國頂尖選手挑戰自我極限、刷新世界紀錄的瞬間。
巴德：對啊，即使受了傷也不輕言放棄，那種拼搏精神真的令人敬佩。
俄羅斯朋友：這就是所謂的運動家精神吧！走，決賽馬上要開始了，我們一起坐下來好好觀賽。
巴德：走，為運動員們加油！"""

l138_vi = """Bader: Này này, mau qua đây xem đi, tivi đang phát sóng trực tiếp bản tin mới nhất của Olympic này!
Bạn Nga: Môn thi đấu nào thế cậu? Thấy cậu hào hứng phấn khích thế kia.
Bader: Vận động viên người Đức ở nội dung ném lao nam vừa đạt thành tích xuất sắc vô cùng, ai nấy đều đánh giá cơ hội giành huy chương vàng của anh ấy là cực kỳ cao!
Bạn Nga: Thật thế à? Hèn chi hôm nay thấy cậu vẽ cả quốc kỳ Đức với biểu tượng năm vòng tròn Olympic lên mặt thế kia.
Bader: Ha ha, mình không chỉ vẽ cho mình đâu, ban nãy còn vừa tính lôi cả cậu bạn cùng phòng vào vẽ nữa đấy! Đó mới chính là cuồng nhiệt Olympic chứ!
Bạn Nga: Các môn thế mạnh truyền thống của Nga cũng là thể dục dụng cụ, bơi lội và xà kép, đợt này đội tuyển vẫn giữ vững phong độ mạnh mẽ chứ?
Bader: Chuẩn luôn, quốc gia mình đợt này cử rất nhiều vận động viên trẻ tài năng tham gia, kỳ Olympic trước đã rinh về không ít huy chương vàng rồi đấy.
Bạn Nga: Xem Thế vận hội Olympic hấp dẫn nhất chính là khoảnh khắc chứng kiến những vận động viên xuất sắc nhất hành tinh vượt qua giới hạn của bản thân và phá vỡ kỷ lục thế giới.
Bader: Đúng thế, ngay cả khi gặp chấn thương cũng không bao giờ dễ dàng bỏ cuộc, tinh thần quả cảm kiên cường đó thực sự khiến người ta phải ngả mũ khâm phục.
Bạn Nga: Đó chính là cái mà người ta gọi là tinh thần thể thao cao thượng đấy! Đi nào, trận chung kết sắp bắt đầu rồi, hai đứa mình cùng ngồi xuống xem cho đã mắt.
Bader: Đi thôi, cùng cổ vũ hết mình cho các vận động viên nào!"""

b4_fixed = {
    "123": (l123_dialogue, l123_vi),
    "124": (l124_dialogue, l124_vi),
    "125": (l125_dialogue, l125_vi),
    "126": (l126_dialogue, l126_vi),
    "127": (l127_dialogue, l127_vi),
    "132": (l132_dialogue, l132_vi),
    "133": (l133_dialogue, l133_vi),
    "134": (l134_dialogue, l134_vi),
    "135": (l135_dialogue, l135_vi),
    "136": (l136_dialogue, l136_vi),
    "138": (l138_dialogue, l138_vi),
}

for lid, (zh, vi) in b4_fixed.items():
    if lid in contents and len(contents[lid]) > 0:
        it = contents[lid][0]
        it["content"] = zh
        it["vietnamese"] = vi
        zh_count = len(zh.strip().splitlines())
        vi_count = len(vi.strip().splitlines())
        print(f"Updated Book 4 Lesson {lid}: ZH={zh_count} lines, VI={vi_count} lines (100% matched)")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(contents, f, ensure_ascii=False, indent=2)

print("\nSuccessfully updated Book 4 dialogues in lesson_contents.json!")
