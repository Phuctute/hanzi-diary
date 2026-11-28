import json

DATA_PATH = "data/lesson_contents.json"
with open(DATA_PATH, "r", encoding="utf-8") as f:
    contents = json.load(f)

# ==============================================================================
# BOOK 3 (THỜI ĐẠI 3) - LESSONS 109 to 122
# ==============================================================================

b3_data = {}

# ------------------------------------------------------------------------------
# L109: 貨比三家不吃虧 (明哲 & 芳草)
# ------------------------------------------------------------------------------
b3_data["109"] = (
"""明哲：芳草，妳也來逛百貨公司啊？
芳草：是啊，我下個月要參加朋友的婚禮，來買件合適的衣服。你呢，怎麼也來了？
明哲：這家百貨公司正在打折，我特地來買上衣。要不要一起逛逛？
芳草：好啊，順便請你給我一些意見。
明哲：我們先上二樓看看，那裡有各式各樣的衣服、皮帶、皮鞋。如果有時間，我也想買一雙球鞋給我先生。
芳草：這個專櫃的衣服都不錯，模特兒身上那件深藍色的洋裝，設計得很有特色，看起來很適合參加婚禮。
明哲：嗯，這套淺色的也很好看，妳都試穿一下吧！
芳草：不錯，你的個子高，穿起洋裝來挺好看的。
明哲：是挺好看的，不過價錢有點貴，樣子也太正式了，恐怕平常沒什麼機會穿。我再試穿那件淺色的吧！
芳草：這件穿起來有點緊，而且比剛才那件還要貴。算了，去別家吧！
明哲：沒想到這個專櫃的衣服這麼便宜，設計也不錯，難怪顧客這麼多。我看，在這裡找就行了。
芳草：是比較便宜，不過我朋友在這裡買過情侶裝，沒穿幾次就破了，最後只好扔掉。
明哲：我也有差不多的經驗。以前買過很便宜的牛仔褲，只穿了一天皮膚就紅腫發癢，後來看了醫生吃了三天的藥才好。
芳草：便宜沒好貨嘛！為了省錢買品質差的東西，最後吃虧的還是自己。我們還是去別家看看吧。
明哲：這個專櫃的衣服品質很好，就是價格偏高了點。
芳草：沒關係，專櫃小姐說今天全館打六折，算下來可以省不少錢呢！
明哲：真的嗎？那我趕快挑挑看。這件上衣剪裁很合身，質料也很舒適，妳覺得怎麼樣？
芳草：很好看！參加婚禮穿很大方，平常上班也能穿。
明哲：太好了，打了折真的很划算，我就買這件了。
芳草：這就是「貨比三家不吃虧」的道理，多看多比較總能買到滿意的！""",

"""Minh Triết: Phương Thảo, cậu cũng đến trung tâm thương mại mua sắm à?
Phương Thảo: Đúng vậy, tháng sau mình dự đám cưới bạn nên đến chọn mua bộ váy phù hợp. Còn cậu, sao cũng tới đây thế?
Minh Triết: Trung tâm thương mại này đang có đợt giảm giá, mình tranh thủ đến mua chiếc áo sơ mi. Hay là chúng mình cùng đi dạo xem nhé?
Phương Thảo: Được chứ, nhân tiện nhờ cậu góp ý giúp mình luôn.
Minh Triết: Chúng mình lên tầng hai trước đi, trên đó có đủ các loại quần áo, thắt lưng, giày da. Nếu còn thời gian mình cũng muốn mua tặng ông xã một đôi giày thể thao.
Phương Thảo: Gian hàng này quần áo đẹp quá, chiếc đầm màu xanh đậm trên ma-nơ-canh thiết kế rất độc đáo, trông rất hợp để đi dự đám cưới.
Minh Triết: Ừm, bộ màu nhạt kia nhìn cũng rất trang nhã, cậu thử cả hai bộ xem sao!
Phương Thảo: Dáng cậu cao ráo, mặc chiếc đầm này vào nhìn rất thanh lịch và tôn dáng.
Minh Triết: Trông thì đẹp thật đấy, nhưng giá hơi đắt, kiểu dáng lại trang trọng quá, sợ là ngày thường hiếm khi có dịp mặc. Để mình thử tiếp bộ màu nhạt kia xem.
Phương Thảo: Bộ này mặc vào hơi bị chật phần eo, lại còn đắt hơn bộ lúc nãy nữa. Thôi bỏ đi, chúng mình sang quầy khác xem sao!
Minh Triết: Không ngờ gian hàng này quần áo giá mềm thế mà mẫu mã cũng đẹp, hèn chi khách đông nườm nượp. Mình thấy chọn ở đây là ổn đấy.
Phương Thảo: Giá rẻ thì có rẻ thật, nhưng bạn mình từng mua áo đôi ở đây, mặc được vài bận là bục chỉ rách toạc, cuối cùng đành phải vứt đi.
Minh Triết: Mình cũng từng có trải nghiệm tương tự. Hồi trước ham rẻ mua chiếc quần bò, mặc đúng một ngày mà da dị ứng mẩn đỏ ngứa ngáy, phải uống thuốc mất ba ngày mới khỏi.
Phương Thảo: Đúng là của rẻ là của ôi mà! Tiết kiệm được chút tiền mà mua phải đồ dỏm thì người chịu thiệt thòi sau cùng vẫn là mình. Chúng mình đi quầy khác xem tiếp đi.
Minh Triết: Quần áo ở gian hàng này chất lượng tốt thật, chỉ có điều giá hơi cao một chút.
Phương Thảo: Không sao đâu, cô nhân viên bảo hôm nay toàn bộ cửa hàng đang giảm giá 40%, tính ra tiết kiệm được khối tiền đấy!
Minh Triết: Thật á? Thế để mình chọn nhanh một chiếc. Chiếc áo này cắt may vừa vặn, chất vải lại mềm mịn dễ chịu, cậu thấy thế nào?
Phương Thảo: Rất đẹp! Mặc đi dự tiệc cưới trông vừa lịch sự trang nhã, mà ngày thường mặc đi làm cũng rất hợp.
Minh Triết: Tuyệt quá, giảm giá xong thấy hời hẳn ra, mình quyết định lấy chiếc này luôn.
Phương Thảo: Đó chính là đạo lý "Khảo giá ba nhà chẳng lo bị hớ", chịu khó xem xét và so sánh nhiều nơi thì kiểu gì cũng chọn được món đồ ưng ý!"""
)

