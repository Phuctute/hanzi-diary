# -*- coding: utf-8 -*-
"""
Master rebuild script for Book 8 (Thời Đại 2 - 時代華語 2, Lessons 91-106).
Standardizes dialogue lines, speakers, punctuation, removes OCR artifacts,
and synchronizes Vietnamese translations line-for-line.
"""

import json
import gzip
import os

LESSONS_B8 = {}

# ==============================================================================
# LESSON 91: 認識新朋友
# ==============================================================================
LESSONS_B8["91"] = {
    "dialogue_title": "認識新朋友（課本對話）",
    "dialogue_cn": """美心：你怎麼了？為什麼不去吃午飯？
良介：今天早上起來的時候，覺得背很疼，我想休息一下。
美心：要是明天還是很疼，最好去看醫生或是去藥房買藥。
良介：謝謝妳。對了！我最近在網路上認識了一個女生，她不但很溫柔，也很客氣。我每天都給她打電話，我們聊得很愉快。
美心：你們認識多久了？
良介：差不多一個月了。
美心：見過面了嗎？
良介：還沒，她說她不好意思跟我見面，所以我不知道怎麼辦。
美心：也許她覺得一個人跟你見面不安全。這個禮拜六學校有舞會，你要不要請她跟她的朋友一起來參加？
良介：這個辦法不錯，妳以前也有這樣的經驗嗎？
美心：當然有啊！以前有一個男生要跟我約會，我也很害怕，不敢自己跟他見面。
良介：後來呢？
美心：那個時候我剛好要跟同學去動物園玩，我就約他一起去。那天大家在動物園裡看看動物、開開玩笑，後來我就敢一個人跟他約會了。
良介：聽妳說完了以後，我想我知道應該怎麼做了。
美心：現在你的背好一點兒了嗎？
良介：好像不疼了。""",
    "dialogue_vi": """Mỹ Tâm: Cậu sao thế? Sao không đi ăn trưa?
Lương Giới: Sáng nay lúc thức dậy, tớ thấy lưng rất đau, tớ muốn nghỉ ngơi một chút.
Mỹ Tâm: Nếu ngày mai vẫn còn đau, tốt nhất nên đi khám bác sĩ hoặc ra hiệu thuốc mua thuốc.
Lương Giới: Cảm ơn cậu. Đúng rồi! Gần đây tớ quen một bạn nữ trên mạng, bạn ấy không những rất dịu dàng mà còn rất lịch sự. Ngày nào tớ cũng gọi điện cho bạn ấy, chúng tớ trò chuyện rất vui vẻ.
Mỹ Tâm: Hai người quen nhau bao lâu rồi?
Lương Giới: Gần một tháng rồi.
Mỹ Tâm: Đã gặp mặt chưa?
Lương Giới: Vẫn chưa, bạn ấy bảo ngại gặp tớ, nên tớ không biết phải làm sao.
Mỹ Tâm: Có lẽ bạn ấy thấy gặp cậu một mình thì không an toàn. Thứ Bảy tuần này trường có dạ hội, cậu có muốn mời bạn ấy rủ bạn bè cùng đến tham gia không?
Lương Giới: Cách này hay đấy, trước đây cậu cũng từng có kinh nghiệm như vậy à?
Mỹ Tâm: Đương nhiên là có chứ! Trước đây có một bạn nam muốn hẹn hò với tớ, tớ cũng rất sợ, không dám đi gặp một mình.
Lương Giới: Rồi sau đó thì sao?
Mỹ Tâm: Lúc đó tớ vừa hay định cùng bạn học đi sở thú chơi, tớ liền hẹn cậu ấy đi cùng. Hôm đó mọi người ở sở thú ngắm thú, nói chuyện đùa vui, sau đó tớ mới dám đi hẹn hò riêng với cậu ấy.
Lương Giới: Nghe cậu kể xong, tớ nghĩ tớ biết phải làm thế nào rồi.
Mỹ Tâm: Bây giờ lưng cậu đỡ hơn chút nào chưa?
Lương Giới: Dường như không đau nữa rồi.""",

    "text_title": "第一次見面（課本短文）",
    "text_cn": """山本良介本來是一個害羞的日本學生，來臺灣以後，他住在學校的宿舍，認識了很多朋友，常常跟他們去吃飯、打球。放假的時候，朋友帶他去參觀博物館、看表演，所以他覺得在臺灣的生活很快樂，也好像不那麼害羞了。
那個女生覺得雖然良介是外國人，中文也說得不太好，可是他們的興趣一樣，都喜歡看書、運動，而且跟他在一起很安全、很有意思。現在他們不但常常上網聊天，也會一起去打籃球、騎腳踏車呢！""",
    "text_vi": """Yamamoto Ryosuke vốn là một du học sinh Nhật Bản nhút nhát, sau khi đến Đài Loan, cậu sống trong ký túc xá của trường, quen biết rất nhiều bạn bè, thường cùng họ đi ăn cơm, chơi bóng. Khi được nghỉ, bạn bè dẫn cậu đi tham quan viện bảo tàng, xem biểu diễn, cho nên cậu cảm thấy cuộc sống ở Đài Loan rất vui vẻ, dường như cũng không còn nhút nhát như trước nữa.
Bạn nữ kia cảm thấy tuy Ryosuke là người nước ngoài, tiếng Trung nói chưa lưu loát lắm, nhưng sở thích của hai người lại giống nhau, đều thích đọc sách, thể thao, hơn nữa ở bên cậu ấy rất an toàn và thú vị. Bây giờ họ không những thường xuyên trò chuyện trên mạng mà còn cùng nhau đi chơi bóng rổ, đạp xe đạp nữa đấy!"""
}