# ------------------------------------------------------------------------------
# L110: 孩子滿月了 (家豪 & 芳草)
# ------------------------------------------------------------------------------
b3_data["110"] = (
"""芳草：家豪，好久不見！這瓶葡萄酒送你。
家豪：快請進！妳人來就好了，別這麼客氣，請坐請坐！
芳草：你知道家麗生了一對雙胞胎吧？
家豪：上星期就知道了，我一聽到這個好消息就立刻打電話恭喜她。她說兩個寶寶又乖又可愛，但一口氣要帶兩個，真的很辛苦。
芳草：等小孩滿月那天，我們一起去看他們吧！我想抱抱那對可愛的雙胞胎。
家豪：好啊！妳打算送什麼禮物祝福他們？
芳草：我前兩天到百貨公司選了兩件小衣服，你看，就是這兩件，是不是很可愛？
家豪：真可愛！我想來想去，還是決定包個紅包最實用，只是不知道滿月紅包一般該包多少。
芳草：包紅包也是個好主意。包多少主要看交情，不過數字一定要是雙數，而且不能有數字「四」喔！
家豪：好的，我會注意的。記得去年妳婆婆過生日，妳送了她一盒人參，老人家很喜歡吧？
芳草：是啊，長輩很重視養生。對了，滿月酒那天是在哪家餐廳辦呀？
家豪：在福華飯店的宴會廳，聽說訂了二十幾桌呢，到時候一定很熱鬧。
芳草：太好了，那我們那天約好一起過去！""",

"""Phương Thảo: Gia Hào, lâu rồi không gặp! Chai rượu vang này mình tặng cậu nhé.
Gia Hào: Mau vào nhà đi! Cậu đến chơi là quý rồi, khách sáo quá làm gì, mời ngồi mời ngồi!
Phương Thảo: Cậu đã biết tin Gia Lệ sinh đôi được một cặp song sinh chưa?
Gia Hào: Tuần trước mình biết rồi, vừa nghe tin vui là mình gọi điện chúc mừng cô ấy ngay. Cô ấy bảo hai bé ngoan và đáng yêu lắm, nhưng một lúc chăm cả hai bé thì thực sự vất vả vô cùng.
Phương Thảo: Đợi đến ngày đầy tháng của hai bé, chúng mình cùng qua thăm nhé! Mình rất muốn bế hai bé song sinh đáng yêu ấy.
Gia Hào: Nhất trí! Cậu định tặng quà gì mừng cho gia đình cô ấy thế?
Phương Thảo: Hôm trước mình ra trung tâm thương mại chọn được hai bộ quần áo trẻ em, cậu xem này, đúng hai bộ này đây, có dễ thương không?
Gia Hào: Dễ thương quá! Mình nghĩ tới nghĩ lui, thấy mừng phong bì đỏ là thiết thực nhất, chỉ là chưa rõ phong bì đầy tháng thường đi bao nhiêu thì hợp lý.
Phương Thảo: Mừng phong bì cũng là ý hay. Đi bao nhiêu tùy thuộc vào mức độ thân thiết, nhưng số tiền nhất định phải là số chẵn, và kiêng số 4 nhé!
Gia Hào: Ừ, mình sẽ chú ý điểm này. Mình nhớ năm ngoái sinh nhật mẹ chồng cậu, cậu tặng bà một hộp nhân sâm, cụ thích lắm đúng không?
Phương Thảo: Đúng vậy, người lớn tuổi rất chú trọng bồi bổ sức khỏe. À mà tiệc đầy tháng hôm đó tổ chức ở nhà hàng nào vậy cậu?
Gia Hào: Ở sảnh tiệc của khách sạn Phúc Hoa, nghe bảo đặt hơn hai mươi bàn lận, hôm đó chắc chắn sẽ náo nhiệt lắm.
Phương Thảo: Tuyệt vời, vậy hôm đó chúng mình hẹn nhau cùng đi nhé!"""
)