# ==============================================================================
# LESSON 92: 我得做家事
# ==============================================================================
LESSONS_B8["92"] = {
    "dialogue_title": "我得做家事（課本對話）",
    "dialogue_cn": """可欣：良介，今天是開學的第一天，功課不多，我們一起去看球賽或是看電影吧！
良介：我不能去，我得先去我父母的餐廳幫忙。
可欣：去餐廳要幫什麼忙呢？
良介：把桌子擦了，再把碗筷刀叉洗一洗。
可欣：做那些事情要多久？
良介：客人多的時候，差不多要兩個小時。因為碗筷洗完了，還得擦乾；有時候客人掉了東西，非常著急，我就得幫他們找一找，再把東西拿給他們。
可欣：那些事情做完以後，你就有空去看球賽了吧？
良介：不，做完我得趕快回宿舍。媽媽說我的房間太髒了，叫我今天一定要打掃。
可欣：你的房間有多髒啊？晚一點再打掃應該沒關係吧。
良介：我已經三個月沒掃地了！暑假我先去日本玩了十天，回臺灣以後，又跟朋友去南部玩了兩個星期。
可欣：你玩了這麼多天，功課做了沒有？
良介：暑假快結束的時候，我才看完老師要我們看的書，當然就沒時間打掃了。可是如果房間太亂，我會覺得不舒服，也沒辦法念書。
可欣：對了，我家裡有一些中文小說，我覺得把那些書都丟了很可惜，送給你，好嗎？
良介：好啊！那些書對我學中文很有用。我先回宿舍把功課寫完，就去妳家拿。
可欣：太好了！這樣你就可以順便跟我一起打掃了！""",
    "dialogue_vi": """Khả Hân: Lương Giới, hôm nay là ngày đầu tiên khai giảng, bài tập không nhiều, chúng mình cùng đi xem trận bóng hay xem phim đi!
Lương Giới: Tớ không đi được rồi, tớ phải đến nhà hàng của bố mẹ giúp một tay trước đã.
Khả Hân: Đến nhà hàng phụ giúp những việc gì thế?
Lương Giới: Lau bàn ghế, rồi rửa sạch bát đũa, dao dĩa nữa.
Khả Hân: Làm mấy việc đó mất bao lâu?
Lương Giới: Những lúc đông khách thì mất chừng hai tiếng. Bởi vì rửa xong bát đũa còn phải lau khô; đôi khi khách để quên đồ, cuống quýt lên, tớ lại phải giúp họ tìm rồi mang trả lại cho họ.
Khả Hân: Làm xong hết những việc đó thì cậu có thời gian đi xem bóng rồi, đúng không?
Lương Giới: Không, làm xong tớ phải nhanh chóng về ký túc xá. Mẹ bảo phòng tớ bẩn quá, dặn hôm nay nhất định phải dọn dẹp sạch sẽ.
Khả Hân: Phòng cậu bẩn đến mức nào cơ chứ? Dọn muộn một chút chắc cũng chẳng sao đâu.
Lương Giới: Tớ đã ba tháng rồi chưa quét nhà đấy! Kỳ nghỉ hè tớ sang Nhật chơi mười ngày trước, sau khi về Đài Loan lại cùng bạn bè vào miền Nam chơi suốt hai tuần.
Khả Hân: Cậu đi chơi nhiều ngày thế, bài tập đã làm chưa đấy?
Lương Giới: Mãi đến gần hết kỳ nghỉ hè tớ mới đọc xong sách thầy cô yêu cầu, thành ra đương nhiên chẳng còn thời gian đâu mà dọn dẹp. Nhưng nếu phòng bừa bãi quá, tớ thấy rất khó chịu, cũng không tài nào học bài được.
Khả Hân: À đúng rồi, nhà tớ có mấy cuốn tiểu thuyết tiếng Trung, tớ thấy vứt bỏ đi thì tiếc quá, tớ tặng cậu nhé?
Lương Giới: Được thế thì tốt quá! Mấy cuốn sách đó rất có ích cho việc học tiếng Trung của tớ. Tớ về ký túc xá làm xong bài tập sẽ sang nhà cậu lấy ngay.
Khả Hân: Tuyệt vời! Như vậy cậu có thể nhân tiện cùng tớ dọn dẹp phòng luôn rồi!""",

    "text_title": "我要住在乾淨的地方（課本短文）",
    "text_cn": """山本良介今天早上出門的時候，看見房間門口有一個袋子。他把袋子打開，發現裡面都是垃圾。下樓的時候，樓梯上也有垃圾。他想，是誰把垃圾丟在這裡的，好髒啊！他知道應該先把垃圾丟到垃圾桶，再去上課。
下午回到宿舍，他跟室友陳可欣說起這件事。可欣說，常常有人亂丟垃圾，真沒禮貌。良介覺得，如果要讓環境保持乾淨，就得大家一起做好家事、維護環境。可欣聽了，很同意良介的想法。他們決定今天晚上就開始打掃房間，先把垃圾分類，再把地板擦乾淨。
良介覺得，做家事雖然有一點累，可是看見房間變得這麼乾淨，心情就好多了。如果不自覺打掃，不久以後，這個地方就會又髒又亂，沒有人想住了。所以養成隨時整理的好習慣，真的非常重要。""",
    "text_vi": """Sáng nay khi Yamamoto Ryosuke bước ra khỏi cửa, cậu nhìn thấy một chiếc túi ở ngay trước cửa phòng. Cậu mở túi ra và phát hiện bên trong toàn là rác. Lúc đi xuống cầu thang, trên các bậc thang cũng vương vãi rác bẩn. Cậu nghĩ, ai lại vứt rác ở đây thế này, bẩn quá đi mất! Cậu biết mình nên nhặt rác bỏ vào thùng rác trước rồi mới đi học.
Buổi chiều trở về ký túc xá, cậu kể lại chuyện này với cô bạn cùng phòng Trần Khả Hân. Khả Hân bảo, thường xuyên có người vứt rác bừa bãi, thật là thiếu lịch sự. Ryosuke cảm thấy, nếu muốn giữ cho môi trường luôn sạch sẽ thì mọi người đều phải cùng nhau làm việc nhà, giữ gìn vệ sinh chung. Khả Hân nghe xong rất đồng tình với ý kiến của Ryosuke. Họ quyết định tối nay sẽ bắt tay vào dọn dẹp phòng ngay, phân loại rác trước rồi lau sạch sàn nhà.
Ryosuke cảm thấy, làm việc nhà tuy có hơi mệt một chút nhưng nhìn thấy căn phòng trở nên sạch sẽ tinh tươm như vậy, tâm trạng phấn chấn hơn hẳn. Nếu không có ý thức giữ gìn, chẳng mấy chốc nơi này sẽ lại vừa bẩn vừa bừa bộn, không ai muốn ở nữa. Vì vậy, việc rèn luyện thói quen ngăn nắp, sạch sẽ là điều vô cùng quan trọng."""
}

# ==============================================================================
# LESSON 93: 我要租房子
# ==============================================================================
LESSONS_B8["93"] = {
    "dialogue_title": "我要租房子（課本對話）",
    "dialogue_cn": """可欣：王太太，您好，我是陳可欣。這位是我的朋友山本良介，我陪他來看房子。
王太太：你們好！這棟公寓一共有六層，我要出租的房子在四樓，我們一起上去看看吧。
良介：好的，謝謝您。對了，請問裡面有傢俱嗎？
王太太：有啊！有床、書桌、椅子、沙發，還有一個大衣櫃可以掛很多衣服，而且冰箱、洗衣機都是新的。
王太太：請進，我給你們介紹介紹。這裡是客廳，右邊是廚房，臥室和浴室在那邊。
可欣：房間看起來真不錯！請問附近有超級市場嗎？
王太太：有啊，從這裡出去走五分鐘就有超市和便利商店了。
良介：請問這裡有網路嗎？
王太太：現在沒有，不過我可以替你裝網路，可是每個月的費用要自己付。
良介：聽起來不錯。請問房租一個月多少錢？
王太太：一個月一萬五千塊，不包括水電費，還要兩個月的押金。
良介：好，我先跟我朋友討論一下，請您等一會兒。
可欣：你覺得這裡怎麼樣？
良介：這邊的環境很不錯，可是付了房租以後，我的獎學金就只剩一萬塊了。
可欣：這樣的房子都不便宜，你問問王太太房租能不能算便宜一點？
良介：王太太，這間公寓我很滿意，可是房租有一點貴，可以算便宜一點嗎？
王太太：我想想……你是留學生吧？我兒子也去法國留學了，我知道外國人在台灣找房子不太容易。
良介：對啊，我看了好幾個地方，有的環境很好但房租太貴，有些房東一看我是外國人就不願意租給我了。
王太太：好吧，既然你那麼喜歡，那就一個月一萬兩千塊吧！
良介：太好了，謝謝您！我決定租半年，下個星期一可以簽約嗎？
王太太：可以啊！你過來簽約的時候，請帶護照、第一個月房租和兩個月的押金。簽約以後我會給你鑰匙，你就可以搬進來了。
良介：太感謝您了，王太太，那我們下星期一見！""",
    "dialogue_vi": """Khả Hân: Bác Vương, chào bác ạ, cháu là Trần Khả Hân. Đây là bạn của cháu, Yamamoto Ryosuke, cháu dẫn bạn ấy đến xem nhà thuê ạ.
Bác Vương: Chào các cháu! Khu chung cư này có tổng cộng sáu tầng, căn hộ bác muốn cho thuê nằm ở tầng bốn, chúng ta cùng lên xem nhé.
Lương Giới: Vâng ạ, cảm ơn bác. À bác ơi, cho cháu hỏi trong nhà đã có sẵn nội thất chưa ạ?
Bác Vương: Có chứ cháu! Có giường, bàn học, ghế, ghế sô pha, lại có cả một chiếc tủ quần áo lớn treo được rất nhiều đồ, tủ lạnh với máy giặt cũng đều là đồ mới toanh cả.
Bác Vương: Mời các cháu vào nhà, bác dẫn các cháu đi xem một vòng nhé. Đây là phòng khách, bên phải là gian bếp, còn phòng ngủ và phòng tắm ở phía bên kia.
Khả Hân: Căn phòng trông đẹp và sáng sủa quá bác ạ! Bác ơi quanh đây có siêu thị không ạ?
Bác Vương: Có chứ, từ đây đi bộ ra ngoài chừng năm phút là có cả siêu thị lẫn cửa hàng tiện lợi rồi.
Lương Giới: Cho cháu hỏi ở đây có sẵn mạng Internet không ạ?
Bác Vương: Hiện tại thì chưa có, nhưng bác có thể lắp mạng giúp cháu, có điều cước phí hàng tháng cháu phải tự thanh toán nhé.
Lương Giới: Nghe tiện lợi quá ạ. Cho cháu hỏi tiền thuê nhà mỗi tháng là bao nhiêu ạ?
Bác Vương: Mỗi tháng mười lăm nghìn Đài tệ, chưa bao gồm tiền điện nước, và phải đặt cọc trước hai tháng tiền cọc.
Lương Giới: Dạ vâng, bác cho cháu bàn bạc với bạn một lát, xin bác đợi cháu một chút ạ.
Khả Hân: Cậu thấy căn nhà này thế nào?
Lương Giới: Môi trường ở đây rất thích, nhưng trả tiền thuê xong thì học bổng của tớ chỉ còn vỏn vẹn một vạn tệ thôi.
Khả Hân: Căn hộ tiện nghi thế này giá thường không rẻ đâu, cậu thử thương lượng với bác Vương xem có bớt cho chút nào không?
Lương Giới: Bác Vương ơi, cháu rất ưng căn hộ này, nhưng giá thuê hơi cao một chút, bác có thể bớt cho cháu một chút được không ạ?
Bác Vương: Để bác nghĩ xem nào... Cháu là lưu học sinh đúng không? Con trai bác cũng đi du học bên Pháp, bác hiểu người nước ngoài tìm thuê nhà ở Đài Loan không dễ dàng gì.
Lương Giới: Dạ vâng, cháu đã đi xem mấy nơi rồi, có chỗ môi trường tốt nhưng giá chát quá, có chủ nhà thấy cháu là người nước ngoài là không chịu cho thuê.
Bác Vương: Thôi được rồi, thấy cháu ưng ý như vậy thì bác để cho cháu một vạn hai nghìn tệ một tháng nhé!
Lương Giới: Ôi tuyệt quá, cháu cảm ơn bác nhiều lắm ạ! Cháu quyết định thuê nửa năm, thứ Hai tuần tới cháu đến ký hợp đồng được không ạ?
Bác Vương: Được chứ cháu! Khi đến ký hợp đồng, cháu nhớ mang theo hộ chiếu, tiền thuê tháng đầu và hai tháng tiền cọc nhé. Ký xong bác sẽ giao chìa khóa cho cháu dọn vào ở luôn.
Lương Giới: Dạ vâng, cháu cảm ơn bác Vương rất nhiều, hẹn gặp lại bác vào thứ Hai tuần tới ạ!""",

    "text_title": "找房子（課本短文）",
    "text_cn": """山本良介來臺灣以後，一直住在學校的宿舍，可是他下個學期不想住了。因為室友很晚才睡覺，總是在半夜開著燈打電腦，聲音很吵。除了生活習慣很不一樣，良介的室友還常常把房間弄得很髒，所以他決定到學校外面去租房子。
良介本來覺得找房子不難，沒想到不太順利。不是房租太貴，就是離學校太遠。幸好有朋友陳可欣的幫忙，帶他去看了幾處公寓，最後遇到了一位親切的房東王太太。
王太太看良介是個認真讀書的留學生，不但把房租算便宜了，還熱心地答應幫忙裝網路。良介很高興終於找到滿意的房子，下個星期就可以開心地搬家了。""",
    "text_vi": """Yamamoto Ryosuke từ khi đến Đài Loan vẫn luôn ở trong ký túc xá của trường, nhưng học kỳ tới cậu không muốn ở nữa. Bởi vì bạn cùng phòng ngủ rất muộn, nửa đêm vẫn hay bật đèn gõ máy tính, phát ra tiếng động rất ồn ào. Ngoài thói quen sinh hoạt khác nhau, bạn cùng phòng của Ryosuke còn hay bày bừa làm phòng rất bẩn, vì vậy cậu quyết định chuyển ra ngoài trường thuê nhà.
Ryosuke ban đầu nghĩ rằng việc tìm nhà không khó, ai ngờ lại chẳng mấy suôn sẻ. Không phải tiền thuê nhà quá đắt thì cũng là vị trí quá xa trường. May mắn có sự giúp đỡ của cô bạn Trần Khả Hân dẫn cậu đi xem vài căn hộ, cuối cùng đã gặp được bác chủ nhà tốt bụng tên là Vương Thái Thái.
Bác Vương thấy Ryosuke là một lưu học sinh chăm chỉ, ngoan ngoãn nên chẳng những giảm bớt tiền thuê nhà mà còn nhiệt tình hứa sẽ lắp mạng Internet giúp cậu. Ryosuke vô cùng vui mừng vì cuối cùng đã tìm được căn nhà ưng ý, sang tuần tới là có thể vui vẻ dọn sang nhà mới rồi."""
}