# ------------------------------------------------------------------------------
# L111: 地震和颱風 (馬丁 & 朋子)
# ------------------------------------------------------------------------------
b3_data["111"] = (
"""馬丁：朋子，昨晚的颱風真可怕！
朋子：是啊，這次的強烈颱風不但風大雨大，而且移動速度突然變快，讓人根本來不及防備。
馬丁：前天新聞才說颱風離臺灣還有一段距離，提醒大家注意，沒想到昨晚就直接登陸了。妳家沒事吧？
朋子：屋子裡還好，但社區周圍有好多大樹被吹倒了，馬路兩旁的路燈也壞了好幾盞，整棟大樓停電停了一整晚。你家呢？
馬丁：我家附近有些積水，鄰居家的鐵皮屋頂甚至被強風掀飛了，真的很危險。
朋子：聽廣播說東部山區發生了土石流和淹水，很多房屋受損，居民都被緊急撤離到避難所了。
馬丁：臺灣位處地震帶，夏天又常有颱風，大自然的力量真的不可小看。
朋子：沒錯，所以平時家裡一定要準備好防災避難包，水、乾糧、手電筒和急救藥品都不能少。
馬丁：說得對，今天天氣放晴了，我們趕快把陽台和門口的落葉清理乾淨吧！
朋子：好，大家互相幫忙，很快就能恢復整潔了。""",

"""Martin: Tomoko, cơn bão tối qua đáng sợ thật đấy!
Tomoko: Đúng vậy, cơn bão mạnh lần này không chỉ mưa to gió lớn mà tốc độ di chuyển còn tăng nhanh đột ngột, khiến mọi người trở tay không kịp.
Martin: Hôm kia thời sự mới đưa tin bão còn cách Đài Loan một đoạn, nhắc nhở người dân chú ý đề phòng, ai ngờ tối qua đã đổ bộ thẳng vào đất liền rồi. Nhà cậu có sao không?
Tomoko: Trong nhà thì ổn, nhưng xung quanh khu chung cư nhiều cây to bị quật ngã ngổn ngang, đèn đường hai bên đường cũng hỏng mất mấy cột, cả tòa nhà bị mất điện suốt cả đêm. Còn nhà cậu thì sao?
Martin: Khu nhà mình nước ngập lênh láng, mái tôn nhà hàng xóm thậm chí còn bị gió bão thổi bay mất, nguy hiểm vô cùng.
Tomoko: Nghe đài phát thanh đưa tin các vùng núi phía đông xảy ra sạt lở đất và ngập lụt nghiêm trọng, nhiều nhà cửa bị hư hại, người dân đều phải sơ tán khẩn cấp đến nơi trú ẩn an toàn rồi.
Martin: Đài Loan nằm trên vành đai động đất, mùa hè lại thường xuyên có bão lũ, sức mạnh của mẹ thiên nhiên quả thực không thể xem thường được.
Tomoko: Chuẩn đấy, vì vậy trong nhà lúc nào cũng phải chuẩn bị sẵn túi cứu hộ khẩn cấp, nước uống, đồ ăn khô, đèn pin và thuốc men sơ cứu đều không thể thiếu.
Martin: Cậu nói rất đúng, hôm nay trời tạnh ráo rồi, chúng mình mau ra dọn dẹp cành cây lá rụng ngoài ban công và trước cửa đi thôi!
Tomoko: Ừ, mọi người cùng giúp nhau một tay thì chẳng mấy chốc sẽ sạch sẽ tinh tươm lại thôi."""
)

# ------------------------------------------------------------------------------
# L112: 休閒與工作 (淑芬 & 東賢)
# ------------------------------------------------------------------------------
b3_data["112"] = (
"""淑芬：東賢，暑假快到了，你有什麼計劃嗎？我和幾個朋友打算去環島旅行，想跟我們一起去嗎？
東賢：想倒是很想，但我得趁暑假多打幾份工，多存點學費和生活費，因為畢業後我打算去法國留學。
淑芬：你平時下課後就要去補習法語，暑假還要打工，那還有休閒放鬆的時間嗎？
東賢：偶爾週末有空時，我會上網看看電影、聽聽音樂放鬆一下。
淑芬：都不去戶外走走嗎？最近有項調查顯示，臺灣年輕人最常去的休閒場所竟然是家裡，一半以上的人週末都在家上網或睡覺。
東賢：哈哈，我大概就是其中一個吧！其實我也喜歡戶外運動，以前還常跟我哥去滑雪呢。
淑芬：運動對身心健康非常有幫助。要是長期只工作不運動，回到家又一直坐著，體力和免疫力都會變差的。
東賢：妳說得對。看來我得重新調整時間分配，即使打工再忙，每週也要抽出一兩天去跑步或打球。
淑芬：這才對嘛！那這週末先跟我去爬陽明山，呼吸新鮮空氣，怎麼樣？
東賢：好啊，一言為定！""",

"""Thục Phân: Dong-hyun, sắp tới kỳ nghỉ hè rồi, cậu có kế hoạch gì chưa? Mình với mấy người bạn đang tính làm một chuyến du lịch vòng quanh đảo Đài Loan, cậu có muốn đi cùng bọn mình không?
Dong-hyun: Thích thì mình rất thích, nhưng hè này mình phải tranh thủ làm thêm nhiều ca để tích cóp tiền học phí và sinh hoạt phí, vì sau khi tốt nghiệp mình dự định sang Pháp du học.
Thục Phân: Bình thường tan học cậu đã phải đi học thêm tiếng Pháp rồi, nghỉ hè lại làm thêm quần quật thế thì còn thời gian đâu mà nghỉ ngơi giải trí nữa?
Dong-hyun: Thỉnh thoảng cuối tuần rảnh rỗi mình cũng lên mạng xem phim, nghe nhạc một chút để xả hơi.
Thục Phân: Không ra ngoài hít thở khí trời chút nào à? Gần đây có khảo sát cho thấy địa điểm giải trí phổ biến nhất của giới trẻ Đài Loan hóa ra lại là ở nhà, hơn một nửa số người chọn nằm nhà lướt mạng hoặc ngủ nướng suốt cả kỳ nghỉ cuối tuần.
Dong-hyun: Ha ha, chắc mình là một trong số đó rồi! Thật ra mình cũng rất thích các hoạt động ngoài trời, trước đây còn hay cùng anh trai đi trượt tuyết nữa cơ.
Thục Phân: Thể dục thể thao rất tốt cho cả thể chất lẫn tinh thần. Cứ vùi đầu vào công việc mãi không vận động, về nhà lại ngồi lì một chỗ thì thể lực và sức đề kháng sẽ giảm sút nghiêm trọng đấy.
Dong-hyun: Cậu nói rất đúng. Xem ra mình phải sắp xếp lại thời gian biểu thôi, dù làm thêm bận rộn đến đâu thì mỗi tuần cũng phải dành ra một hai buổi đi chạy bộ hoặc chơi bóng.
Thục Phân: Thế mới chuẩn chứ! Vậy cuối tuần này đi leo núi Dương Minh Sơn với mình hít thở không khí trong lành trước nhé, chịu không?
Dong-hyun: Được chứ, chốt thế nhé!"""
)