# ==============================================================================
# LESSON 94: 逛夜市真有趣
# ==============================================================================
LESSONS_B8["94"] = {
    "dialogue_title": "逛夜市真有趣（課本對話）",
    "dialogue_cn": """可欣：美心，妳平常不愛逛夜市，今天怎麼忽然想去啊？
美心：因為良介說，他跟朋友都想到夜市看看，請我給他們介紹介紹臺灣的小吃。
可欣：你們在哪裡見面呢？
美心：在捷運站2號出口，他們應該快到了。
良介：不好意思，你們等了很久了嗎？
美心：我們也剛到。良介，給我們介紹一下你的朋友吧。
良介：他是我的好朋友九十九龍介，這幾天到臺灣來旅行。
龍介：妳們好，我叫九十九龍介。
可欣：你好，我是陳可欣，良介的大學同學，這位是我的室友王美心。
美心：很高興認識你，你的姓真特別！
龍介：是啊，姓九十九的日本人很少。我一直想來夜市逛逛，今天請妳們帶我去吃好吃的臺灣小吃。
良介：沒問題，夜市就在前面。
龍介：我聽說臺灣的夜市很有意思，有各種小吃跟點心。
良介：買東西還可以殺價呢！
可欣：沒錯，有時候我在夜市買衣服，也會殺價。
良介：對了，等一下你會看到一些招牌上有英文、日文。
美心：就是希望外國遊客也看得懂。
良介：這裡有臭豆腐、炸雞排、蚵仔煎。
美心：這些小吃都很好吃，當然還有最有名的珍珠奶茶。
龍介：聽說這裡的珍珠奶茶喝起來又香又甜，可是我不習慣喝太甜的飲料。
良介：在臺灣，你可以請他們少放一點糖，或是選無糖、半糖的。
美心：也可以自己決定加多少冰塊。
龍介：太好了！妳們還推薦我們吃什麼？
美心：要是你們想吃特別的，我就推薦你們吃臭豆腐，加辣的更好吃。
良介：你們聞，這就是臭豆腐的味道，臭不臭？
龍介：這種味道我不討厭，其實我什麼小吃都想試試，特別是炸雞排，聽說又大又脆又好吃。
良介：我不敢吃臭豆腐，可是很想吃炸雞排。
美心：好，那麼我們先去買雞排，我再帶你們去喝非常好喝的香蕉牛奶！""",
    "dialogue_vi": """Khả Hân: Mỹ Tâm, bình thường cậu không thích đi dạo chợ đêm, sao hôm nay lại đột nhiên muốn đi thế?
Mỹ Tâm: Vì Lương Giới bảo cậu ấy và bạn đều muốn đi dạo chợ đêm, nhờ tớ dẫn đường giới thiệu các món ăn vặt Đài Loan cho họ.
Khả Hân: Các cậu hẹn gặp nhau ở đâu thế?
Mỹ Tâm: Ở lối ra số 2 ga tàu điện ngầm, chắc họ sắp đến nơi rồi đấy.
Lương Giới: Xin lỗi hai cậu nhé, hai cậu đợi bọn tớ có lâu không?
Mỹ Tâm: Bọn tớ cũng vừa mới đến thôi. Lương Giới, mau giới thiệu bạn của cậu cho bọn tớ làm quen đi nào.
Lương Giới: Đây là bạn thân của tớ, Tsukumo Ryosuke. Mấy hôm nay cậu ấy sang Đài Loan du lịch.
Tsukumo: Chào hai bạn, mình tên là Tsukumo Ryosuke.
Khả Hân: Chào bạn, mình là Trần Khả Hân, bạn đại học của Lương Giới, còn đây là bạn cùng phòng của mình, Vương Mỹ Tâm.
Mỹ Tâm: Rất vui được làm quen với bạn, họ của bạn nghe đặc biệt thật đấy!
Tsukumo: Đúng vậy, người Nhật mang họ Tsukumo rất hiếm. Mình vẫn luôn ao ước được đi dạo chợ đêm, hôm nay nhờ hai bạn dẫn mình đi thưởng thức những món ăn vặt thơm ngon của Đài Loan nhé.
Lương Giới: Không thành vấn đề, cổng chợ đêm ở ngay phía trước rồi.
Tsukumo: Mình nghe nói chợ đêm ở Đài Loan thú vị lắm, có đủ các loại món ăn vặt và đồ điểm tâm phong phú.
Lương Giới: Mua đồ ở đây còn có thể mặc cả trả giá nữa đấy!
Khả Hân: Chuẩn luôn, thỉnh thoảng tớ mua quần áo ở chợ đêm cũng hay mặc cả lắm.
Lương Giới: À đúng rồi, lát nữa cậu sẽ thấy trên nhiều biển hiệu có cả tiếng Anh lẫn tiếng Nhật đấy.
Mỹ Tâm: Đó là để các du khách nước ngoài cũng có thể dễ dàng đọc hiểu được.
Lương Giới: Ở đây có đậu phụ thối, gà rán khổng lồ, bánh hàu chiên trứng.
Mỹ Tâm: Mấy món ăn vặt này đều ngon tuyệt cú mèo, dĩ nhiên không thể thiếu món trà sữa trân châu trứ danh nữa.
Tsukumo: Nghe nói trà sữa trân châu ở đây uống vừa thơm vừa ngọt, nhưng mình lại không quen uống đồ ngọt quá.
Lương Giới: Ở Đài Loan, cậu hoàn toàn có thể nhờ họ bớt đường đi, hoặc chọn loại không đường, nửa đường.
Mỹ Tâm: Cậu cũng có thể tự chọn lượng đá cho vào cốc nữa.
Tsukumo: Tuyệt vời quá! Hai bạn còn gợi ý bọn mình nên nếm thử món gì nữa không?
Mỹ Tâm: Nếu các cậu muốn thử món gì độc lạ thì tớ đề xuất món đậu phụ thối nhé, thêm chút cay ăn càng cuốn hơn.
Lương Giới: Các cậu ngửi xem, đây chính là mùi đặc trưng của đậu phụ thối đấy, có thấy nồng không?
Tsukumo: Mùi này mình không thấy khó chịu đâu, thực ra món nào mình cũng muốn thử một chút, nhất là món gà rán khổng lồ, nghe bảo vừa to, vừa giòn, vừa thơm ngon.
Lương Giới: Tớ thì không dám ăn đậu phụ thối đâu, nhưng cực kỳ khoái món gà rán.
Mỹ Tâm: Được rồi, vậy trước hết chúng mình đi mua gà rán nhé, rồi tớ sẽ dẫn các cậu đi uống món sữa chuối ngon mê ly!""",

    "text_title": "台灣的夜市文化（課本短文）",
    "text_cn": """除了百貨公司，夜市也是臺灣人常去的地方。那裡有各種好吃的小吃、好喝的飲料和好玩的遊戲。一般的夜市，大概從晚上六點開始，到半夜才結束。很多臺灣人喜歡去夜市吃喝玩樂，所以夜市總是很熱鬧。到了週末晚上，更是擠得不得了。
在夜市裡，除了能品嚐到道地的傳統小吃，像蚵仔煎、炸雞排和珍珠奶茶，還能買到便宜又好看的衣服與生活用品。外國遊客來臺灣旅行，如果沒逛過夜市，就好像沒來過臺灣一樣。這樣的夜市文化，不僅豐富了臺灣人的夜生活，也展現了滿滿的人情味。""",
    "text_vi": """Bên cạnh các trung tâm thương mại lớn, chợ đêm cũng là điểm đến quen thuộc thường ngày của người dân Đài Loan. Nơi đây tập trung muôn vàn món ăn vặt thơm ngon, đồ uống hấp dẫn và các trò chơi giải trí thú vị. Các khu chợ đêm thông thường bắt đầu mở cửa từ khoảng sáu giờ tối và hoạt động nhộn nhịp tới tận nửa đêm. Rất nhiều người Đài Loan thích đến chợ đêm để tụ tập ăn uống, vui chơi giải trí, thế nên không khí chợ đêm lúc nào cũng tưng bừng náo nhiệt. Cứ mỗi độ cuối tuần, dòng người đổ về đây lại đông đúc chen chúc khôn xiết.
Tại chợ đêm, ngoài việc được thưởng thức những món ăn vặt truyền thống chuẩn vị như bánh hàu chiên trứng, gà rán giòn rụm và trà sữa trân châu, mọi người còn có thể mua sắm quần áo thời trang cùng đồ dùng thường ngày với mức giá vô cùng phải chăng. Khách du lịch quốc tế khi đến Đài Loan, nếu chưa từng dạo bước qua chợ đêm thì xem như chưa thực sự trải nghiệm trọn vẹn mảnh đất này. Nét văn hóa chợ đêm độc đáo ấy không chỉ làm phong phú đời sống về đêm của người dân bản xứ mà còn lan tỏa sự ấm áp, hiếu khách nồng hậu."""
}