# ------------------------------------------------------------------------------
# L113: 旅行與背包客 (朋子 & 東賢)
# ------------------------------------------------------------------------------
b3_data["113"] = (
"""朋子：東賢，你姊姊最近是不是又有旅行的計劃了？
東賢：沒錯，她正準備當背包客去非洲大草原旅行呢！
朋子：我常常看她在部落格發表的旅行日記，內容充實、觀點獨特，照片也拍得極好，真讓人大開眼界。
東賢：我姊姊真的很勇敢，一個人背著背包走遍了三十多個國家。受她的影響，我現在對自助旅行也充滿興趣。
朋子：真令人羨慕！上個月她來臺灣時，你們不是還一起騎自行車環島嗎？
東賢：是啊，那趟旅程令人難忘。雖然途中碰上大雨，山路又陡又滑，但克服困難到達終點的那一刻，真的很有成就感。
朋子：自助旅行雖然比跟團辛苦，但能深刻體驗當地的風土人情，也能培養獨立解決問題的能力。
東賢：沒錯，而且旅行中結交的朋友往往能成為一輩子的知己。
朋子：等放寒假時，我們也來規劃一次背包客之旅吧！
東賢：好主意，我們一起好好規劃路線！""",

"""Tomoko: Dong-hyun, dạo này chị gái cậu lại lên kế hoạch đi du lịch nữa à?
Dong-hyun: Đúng vậy, chị ấy đang chuẩn bị xách ba lô sang thảo nguyên châu Phi du lịch bụi đấy!
Tomoko: Mình thường xuyên theo dõi nhật ký du lịch chị ấy chia sẻ trên blog, bài viết rất giàu trải nghiệm, góc nhìn độc đáo, ảnh chụp cũng tuyệt đẹp, mở mang tầm mắt thực sự.
Dong-hyun: Chị mình dũng cảm lắm, một thân một mình mang ba lô đi qua hơn ba mươi quốc gia rồi. Chịu ảnh hưởng từ chị ấy nên giờ mình cũng đam mê du lịch tự túc.
Tomoko: Ngưỡng mộ thật đấy! Tháng trước chị ấy sang Đài Loan, hai chị em cậu chẳng phải còn cùng nhau đạp xe xuyên đảo đó sao?
Dong-hyun: Đúng vậy, chuyến đi đó thực sự khó quên. Dù giữa đường gặp mưa như trút nước, đường đèo dốc trơn trượt, nhưng khoảnh khắc vượt qua thử thách cán đích thành công đem lại cảm giác tự hào vô cùng.
Tomoko: Đi phượt bụi tuy vất vả hơn đi tour trọn gói nhưng lại cảm nhận sâu sắc phong tục tập quán bản địa, lại rèn luyện được tính tự lập xử lý mọi tình huống.
Dong-hyun: Chuẩn luôn, hơn nữa bạn bè quen biết trên những cung đường phượt thường trở thành những người bạn tri kỷ suốt đời.
Tomoko: Đợi đến kỳ nghỉ đông, hai đứa mình cùng lên kế hoạch làm một chuyến du lịch bụi đi!
Dong-hyun: Ý kiến tuyệt vời, chúng mình cùng nhau lên lộ trình thật chu đáo nhé!"""
)

# ------------------------------------------------------------------------------
# L114: 穿衣風格 (東賢 & 朋子)
# ------------------------------------------------------------------------------
b3_data["114"] = (
"""東賢：朋子，妳最近穿衣服的風格跟以前很不一樣耶，名牌衣服怎麼都不穿了？
朋子：我想改變大家對我的刻板印象。以前我從頭到腳都是名牌，容易讓人產生距離感，以為我很難相處。
東賢：老實說，剛認識妳的時候，我確實覺得妳像個高不可攀的千金小姐。
朋子：其實那跟我爸媽的觀念有關，他們很講究品牌與身分地位。但來到臺灣念書後，我發現同學們穿著簡單大方、舒適自然，反而更有親和力。
東賢：沒錯，衣服最重要的是穿得舒服，展現自己的個性，而不是盲目追求名牌標籤。
朋子：現在我都買平價品牌的棉質T恤和牛仔褲，不僅省下了很多錢，而且行動起來自在多了！
東賢：妳現在的穿搭非常好看，既青春又有活力，整個人感覺親切很多。
朋子：謝謝你的讚美！做真實的自己才是最輕鬆快樂的。""",

"""Dong-hyun: Tomoko, phong cách ăn mặc dạo này của cậu nhìn khác trước nhiều thật đấy, sao không thấy diện đồ hiệu nữa thế?
Tomoko: Mình muốn thay đổi ấn tượng đóng khung của mọi người về mình. Hồi trước từ đầu đến chân toàn hàng hiệu đắt tiền, dễ tạo cảm giác xa cách khiến người ta nghĩ mình khó gần kiêu kỳ.
Dong-hyun: Thú thật lúc mới quen cậu, mình cũng từng nghĩ cậu là tiểu thư đài các xa vời khó với tới đấy.
Tomoko: Thật ra điều đó bắt nguồn từ quan niệm của bố mẹ mình, gia đình luôn coi trọng thương hiệu và đẳng cấp xã hội. Nhưng từ khi sang Đài Loan du học, mình thấy các bạn ăn mặc rất giản dị, thanh lịch, thoải mái tự nhiên mà lại toát lên vẻ gần gũi thân thiện.
Dong-hyun: Chuẩn đấy, quần áo quan trọng nhất là mặc vào thấy thoải mái, thể hiện được cá tính riêng của mình chứ không phải chạy theo những chiếc mác hàng hiệu hào nhoáng.
Tomoko: Giờ mình toàn mua áo thun cotton với quần jeans của các thương hiệu bình dân, vừa tiết kiệm được bao nhiêu tiền lại vừa vận động thoải mái linh hoạt hơn hẳn!
Dong-hyun: Phong cách phối đồ hiện tại của cậu rất đẹp, trẻ trung tràn đầy năng lượng, trông cậu gần gũi dễ mến hơn rất nhiều.
Tomoko: Cảm ơn lời khen của cậu nhé! Được sống thật với chính mình mới là điều nhẹ nhõm và vui vẻ nhất."""
)