# ==============================================================================
# LESSON 95: 歡迎到我家來玩
# ==============================================================================
LESSONS_B8["95"] = {
    "dialogue_title": "歡迎到我家來玩（課本對話）",
    "dialogue_cn": """大方：歡迎你們來！我就住在這個社區的A棟七樓。
良介：這個社區好大啊，比我住的地方大多了。
大方：這個社區又大又舒服，可是上個月有一輛汽車被小偷偷了。幸好警察來幫忙，很快就找到了。現在白天、晚上都有人負責社區的安全。
良介：社區安全真的很重要。對了，我在大門那邊看到一大片草地，你們會在那裡辦活動嗎？
大方：會啊！晴天的時候，我們會在那裡曬太陽、踢足球，有時候也會在那裡野餐、露營，好玩得不得了。
良介：真的嗎？我很喜歡露營，以後我也可以來這裡露營嗎？
大方：可以啊！上個週末我跟可欣就在那裡露營。晚上沒有雲的時候，躺在草地上聊天、看星星，感覺好輕鬆。我們聊著聊著就睡著了。
良介：我想住在這裏的人，早上看到陽光、聞到花的香味，再聽到幾隻鳥在唱歌，應該就不想去上班了吧！聽你這麼說，我也好想搬來這裡住。
大方：歡迎歡迎！這裡環境很好，還有兩座球場和游泳池。有一個校友也住在這個社區，我常跟他一起打網球呢。
良介：我也會打網球，可是打得不好。
大方：打得不好沒關係，只要有機會運動就好了。我平常下班回來，有時候去游泳，有時候去打球，所以身體越來越健康了。
良介：聊了這麼久，我肚子有點餓了。
大方：那今天我請客，請你們去附近的餐廳吃牛排！從這裡往前走，看到紅綠燈右轉就到了。
良介：太棒了，謝謝大方！""",
    "dialogue_vi": """Đại Phương: Chào mừng các bạn đến chơi! Mình ở ngay tầng bảy tòa nhà A trong khu đô thị này.
Lương Giới: Khu đô thị này rộng lớn thật đấy, rộng hơn nhiều so với chỗ tớ đang ở.
Đại Phương: Khu này vừa rộng rãi lại vừa tiện nghi thoải mái, cơ mà tháng trước có một chiếc xe hơi bị kẻ trộm lấy cắp mất. May nhờ có cảnh sát hỗ trợ nên tìm lại được xe rất nhanh. Bây giờ cả ngày lẫn đêm đều có bảo vệ túc trực lo an ninh cho khu dân cư.
Lương Giới: An ninh khu dân cư quả thật quan trọng lắm. À phải rồi, ở đằng cổng lớn tớ thấy có một bãi cỏ xanh mênh mông, mọi người có hay tổ chức hoạt động ở đó không?
Đại Phương: Có chứ! Vào những ngày trời nắng đẹp, bọn mình hay ra đó sưởi nắng, đá bóng, đôi khi còn tổ chức dã ngoại, cắm trại ở đó nữa, vui không tả xiết.
Lương Giới: Thật thế á? Tớ mê cắm trại lắm, sau này tớ cũng có thể sang đây cắm trại được không?
Đại Phương: Được chứ sao không! Cuối tuần trước mình với Khả Hân vừa cắm trại ở đó đấy. Buổi tối trời quang không một gợn mây, nằm ngả lưng trên thảm cỏ trò chuyện, ngắm bầu trời đầy sao, cảm giác thư thái vô cùng. Bọn mình nói chuyện rôm rả một hồi rồi thiếp đi lúc nào chẳng hay.
Lương Giới: Tớ nghĩ những ai sống ở đây, sáng sớm thức giấc đón ánh nắng chan hòa, hít hà hương hoa thơm ngát, lại nghe tiếng chim ríu rít ca vang, chắc chẳng còn tâm trạng đâu muốn đi làm nữa! Nghe cậu tả thế, tớ cũng muốn dọn sang đây ở ghê.
Đại Phương: Hoan nghênh luôn! Môi trường ở đây trong lành lắm, lại có hẳn hai sân bóng và bể bơi. Có một bạn cựu sinh viên cùng trường cũng ở khu này, mình hay rủ bạn ấy chơi quần vợt chung.
Lương Giới: Tớ cũng biết đánh quần vợt chút đỉnh, nhưng đánh không giỏi lắm.
Đại Phương: Đánh chưa giỏi cũng chẳng sao cả, cốt yếu là có cơ hội rèn luyện thể thao là tốt rồi. Thường ngày tan sở về, khi thì mình đi bơi, khi thì đi đánh bóng, nhờ thế mà sức khỏe ngày càng dẻo dai hơn.
Lương Giới: Trò chuyện nãy giờ, bụng tớ bắt đầu réo ầm ĩ rồi này.
Đại Phương: Vậy hôm nay để mình khao, mời các bạn ra nhà hàng gần đây ăn bít tết nhé! Cứ từ đây đi thẳng về phía trước, gặp cột đèn giao thông rẽ phải là tới nơi.
Lương Giới: Tuyệt vời quá, cảm ơn Đại Phương nhé!""",

    "text_title": "幸福社區（課本短文）",
    "text_cn": """林大方住的社區叫「幸福社區」，是一個環境優美、生活機能完善的大型社區。社區裡不但有現代化的高樓住宅，還有一大片綠油油的草地、兩座運動球場和乾淨的游泳池。每天早晨和傍晚，很多住戶都會在草地上散步、運動或遛狗。
為了維護住戶的安全，社區二十四小時都有熱心的警衛巡邏。週末的時候，鄰居們常聚在公共空間舉辦野餐、露營活動，小朋友在草地上奔跑踢球，大人們在一旁喝茶聊天，氣氛既溫馨又和睦。
大方覺得能住在這樣充滿活力與人情味的社區裡，每天下班回到家都能徹底放鬆身心，生活過得既充實又幸福。""",
    "text_vi": """Khu dân cư nơi Lâm Đại Phương sinh sống có tên là \"Khu Đô Thị Hạnh Phúc\", là một khu đô thị sinh thái kiểu mẫu với cảnh quan tươi đẹp và tiện ích đồng bộ. Nơi đây không chỉ có các tòa nhà chung cư hiện đại mà còn sở hữu một thảm cỏ xanh mướt trải dài, hai sân vận động thể thao và bể bơi bốn mùa sạch sẽ. Mỗi sớm mai và khi chiều tà buông xuống, đông đảo cư dân lại cùng nhau tản bộ, tập thể dục hoặc dắt thú cưng đi dạo.
Để bảo đảm an toàn cho các hộ gia đình, ban an ninh luôn bố trí đội ngũ bảo vệ tuần tra liên tục suốt hai mươi tư giờ. Cứ vào dịp cuối tuần, các gia đình hàng xóm láng giềng lại quây quần tổ chức các buổi dã ngoại, cắm trại ngoài trời; trẻ nhỏ tha hồ nô đùa đá bóng trên bãi cỏ, người lớn ngồi bên nhau thưởng trà chuyện trò rôm rả, bầu không khí vô cùng ấm cúng và chan hòa.
Đại Phương cảm thấy được an cư trong một môi trường sống tràn đầy năng lượng và tình nghĩa như thế này, mỗi ngày sau giờ làm việc trở về tổ ấm đều có thể rũ bỏ mọi mệt mỏi, tận hưởng cuộc sống trọn vẹn và an yên."""
}

# ==============================================================================
# LESSON 96: 我們去KTV唱歌吧！
# ==============================================================================
LESSONS_B8["96"] = {
    "dialogue_title": "我們去KTV唱歌吧（課本對話）",
    "dialogue_cn": """良介：下星期六是可欣的生日，我們要怎麼幫她慶祝呢？
美心：她最愛唱歌了，我們去KTV幫她過生日，好不好？
良介：太好了！我很想看看臺灣的KTV，聽說跟日本的有一點不同。
美心：我覺得設備都差不多，不過很多臺灣的KTV有提供吃到飽的自助餐。
良介：真的嗎？我沒聽說日本有吃到飽的KTV呢！不過我去KTV的目的不是吃東西，而是唱歌。
美心：我聽說日本人跟朋友去KTV的時候，每個人一次只能點一首歌，點好了唱完就換下一個人，是真的嗎？
良介：沒錯，大家都很有禮貌地輪流唱。臺灣不一樣嗎？
美心：我們臺灣人喜歡大家一起合唱，這樣比較熱鬧，唱破音或唱錯了也沒關係。
良介：有一次我們在KTV唱歌，隔壁包廂的人唱得好開心，又唱又跳，感覺地板都在震動呢！
美心：聽可欣說你很會唱歌，你可以教我唱幾首中文歌嗎？
良介：沒問題，我先教妳唱簡單好聽的抒情歌，妳一定很快就能學會。
美心：臺灣的KTV也有很多日文歌曲，妳也可以選幾首妳拿手的日文歌，在可欣生日那天唱給大家聽。
良介：可是我很容易緊張，要是唱不好怎麼辦？
美心：沒關係啦！我每次去KTV總是把自己當成大歌星，想像那是自己的個人演唱會，想唱什麼就唱什麼，自己開心最重要！
良介：我看過一個日本電視節目，在KTV唱歌時可以用點歌機給唱歌的人打分數，這樣就能知道自己唱得怎麼樣。
美心：聽起來好像在考試一樣，壓力好大啊！
良介：那種打分機器常常出錯，有時候我覺得唱得不差，分數卻很低。
美心：那我們去KTV那天，妳教我一些唱歌的技巧吧！
良介：太棒了，我一定好好練習。對了，我們要買什麼禮物送給可欣呢？
美心：我想到了，可欣一直很喜歡香水，我們送她一瓶精緻的香水吧！
良介：我還可以送她巧克力跟一大束紅玫瑰，九十九朵象徵長長久久。
美心：別忘了還要買一個美味的生日蛋糕跟幾罐飲料。
良介：太好了，那麼等可欣下課以後，我們就給她一個大大的驚喜！""",
    "dialogue_vi": """Lương Giới: Thứ Bảy tuần tới là sinh nhật của Khả Hân rồi, chúng mình tổ chức mừng sinh nhật cho cậu ấy thế nào đây?
Mỹ Tâm: Cậu ấy mê ca hát nhất trần đời, bọn mình rủ nhau đến quán KTV mừng sinh nhật cậu ấy nhé?
Lương Giới: Tuyệt quá! Tớ cũng rất muốn trải nghiệm xem KTV ở Đài Loan ra sao, nghe nói có vài điểm khác biệt so với bên Nhật.
Mỹ Tâm: Tớ thấy cơ sở vật chất phòng ốc thì cũng tương tự nhau thôi, có điều rất nhiều quán KTV ở Đài Loan có phục vụ tiệc buffet ăn thỏa thích đấy.
Lương Giới: Thật thế ư? Tớ chưa từng nghe bên Nhật có quán karaoke nào lại bao ăn buffet no nê như thế cả! Nhưng mà mục đích tớ đến quán karaoke là để hát chứ đâu phải để ăn.
Mỹ Tâm: Tớ nghe đồn người Nhật khi đi hát karaoke cùng bạn bè, mỗi người một lượt chỉ được bấm chọn đúng một bài hát, chọn xong hát hết bài mới chuyển lượt cho người tiếp theo, có đúng vậy không?
Lương Giới: Chuẩn luôn, mọi người đều rất lịch sự xếp hàng thay phiên nhau hát. Ở Đài Loan không thế à?
Mỹ Tâm: Người Đài Loan bọn tớ thì lại thích mọi người cùng nhau hòa giọng hát đồng ca, như thế mới rôm rả náo nhiệt, dẫu có hát lệch tông hay hát sai lời cũng chẳng sao hết.
Lương Giới: Có lần bọn tớ đi hát KTV, phòng bên cạnh hát hò vui vẻ đến nỗi vừa hát vừa nhảy nhót tưng bừng, cảm giác sàn nhà rung chuyển cả lên!
Mỹ Tâm: Nghe Khả Hân khen cậu hát hay lắm, cậu có thể dạy tớ hát vài bài nhạc Hoa được không?
Lương Giới: Sẵn sàng luôn, tớ sẽ chọn những bản tình ca giai điệu nhẹ nhàng, dễ hát để dạy cậu trước, đảm bảo cậu sẽ học thuộc rất nhanh.
Mỹ Tâm: KTV ở Đài Loan cũng cập nhật nhiều bài hát tiếng Nhật lắm đấy, cậu cũng có thể chọn vài ca khúc tủ tiếng Nhật để hôm sinh nhật Khả Hân trổ tài cho mọi người cùng thưởng thức.
Lương Giới: Nhưng đứng trước đám đông tớ hay run lắm, ngộ nhỡ hát dở thì ngại chết.
Mỹ Tâm: Có gì đâu mà lo! Mỗi lần bước vào phòng hát, tớ toàn tự xem mình là ca sĩ ngôi sao, tưởng tượng đây chính là liveshow hòa nhạc của riêng mình, thích bài nào là bung xõa bài đó, bản thân vui là chính!
Lương Giới: Tớ từng xem một chương trình truyền hình Nhật Bản, lúc hát karaoke có thể bật chế độ máy chấm điểm để biết giọng hát của mình chuẩn đến đâu.
Mỹ Tâm: Nghe cứ như đang đi thi cử ấy nhỉ, áp lực quá đi mất!
Lương Giới: Cái máy chấm điểm đó cũng hay chấm linh tinh lắm, lắm lúc tớ thấy mình thể hiện khá mượt mà điểm lại thấp lè tè.
Mỹ Tâm: Thế hôm đi hát, cậu nhớ chỉ cho tớ vài bí kíp luyện thanh nhé!
Lương Giới: Nhất trí luôn, tớ sẽ dốc sức chỉ dẫn. À mà chúng mình nên chọn món quà gì tặng Khả Hân đây?
Mỹ Tâm: Tớ nghĩ ra rồi, Khả Hân xưa nay rất chuộng nước hoa, bọn mình tặng cậu ấy một chai nước hoa thật tinh tế đi!
Lương Giới: Tớ sẽ mua thêm một hộp sôcôla cùng một bó hoa hồng đỏ rực rỡ chín mươi chín bông, tượng trưng cho tình bạn bền lâu mãi mãi.
Mỹ Tâm: Đừng quên đặt một chiếc bánh kem sinh nhật thật ngon cùng vài lon nước ngọt nữa nhé.
Lương Giới: Chốt thế nhé, đợi Khả Hân tan học xong, chúng mình sẽ dành cho cậu ấy một bất ngờ thật lớn!""",

    "text_title": "台灣的KTV（課本短文）",
    "text_cn": """在臺灣，去KTV唱歌是年輕人聯絡感情、放鬆心情最受歡迎的休閒活動之一。不管是慶祝朋友生日、期末考後聚會，還是公司下班後的聚餐，KTV都是大家的熱門選擇。
臺灣的KTV文化很有特色，包廂裡設備齊全，音響效果非常好，而且曲庫豐富，不僅有最新的華語流行歌曲，也有大量的日語、韓語和英語歌。更特別的是，許多大型KTV還設有熱食自助吧，提供各式各樣的美味餐點與冷熱飲品，讓大家一邊唱歌、一邊大快朵頤。
大家在包廂裡無拘無束地合唱、歡笑，不僅能抒發平時課業與工作的壓力，也能讓彼此的感情更加緊密。""",
    "text_vi": """Tại Đài Loan, đi hát KTV là một trong những hoạt động giải trí gắn kết bạn bè và xả stress được giới trẻ ưa chuộng hàng đầu. Bất kể là liên hoan sinh nhật, tiệc ăn mừng sau kỳ thi cam go hay buổi tụ họp liên hoan sau giờ làm, KTV luôn là sự lựa chọn ưu tiên của mọi người.
Văn hóa KTV ở Đài Loan mang những nét rất riêng biệt: phòng ốc được trang bị đầy đủ tiện nghi với dàn âm thanh ánh sáng đỉnh cao, kho bài hát khổng lồ không chỉ liên tục cập nhật những bản hit nhạc Hoa mới nhất mà còn có vô số ca khúc tiếng Nhật, tiếng Hàn và tiếng Anh. Điểm độc đáo hơn cả là nhiều trung tâm KTV quy mô lớn còn tích hợp quầy buffet ẩm thực phong phú, phục vụ đủ món ăn nóng hổi và đồ uống giải khát, giúp khách vừa thỏa sức ca hát vừa được thưởng thức đồ ăn ngon miệng.
Trong không gian riêng tư của phòng hát, mọi người cùng nhau cất cao tiếng hát, cười đùa sảng khoái, không chỉ giải tỏa mọi áp lực học hành, công việc mà còn thắt chặt thêm tình bạn thắm thiết."""
}