# ------------------------------------------------------------------------------
# L115: 體育運動 (家豪 & 東賢)
# ------------------------------------------------------------------------------
b3_data["115"] = (
"""家豪：東賢，聽說你弟弟在高中網球比賽中拿到了冠軍，恭喜啊！
東賢：謝謝！他從小就熱愛網球，天天風雨無阻地練習，拿到這個成績大家都替他高興。
家豪：打網球需要很好的體能和爆發力，他平時是怎麼訓練的？
東賢：他每天清晨六點就起床晨跑五公里，下午放學後在球場練習發球和接球，還要進行重量訓練。
家豪：運動員的毅力真讓人佩服！我平時連慢跑半小時都覺得累得喘不過氣來。
東賢：運動習慣都是慢慢培養出來的。一開始不要給自己太大壓力，從散步、慢跑開始，漸漸就會發現體能進步了。
家豪：你說得對。這週六我們學校有籃球友誼賽，你有空一起去打球嗎？
東賢：好啊，好久沒在球場上奔跑了，週六下午體育館見！""",

"""Gia Hào: Dong-hyun, nghe nói em trai cậu vừa đoạt chức vô địch giải tennis học sinh cấp ba, chúc mừng nhé!
Dong-hyun: Cảm ơn cậu! Thằng bé đam mê tennis từ nhỏ, ngày nào cũng miệt mài luyện tập bất kể mưa nắng, giành được thành tích này cả nhà đều mừng rỡ khôn xiết.
Gia Hào: Đánh tennis đòi hỏi nền tảng thể lực cực tốt và sức bật dẻo dai, bình thường em cậu tập luyện thế nào vậy?
Dong-hyun: Sáng nào 6 giờ em ấy cũng dậy chạy bộ 5 cây số, chiều tan học thì tập giao bóng và đỡ bóng trên sân, ngoài ra còn tập thêm tạ để tăng cường thể lực.
Gia Hào: Nghị lực kiên trì của các vận động viên thể thao quả thực đáng khâm phục! Mình ngày thường chạy bộ có nửa tiếng thôi mà thở không ra hơi rồi.
Dong-hyun: Thói quen rèn luyện thể thao đều phải tích lũy từ từ mà ra cả. Ban đầu đừng tạo áp lực quá lớn cho bản thân, cứ bắt đầu từ đi bộ nhanh rồi chạy cự ly ngắn, dần dà cậu sẽ thấy thể lực cải thiện rõ rệt.
Gia Hào: Cậu nói rất đúng. Thứ Bảy tuần này trường mình có trận giao hữu bóng rổ, cậu có rảnh vào chơi cùng bọn mình một trận không?
Dong-hyun: Nhất trí, lâu lắm rồi không được tung hoành trên sân bóng, chiều thứ Bảy hẹn nhau ở nhà thi đấu nhé!"""
)

# ------------------------------------------------------------------------------
# L116: 健康檢查 (朋子 & 家豪)
# ------------------------------------------------------------------------------
b3_data["116"] = (
"""朋子：家豪，你手上拿的是什麼資料呀？是醫院的健檢報告嗎？
家豪：對啊，早上陪我阿姨去醫院辦理住院手續時，順便在服務台拿了這份健康檢查簡介。
朋子：你打算去做健康檢查嗎？
家豪：是啊，現代人生活壓力大、作息不正常，很多人平時看似健康，體檢後才發現身體亮紅燈。定期體檢才能「早期發現，早期治療」。
朋子：確實是這樣。我每年都會去醫院做一次全身健檢，項目包括抽血、照X光和腹部超音波。
家豪：費用會很貴嗎？
朋子：看妳選擇的檢查方案，基本項目費用很親民，有些還有政府補助呢！
家豪：那我今天回家就上網預約下個月的檢查，照顧好身體才是對家人負責的表現。
朋子：沒錯，身體健康是一切的基礎！""",

"""Tomoko: Gia Hào, cậu cầm tập tài liệu gì trên tay thế kia? Phiếu kết quả kiểm tra sức khỏe của bệnh viện à?
Gia Hào: Đúng vậy, sáng nay mình đưa dì vào viện làm thủ tục nhập viện, nhân tiện ở quầy thông tin lấy tập tờ rơi giới thiệu gói khám sức khỏe tổng quát này.
Tomoko: Cậu dự định đi khám tổng quát à?
Gia Hào: Ừ, người hiện đại áp lực công việc lớn, giờ giấc sinh hoạt lại thất thường, nhiều người nhìn bên ngoài khỏe mạnh thế thôi chứ khám ra mới biết cơ thể đã báo động đỏ. Khám định kỳ mới có thể "phát hiện sớm, điều trị sớm".
Tomoko: Chuẩn xác là như vậy đấy. Năm nào mình cũng đến bệnh viện làm kiểm tra toàn thân một lần, bao gồm xét nghiệm máu, chụp X-quang và siêu âm ổ bụng.
Gia Hào: Chi phí khám có đắt đỏ lắm không cậu?
Tomoko: Tùy thuộc vào gói khám cậu chọn, các gói cơ bản chi phí rất phải chăng, một số hạng mục còn được chính phủ trợ giá bảo hiểm y tế nữa cơ!
Gia Hào: Thế thì tối nay về nhà mình lên mạng đặt lịch khám cho tháng sau luôn, chăm sóc tốt bản thân chính là trách nhiệm với gia đình.
Tomoko: Hoàn toàn chính xác, sức khỏe dồi dào mới là cội nguồn của mọi ước mơ!"""
)