# ==============================================================================
# LESSON 97: 坐火車到花蓮去旅行
# ==============================================================================
LESSONS_B8["97"] = {
    "dialogue_title": "坐火車到花蓮去旅行（課本對話）",
    "dialogue_cn": """良介：還有一個星期就要放長假了，妳有什麼旅遊計劃嗎？
可欣：我打算到花蓮去旅行，好好欣賞一下臺灣東部壯麗的海岸風景。
良介：太巧了！前年我去花蓮玩，就住在當地朋友開的一家特色民宿裡。
可欣：真的嗎？那家民宿環境怎麼樣？
良介：老闆人非常熱情，不但請我品嚐當地的風味小吃，退房時還送給我好幾包名產跟美麗的風景明信片呢！
可欣：聽起來真棒！你可以幫我預訂那家民宿嗎？
良介：當然可以啊！他的民宿裡有游泳池，也有免費的高速無線網路。
可欣：最吸引人的是什麼呢？
良介：最棒的是，每天清晨拉開窗簾，從房間就能直接看見蔚藍美麗的大海，視野寬闊極了！
可欣：哇，太夢幻了！住一個晚上房價會不會很貴呀？
良介：別擔心，我會先打電話跟老闆打個招呼，說妳是我的同班同學，請他給妳算學生優惠價。
可欣：太感謝你了！對了，去花蓮搭什麼交通工具最合適呢？
良介：妳千萬別自己開車走蘇花公路，那條公路比較危險，尤其是遇到連續下大雨的時候，山上的大落石容易掉下來。
可欣：我也聽說過蘇花公路路況比較險峻，搭臺鐵火車去應該最安全舒適吧。
良介：沒錯，搭火車既安全又準時，不過假日的車票非常搶手，往往一開賣就被秒殺一空，妳最好現在就上網訂票。
可欣：我之前瀏覽過臺灣鐵路局的訂票網站，可是有些操作介面不太熟悉，你能教我怎麼訂票嗎？
良介：一點都不難，我現在就幫妳在電腦上操作訂票。妳打算哪一天出發？
可欣：我預計六月二十八號出發，搭太魯閣號火車票價會不會很貴？
良介：太魯閣號票價稍微高一點點，但是沿途停靠站很少，從臺北出發只要兩個多小時就能直達花蓮了。
可欣：貴一點完全沒關係！如果能訂到早上的第一班太魯閣號，中午抵達後就能直接去太魯閣國家公園健行爬山了！
良介：訂好了！妳把這組電腦代碼和訂票號碼記在手機裡，出發前去便利商店付款取票就可以了。
可欣：太好了，謝謝你幫了我這麼大一個忙！""",
    "dialogue_vi": """Lương Giới: Còn một tuần nữa là bước vào kỳ nghỉ dài rồi, cậu có kế hoạch đi du lịch ở đâu chưa?
Khả Hân: Tớ dự định đi du lịch Hoa Liên, để chiêm ngưỡng trọn vẹn cảnh sắc bờ biển tráng lệ vùng miền Đông Đài Loan.
Lương Giới: Trùng hợp quá! Năm kia tớ đi Hoa Liên chơi, từng nghỉ tại một homestay xinh xắn do người bạn bản địa mở.
Khả Hân: Thật thế ư? Homestay đó cảnh quan và dịch vụ thế nào hả cậu?
Lương Giới: Anh chủ nhà nhiệt tình hiếu khách vô cùng, chẳng những mời tớ thưởng thức các món ăn vặt đặc sản địa phương mà lúc trả phòng còn gửi tặng mấy gói quà lưu niệm cùng những tấm bưu thiếp phong cảnh tuyệt đẹp nữa!
Khả Hân: Nghe thích mê ly! Cậu có thể giúp tớ đặt phòng ở homestay đó được không?
Lương Giới: Đương nhiên là được chứ! Trong khuôn viên homestay có cả bể bơi và mạng wifi không dây tốc độ cao miễn phí.
Khả Hân: Điểm hấp dẫn nhất ở đó là gì thế cậu?
Lương Giới: Tuyệt đỉnh nhất là mỗi sớm mai kéo rèm cửa ra, ngay từ phòng ngủ là có thể phóng tầm mắt ngắm trọn đại dương xanh biếc bao la, tầm nhìn thoáng đãng vô cùng!
Khả Hân: Ôi, nghe nên thơ quá chừng! Giá phòng một đêm ở đó có đắt đỏ lắm không cậu?
Lương Giới: Cậu yên tâm đi, tớ sẽ gọi điện trước gửi lời chào anh chủ, bảo cậu là bạn cùng lớp của tớ để anh ấy tính giá ưu đãi cho sinh viên nhé.
Khả Hân: Cảm ơn cậu nhiều nhé! À mà đi Hoa Liên thì lựa chọn phương tiện di chuyển nào là thuận tiện nhất?
Lương Giới: Cậu tuyệt đối đừng tự lái xe đi đường cao tốc Tô Hoa nhé, cung đường đó tương đối nguy hiểm, nhất là vào những đợt mưa to kéo dài, đất đá trên núi rất dễ sạt lở lăn xuống.
Khả Hân: Tớ cũng từng nghe nói cung đường Tô Hoa hiểm trở lắm, đi tàu hỏa của Cục Đường sắt chắc là an toàn và dễ chịu nhất rồi.
Lương Giới: Chuẩn luôn, đi tàu hỏa vừa an toàn lại chuẩn giờ, nhưng vé tàu vào dịp nghỉ lễ thì đắt như tôm tươi, vừa mở bán là cháy vé trong chớp mắt, cậu nên lên mạng đặt vé ngay đi thôi.
Khả Hân: Hôm trước tớ có vào trang web đặt vé của Cục Đường sắt Đài Loan, nhưng giao diện vài chỗ tớ chưa thạo lắm, cậu chỉ tớ cách đặt với nhé?
Lương Giới: Dễ ợt mà, để tớ thao tác trên máy tính đặt giúp cậu luôn đây. Cậu định ngày nào khởi hành?
Khả Hân: Tớ tính ngày hai mươi tám tháng Sáu lên đường, vé tàu tốc hành Taroko có đắt lắm không cậu?
Lương Giới: Tàu Taroko giá có nhỉnh hơn một chút, nhưng trên đường rất ít ga dừng đỗ, xuất phát từ Đài Bắc chỉ mất hơn hai tiếng đồng hồ là tới thẳng Hoa Liên rồi.
Khả Hân: Giá cao hơn chút xíu chẳng sao cả! Nếu săn được chuyến tàu Taroko sớm nhất lúc bình minh thì trưa đến nơi là có thể đi thẳng tới Vườn Quốc gia Taroko leo núi ngắm cảnh được luôn!
Lương Giới: Đặt xong xuôi rồi này! Cậu lưu mã giữ chỗ này vào điện thoại nhé, trước ngày khởi hành chỉ cần ra bất kỳ cửa hàng tiện lợi nào thanh toán là lấy được vé ngay thôi.
Khả Hân: Tuyệt đỉnh quá, cảm ơn cậu đã giúp tớ một phen nhiệt tình thế này nhé!""",

    "text_title": "網路訂票（課本短文）",
    "text_cn": """臺灣的交通網絡非常發達，而搭乘火車環島旅行更是許多遊客的最愛。每逢連續假期或是觀光旺季，前往花蓮、臺東等熱門景點的火車票往往一位難求。
為了方便大眾購票，臺灣鐵路局提供了便利的網路訂票系統與手機應用程式。旅客只要提早在家上網查詢時刻表，輸入個人身分證或護照號碼，就能在幾分鐘之內輕鬆完成訂票與劃位。
訂票成功後，民眾除了可以在車站窗口取票，也可以直接到全臺遍布的便利商店付款領取實體車票，甚至使用手機電子車票直接刷碼感應進站，體驗快捷又環保的智慧出行。""",
    "text_vi": """Hệ thống giao thông của Đài Loan vô cùng phát triển, và những chuyến du lịch tàu hỏa vòng quanh hòn đảo luôn là sự lựa chọn yêu thích của đông đảo du khách. Cứ mỗi dịp nghỉ lễ dài ngày hoặc mùa cao điểm du lịch, những tấm vé tàu hướng về các danh lam thắng cảnh nổi tiếng như Hoa Liên, Đài Đông thường rơi vào tình trạng cháy vé.
Nhằm tạo điều kiện thuận lợi tối đa cho người dân mua vé, Cục Đường sắt Đài Loan đã triển khai hệ thống đặt vé trực tuyến trên website và ứng dụng di động thông minh. Hành khách chỉ cần ngồi tại nhà tra cứu bảng giờ tàu chạy, nhập số căn cước hoặc số hộ chiếu là có thể hoàn tất việc giữ chỗ và đặt vé chỉ trong vài phút ngắn ngủi.
Sau khi đặt chỗ thành công, hành khách có thể nhận vé tại quầy vé nhà ga, thanh toán lấy vé cứng tại hàng ngàn cửa hàng tiện lợi phủ sóng khắp cả nước, hoặc tiện lợi hơn nữa là quét mã vé điện tử trực tiếp trên điện thoại để qua cổng soát vé, tận hưởng hành trình di chuyển thông minh, thần tốc và thân thiện với môi trường."""
}

# ==============================================================================
# LESSON 98: 請給我貼紙，我要換史努比！
# ==============================================================================
LESSONS_B8["98"] = {
    "dialogue_title": "請給我貼紙，我要換史努比（課本對話）",
    "dialogue_cn": """良介：宜文，妳貼在豆漿盒子上的那張集點貼紙，可以送給我嗎？
宜文：你說的是剛才在便利商店買早餐時，店員找零錢順便給我的這張貼紙嗎？
良介：是啊！我收集的點數剛好只差最後一張，就能免費兌換一隻可愛的史努比玩偶了！
宜文：給妳吧！我剛剛只是覺得圖案挺可愛的，才隨手貼在盒子上。不過，為什麼店員無緣無故會送貼紙呢？
良介：這是便利商店最熱門的促銷活動呀！只要消費滿八十元，店員就會附贈一張集點貼紙。
宜文：要集滿多少張才能換禮物呢？
良介：集滿四十張貼紙，就可以免費兌換一隻正版聯名的史努比玩偶，完全不用多付一毛錢！
宜文：天啊，真的連一塊錢都不用加付，就能換到這麼精緻的玩偶嗎？
良介：當然是真的！妳下次進超商可以留意一下門口玻璃上貼的大海報，上面寫得很清楚。
宜文：這隻史努比造型這麼萌，我猜一定非常搶手，恐怕很快就會被大家換光了吧？
良介：沒錯，所以大家都在瘋狂收集。
宜文：超商為什麼要花這麼多成本舉辦這種集點活動呢？
良介：因為許多人都抗拒不了可愛精緻的小禮物，商家正是抓住了這種心理，陸續推出馬克杯、餐盤、雨傘和玩偶等實用商品。
宜文：上面印著超人氣卡通人物，大家看了心動，就會經常走進超商買東西。
良介：對呀！甚至有些人為了一口氣集滿點數，寧願多花錢買一堆平時用不到的零食飲料呢。
宜文：你分析得真透徹！本來只是商家吸引顧客的小技巧，沒想到演變成了臺灣獨特的超商文化。
良介：差不多全臺灣各大超商每季都會推出不同的集點活動，對帶動業績效果顯著。
宜文：聽起來真有趣！看來我以後買東西也要好好收集貼紙，這也是我在臺灣留學生活的美好紀念呢！
良介：沒錯！不過現在先把這張貼紙給我，我現在就要衝去門市換史努比囉！""",
    "dialogue_vi": """Lương Giới: Nghi Văn, tem tích điểm cậu dán trên vỏ hộp sữa đậu nành kia có thể cho tớ xin được không?
Nghi Văn: Cậu đang nói đến chiếc tem lúc nãy tớ mua đồ ăn sáng ở cửa hàng tiện lợi được nhân viên thối tiền đưa kèm cho đấy à?
Lương Giới: Chuẩn luôn! Số điểm tích lũy của tớ chỉ còn thiếu đúng một con tem cuối cùng này nữa thôi là đủ đổi miễn phí một chú gấu bông Snoopy đáng yêu rồi!
Nghi Văn: Cho cậu này! Nãy tớ chỉ thấy hình thù ngộ nghĩnh nên tiện tay dán lên vỏ hộp thôi. Cơ mà tại sao nhân viên lại tự dưng tặng tem cho khách thế nhỉ?
Lương Giới: Đây là chiến dịch khuyến mãi rầm rộ nhất của các chuỗi cửa hàng tiện lợi đấy! Cứ mua sắm hóa đơn đủ tám mươi tệ là nhân viên sẽ tặng kèm một con tem tích điểm.
Nghi Văn: Phải tích đủ bao nhiêu tem thì mới đổi được quà hả cậu?
Lương Giới: Tích đủ bốn mươi con tem là được đổi miễn phí một chú gấu bông Snoopy chính hãng, không phải bù thêm dù chỉ một xu!
Nghi Văn: Trời ơi, thật sự không cần chi thêm một đồng nào mà đổi được thú bông xinh xắn thế này cơ á?
Lương Giới: Thật trăm phần trăm chứ sao! Lần sau vào cửa hàng cậu cứ để ý tấm áp phích khổ lớn dán ngay cửa kính ra vào là thấy ghi rõ mồn một.
Nghi Văn: Chú chó Snoopy này tạo hình đáng yêu thế, tớ đoán chắc hot lắm, khéo chẳng mấy chốc mà người ta đổi sạch sành sanh cho xem?
Lương Giới: Đúng thế, bởi vậy ai nấy đều đang sốt sắng gom tem cho kịp.
Nghi Văn: Tại sao các cửa hàng tiện lợi lại chịu chi nhiều kinh phí để tổ chức những sự kiện tích điểm thế này nhỉ?
Lương Giới: Vì đa phần mọi người đều khó lòng cưỡng lại trước những món quà nhỏ nhắn dễ thương, các chủ doanh nghiệp nắm bắt trúng tâm lý đó nên liên tục tung ra các sản phẩm thiết thực như ly sứ, đĩa ăn, ô che mưa hay thú nhồi bông.
Nghi Văn: In hình các nhân vật hoạt hình nổi tiếng lên đồ dùng, khách hàng nhìn thấy thích mắt là lại thường xuyên lui tới mua sắm.
Lương Giới: Chuẩn luôn! Thậm chí có những người vì muốn nhanh gom đủ điểm số mà sẵn sàng vung tiền mua cả đống bánh kẹo nước ngọt ngày thường chẳng mấy khi dùng đến.
Nghi Văn: Cậu phân tích thấu đáo thật đấy! Ban đầu chỉ là chiêu thức câu khách của các nhà buôn, không ngờ nay đã phát triển thành một nét văn hóa cửa hàng tiện lợi rất riêng của Đài Loan.
Lương Giới: Hầu như khắp các chuỗi siêu thị tiện lợi ở Đài Loan mỗi mùa đều tung ra các đợt tích điểm khác nhau, kích cầu doanh số tăng trưởng rõ rệt.
Nghi Văn: Nghe thú vị quá đi! Xem chừng từ nay về sau tớ mua đồ cũng phải giữ tem cẩn thận mới được, đây cũng sẽ là một kỷ niệm đáng nhớ trong quãng đời du học tại Đài Loan của tớ!
Lương Giới: Chuẩn không cần chỉnh! Cơ mà giờ cậu cho tớ xin con tem này trước đã, tớ phải phi ngay ra tiệm rinh chú Snoopy về đây!""",

    "text_title": "便利商店的生活（課本短文）",
    "text_cn": """臺灣的便利商店密度位居世界前列，大街小巷隨處可見，早已深深融入了民眾的日常生活。在超商裡，顧客不僅能買到冷熱便當、新鮮麵包與各式飲品，還能享有代收水電瓦斯費、提款、寄送快遞包裹以及購票等多種全方位服務。
在眾多行銷策略中，超商的「集點換好禮」活動最具代表性。每當推出知名卡通人物或精緻生活用品的聯名集點，總能在社會上掀起一股收集熱潮。許多上班族和學生為了收集心儀的限量贈品，紛紛揪團消費、互相交換貼紙。
這項獨特的促銷活動，不僅成功帶動了門市的營業額，更讓走進便利商店成為一種充滿驚喜與樂趣的生活日常。""",
    "text_vi": """Mật độ phủ sóng của các chuỗi cửa hàng tiện lợi tại Đài Loan thuộc hàng cao nhất thế giới, ngõ lớn phố nhỏ đâu đâu cũng bắt gặp, từ lâu đã gắn bó mật thiết với nhịp sống đời thường của người dân. Bước vào cửa hàng tiện lợi, khách hàng không chỉ chọn mua được những phần cơm hộp nóng sốt, bánh mì tươi ngon cùng đủ loại đồ uống phong phú, mà còn được trải nghiệm dịch vụ tiện ích trọn gói như thanh toán hóa đơn điện nước, rút tiền ATM, gửi nhận bưu kiện chuyển phát nhanh và đặt mua vé xe tàu.
Trong muôn vàn chiến lược tiếp thị, phong trào \"Tích điểm đổi quà xinh\" là sự kiện mang tính biểu tượng nhất. Mỗi khi cửa hàng tung ra các bộ sưu tập quà tặng kết hợp cùng các nhân vật hoạt hình tên tuổi hay đồ gia dụng cao cấp, làn sóng săn quà lại bùng nổ mạnh mẽ trong cộng đồng. Rất nhiều bạn trẻ sinh viên và dân văn phòng rủ nhau lập nhóm mua hàng, trao đổi tem cho nhau để sớm sở hữu món quà giới hạn mong ước.
Chiến dịch tiếp thị sáng tạo này chẳng những thúc đẩy doanh thu bán hàng tăng vọt mà còn biến mỗi lần bước chân vào cửa hàng tiện lợi thành một niềm vui nho nhỏ đầy ắp bất ngờ mỗi ngày."""
}

print("Part 1 (Lessons 91-98) structured successfully.")