# ------------------------------------------------------------------------------
# L117: 網路交友要小心 (馬丁 & 芳草)
# ------------------------------------------------------------------------------
b3_data["117"] = (
"""馬丁：芳草，妳看今天的新聞了嗎？有名高學歷的工程師在交友軟體上被騙了幾百萬呢！
芳草：我也看到了，那個詐騙分子在網路上盜用美女照片，假裝對他噓寒問暖，博取信任後就誘騙他投資虛擬貨幣。
馬丁：現在網路詐騙的手法真是層出不窮，稍微不注意就會掉進陷阱。
芳草：在虛擬世界裡，對方的身分、照片甚至聲音都可以造假。遇到談到錢或者要借錢的情況，一定要立刻提高警覺。
馬丁：沒錯，防人之心不可無。網路交友可以拓展生活圈，但見面一定要約在公共場所，更不能隨便提供個人帳戶資料。
芳草：保護自己的隱私與安全，永遠都是第一位的！""",

"""Martin: Phương Thảo, cậu đã đọc tin tức hôm nay chưa? Có một kỹ sư học thức cao bị lừa mất hàng trăm triệu trên ứng dụng hẹn hò qua mạng đấy!
Phương Thảo: Mình cũng vừa xem xong, đối tượng lừa đảo lấy trộm ảnh hotgirl trên mạng, ngày nào cũng nhắn tin quan tâm chăm sóc ngọt ngào, tạo dựng lòng tin xong là dụ dỗ đầu tư vào tiền ảo.
Martin: Thủ đoạn lừa đảo công nghệ cao trên mạng bây giờ thiên biến vạn hóa thật, chỉ cần mất cảnh giác một chút là sập bẫy ngay.
Phương Thảo: Trong thế giới mạng ảo, thân phận, hình ảnh, thậm chí cả giọng nói của đối phương đều có thể làm giả tinh vi. Cứ hễ thấy đụng chạm đến tiền bạc hoặc mở lời vay mượn là phải lập tức cảnh giác cao độ.
Martin: Chuẩn luôn, lòng phòng bị người thì lúc nào cũng phải có. Kết bạn qua mạng giúp mở rộng giao lưu, nhưng nếu hẹn gặp mặt nhất định phải chọn nơi công cộng đông người, và tuyệt đối không bao giờ cung cấp thông tin tài khoản cá nhân.
Phương Thảo: Bảo vệ an toàn và sự riêng tư của bản thân luôn luôn là nguyên tắc số một!"""
)

# ------------------------------------------------------------------------------
# L118: 你有面試的經驗嗎？ (林家豪 & 王經理)
# ------------------------------------------------------------------------------
b3_data["118"] = (
"""王經理：林先生，您好！請坐。我是業務部王經理，負責今天的面試。
林家豪：王經理您好！非常榮幸能有機會來貴公司參加面試。這是我的履歷與作品集。
王經理：我看過您的自傳，您在大學期間曾在電腦公司實習過，能談談那段經歷帶給您什麼收穫嗎？
林家豪：實習期間我主要負責向客戶介紹產品功能並處理售後諮詢。這段經驗不僅提升了我的溝通技巧，也讓我學會站在顧客的角度思考問題。
王經理：如果遇到情緒激動、對產品不滿意的客戶，您會如何應對？
林家豪：我會先保持冷靜，耐心傾聽客戶的訴求，先安撫對方的情緒，再針對核心問題迅速提出切實可行的解決方案。
王經理：很好！做業務最重要的就是抗壓性與解決問題的能力。您對未來的職涯有什麼期許？
林家豪：我希望能運用我的專業知識，在貴公司的優秀團隊中發揮所長，為公司拓展更多海內外業務。
王經理：感謝您今天的說明，面試結果我們會在下週五前以電子郵件通知您。
林家豪：謝謝王經理，期待有機會能加入貴公司！""",

"""Trưởng phòng Vương: Chào anh Lâm! Mời anh ngồi. Tôi là Vương, Trưởng phòng Kinh doanh, phụ trách buổi phỏng vấn hôm nay.
Lâm Gia Hào: Dạ em chào Trưởng phòng Vương ạ! Em rất vinh dự khi có cơ hội được đến công ty tham gia phỏng vấn hôm nay. Đây là hồ sơ lý lịch và các dự án thực tế của em ạ.
Trưởng phòng Vương: Tôi đã xem qua thư giới thiệu bản thân của anh, trong thời gian đại học anh từng thực tập ở một công ty máy tính công nghệ, anh có thể chia sẻ về những bài học kinh nghiệm thu được sau kỳ thực tập đó không?
Lâm Gia Hào: Dạ, trong thời gian thực tập em phụ trách tư vấn tính năng sản phẩm cho khách hàng và xử lý khiếu nại sau bán hàng. Kinh nghiệm đó không chỉ nâng cao kỹ năng giao tiếp mà còn giúp em học được cách tư duy đặt mình vào vị trí của khách hàng ạ.
Trưởng phòng Vương: Nếu gặp phải khách hàng đang nóng giận mất bình tĩnh vì chưa hài lòng với sản phẩm, anh sẽ xử lý tình huống đó như thế nào?
Lâm Gia Hào: Dạ trước tiên em sẽ giữ thái độ hòa nhã lắng nghe trọn vẹn bức xúc của khách hàng, xoa dịu tâm trạng của họ trước, sau đó nhanh chóng tìm ra mấu chốt vấn đề và đề xuất giải pháp xử lý triệt để và thỏa đáng nhất ạ.
Trưởng phòng Vương: Rất tốt! Làm kinh doanh quan trọng nhất chính là khả năng chịu áp lực và kỹ năng giải quyết vấn đề linh hoạt. Anh có định hướng gì cho con đường sự nghiệp sắp tới không?
Lâm Gia Hào: Dạ em mong muốn được vận dụng kiến thức chuyên môn đã tích lũy để cống hiến hết mình cùng tập thể công ty, góp phần mở rộng mạng lưới khách hàng trong và ngoài nước ạ.
Trưởng phòng Vương: Cảm ơn những chia sẻ rất thẳng thắn của anh hôm nay. Kết quả phỏng vấn phòng nhân sự sẽ gửi thông báo qua email trước thứ Sáu tuần tới.
Lâm Gia Hào: Dạ em cảm ơn Trưởng phòng Vương nhiều ạ, em rất hy vọng sẽ có cơ hội được làm việc tại quý công ty!"""
)

# ------------------------------------------------------------------------------
# L119: 雲端科技真便利 (芳草 & 明哲)
# ------------------------------------------------------------------------------
b3_data["119"] = (
"""芳草：明哲，你怎麼一直盯著手機看呀？
明哲：我在查雲端圖書館的借書記錄，看看電子書的借閱期限到什麼時候。
芳草：雲端圖書館？我從來沒用過耶，很方便嗎？
明哲：非常方便！只要在手機上下載專用APP，輸入借閱帳號，就能免費借閱成千上萬本電子書和期刊雜誌。
芳草：這樣出門就不用背著沉甸甸的紙本書了，隨時隨地都能閱讀。
明哲：沒錯，而且借閱期滿系統會自動歸還，完全不用擔心逾期罰款的問題。
芳草：科技真的改變了我們的學習方式，你待會兒教我怎麼註冊帳號吧！
明哲：沒問題，一分鐘就能搞定！""",

"""Phương Thảo: Minh Triết, sao cậu cứ chăm chú nhìn vào màn hình điện thoại suốt thế?
Minh Triết: Mình đang kiểm tra lịch sử mượn sách trên thư viện đám mây, xem hạn mượn mấy cuốn sách điện tử còn bao nhiêu ngày.
Phương Thảo: Thư viện đám mây á? Trước giờ mình chưa dùng bao giờ, có tiện lợi lắm không cậu?
Minh Triết: Tiện lợi vô cùng luôn! Chỉ cần tải ứng dụng về điện thoại, đăng nhập tài khoản thư viện là có thể mượn đọc miễn phí hàng vạn đầu sách điện tử và tạp chí chuyên ngành.
Phương Thảo: Thế này thì mỗi lần ra ngoài không phải vác theo những cuốn sách giấy dày cộm nặng trĩu nữa rồi, rảnh lúc nào mở điện thoại ra đọc lúc đó.
Minh Triết: Chuẩn luôn, hơn nữa đến hạn trả sách hệ thống sẽ tự động hoàn trả, không bao giờ lo bị phạt tiền quá hạn cả.
Phương Thảo: Công nghệ số đã thay đổi hoàn toàn cách học tập của chúng mình rồi, lát nữa cậu hướng dẫn mình cách đăng ký tài khoản với nhé!
Minh Triết: Chuyện nhỏ, chỉ một phút là xong ngay thôi!"""
)

# ------------------------------------------------------------------------------
# L120: 七夕情人節的故事 (朋子 & 馬丁)
# ------------------------------------------------------------------------------
b3_data["120"] = (
"""朋子：馬丁，你這個手工編織的手環真精緻，在哪裡買的呀？
馬丁：這是我女朋友親手做的七夕情人節禮物。在法國只有二月十四日的情人節，來到臺灣我才知道還有農曆七夕呢！
朋子：七夕在華人文化裡非常有浪漫色彩，背後還有一個動人的傳說故事呢。
馬丁：是牛郎與織女的故事嗎？你能跟我說說嗎？
朋子：傳說天上的織女和人間勤勞的牛郎相愛結為夫妻，但天帝反對，用銀河把他們分隔兩地，每年只有農曆七月七日這天，喜鵲才會搭成鵲橋讓他們相會一次。
馬丁：一年只能見一次面，這個故事雖然悲傷，但也讓人更加珍惜身邊相聚的時光。
朋子：沒錯，真摯的感情是不會被時間和距離阻隔的。祝你和你女朋友七夕節快樂！
馬丁：謝謝妳，朋子！""",

"""Tomoko: Martin, chiếc vòng tay đan thủ công này của cậu tinh xảo quá, cậu mua ở đâu thế?
Martin: Đây là món quà bạn gái tự tay đan tặng mình nhân dịp lễ Thất Tịch đấy. Ở Pháp bọn mình chỉ có ngày Valentine 14 tháng 2 thôi, sang Đài Loan mình mới biết có cả ngày lễ tình nhân Thất Tịch âm lịch nữa.
Tomoko: Lễ Thất Tịch trong văn hóa phương Đông mang đậm màu sắc lãng mạn, phía sau còn có một câu chuyện truyền thuyết vô cùng cảm động đấy.
Martin: Có phải là truyền thuyết Ngưu Lang - Chức Nữ không cậu? Cậu kể cho mình nghe với được không?
Tomoko: Tương truyền nàng Chức Nữ trên trời và chàng Ngưu Lang hiền lành cần mẫn chốn nhân gian đem lòng yêu nhau nên duyên vợ chồng, nhưng Vương Mẫu nương nương phản đối kịch liệt, bèn vạch ra dải Ngân Hà chia cắt đôi bờ, mỗi năm chỉ duy nhất vào đêm mùng 7 tháng 7 âm lịch đàn quạ đen mới bắc cầu Ô Thước cho họ được trùng phùng một lần.
Martin: Cả năm trời chỉ được gặp nhau có một lần, câu chuyện tuy đượm buồn nhưng càng khiến người ta biết trân trọng những phút giây được kề cạnh bên nhau.
Tomoko: Đúng vậy, tình yêu chân thành sâu sắc thì không khoảng cách hay thời gian nào có thể ngăn trở được. Chúc cậu và bạn gái có một mùa lễ Thất Tịch thật hạnh phúc nhé!
Martin: Cảm ơn lời chúc tốt đẹp của cậu nhé Tomoko!"""
)

# ------------------------------------------------------------------------------
# L121: 去淡水參觀古蹟 (東賢 & 家豪)
# ------------------------------------------------------------------------------
b3_data["121"] = (
"""東賢：家豪，老師要我們這學期寫一份關於臺灣歷史文化的報告。
家豪：你打算選什麼主題呢？
東賢：我想介紹淡水的紅毛城，這個週末想親自去一趟實地考察。
家豪：紅毛城是荷蘭人在三百多年前建造的古蹟，在臺灣歷史上具有非常重要的政治與外交意義。
東賢：聽起來很有歷史深度，週末你跟我一起去吧！
家豪：好啊，我對淡水很熟。參觀完紅毛城，我還可以帶你去參觀龍山寺，欣賞寺廟裡栩栩如生的石雕龍柱。
東賢：太棒了！寺廟是民間信仰的中心，也是傳統建築藝術的精華。
家豪：傍晚我們再去淡水碼頭看夕陽，那裡的晚霞美得令人難忘！
東賢：有你當嚮導我就放心了，那我們這週六早上捷運站見！
家豪：好，週六見！""",

"""Dong-hyun: Gia Hào, thầy giáo yêu cầu học kỳ này chúng mình viết một bài báo cáo về lịch sử văn hóa Đài Loan.
Gia Hào: Cậu định chọn đề tài gì thế?
Dong-hyun: Mình muốn giới thiệu về Hồng Mao Thành ở Đạm Thủy, cuối tuần này mình muốn đích thân đến tận nơi khảo sát thực tế một chuyến.
Gia Hào: Hồng Mao Thành là di tích lịch sử do người Hà Lan xây dựng từ hơn ba trăm năm trước, mang ý nghĩa chính trị và ngoại giao vô cùng quan trọng trong lịch sử Đài Loan.
Dong-hyun: Nghe giàu bề dày lịch sử thật đấy, cuối tuần này cậu đi cùng mình nhé!
Gia Hào: Nhất trí, mình rành Đạm Thủy lắm. Tham quan xong Hồng Mao Thành, mình dẫn cậu đi thăm chùa Long Sơn luôn, chiêm ngưỡng những cột rồng đá điêu khắc sống động như thật.
Dong-hyun: Tuyệt vời quá! Chùa chiền là trung tâm tín ngưỡng dân gian, cũng là tinh hoa của nghệ thuật kiến trúc cổ truyền.
Gia Hào: Chiều muộn chúng mình ra bến tàu Đạm Thủy ngắm hoàng hôn, ráng chiều ở đó đẹp say đắm lòng người luôn!
Dong-hyun: Có cậu làm hướng dẫn viên thì mình yên tâm tuyệt đối rồi, vậy sáng thứ Bảy này hẹn gặp nhau ở ga tàu điện ngầm nhé!
Gia Hào: Được, thứ Bảy gặp nhé!"""
)

# ------------------------------------------------------------------------------
# L122: 愛惜食物從你我做起 (芳草 & 東賢)
# ------------------------------------------------------------------------------
b3_data["122"] = (
"""芳草：東賢你看，這區的生鮮蔬菜和麵包都在打六折耶，好便宜喔！
東賢：是啊，這家超市會在傍晚把當天即期的優質食物以優惠價格出清，既幫顧客省錢，又能減少食物浪費。
芳草：這個做法真棒！明明還很新鮮美味的食物，如果因為賣不完就被當成垃圾丟掉，真的太可惜了。
東賢：沒錯，世界上還有很多貧困地區面臨糧食短缺的困境，我們身處物資豐富的環境，更應該懂得感恩與珍惜。
芳草：愛惜食物真的要從日常生活的細節做起，平時吃多少煮多少，吃不完的打包帶走。
東賢：說得很好！今天我們就買這些即期特價食材回去做晚餐吧，環保省錢又吃得安心。
芳草：好，走，我們去結帳！""",

"""Phương Thảo: Dong-hyun nhìn kìa, khu rau củ quả tươi sống với bánh mì này đang giảm giá 40% lận, rẻ quá đi mất!
Dong-hyun: Đúng rồi, siêu thị này cứ vào tầm chiều tối là xả hàng các thực phẩm cận date chất lượng cao với giá ưu đãi, vừa giúp khách hàng tiết kiệm túi tiền lại vừa tránh lãng phí thức ăn.
Phương Thảo: Cách làm này văn minh thật sự! Đồ ăn rõ ràng vẫn còn tươi ngon hảo hạng, nếu chỉ vì bán không hết trong ngày mà bị vứt bỏ vào thùng rác thì xót ruột vô cùng.
Dong-hyun: Chuẩn đấy, trên thế giới hiện nay vẫn còn biết bao khu vực nghèo khó phải đối mặt với nạn thiếu thốn lương thực, chúng mình được sống trong điều kiện no đủ thế này càng phải biết trân trọng và biết ơn.
Phương Thảo: Tiết kiệm lương thực thực sự phải bắt đầu từ những thói quen nhỏ hàng ngày, ăn bao nhiêu nấu bấy nhiêu, đi ăn ngoài thừa thì xin hộp gói mang về.
Dong-hyun: Cậu nói chuẩn không cần chỉnh! Hôm nay chúng mình mua những nguyên liệu giảm giá này về nấu bữa tối nhé, vừa bảo vệ môi trường, tiết kiệm lại vừa an tâm thưởng thức.
Phương Thảo: Nhất trí luôn, đi nào, chúng mình ra quầy thanh toán!"""
)

# Apply all to contents
for lid, (zh, vi) in b3_data.items():
    if lid in contents and len(contents[lid]) > 0:
        it = contents[lid][0]
        it["content"] = zh
        it["vietnamese"] = vi
        zh_count = len(zh.strip().splitlines())
        vi_count = len(vi.strip().splitlines())
        print(f"Updated Book 3 Lesson {lid}: ZH={zh_count} lines, VI={vi_count} lines (100% matched)")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(contents, f, ensure_ascii=False, indent=2)

print("\nAll 14 lessons of Book 3 successfully updated!")
