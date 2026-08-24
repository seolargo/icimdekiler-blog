# Kod Duvarları

Korpustaki mühendislik paperlarından türetilmiş, kod yazarken uygulanabilir kurallar.
Her madde bir **kırılır** taşır: nerede geçerli değil. Kırılır alanı olmayan madde
kataloğa girmez — o duvar değil, etikettir.

`public/kod-duvarlari.json` ile bu dosya **eşit tutulacak**.
Bu dosya elle düzenlenmez: `npm run kod-duvar -- --md` ile üretilir.

Hepsini birden uygulama — **KOD-06** derinliği tehlikeye göre seçer.

| An | Ne zaman |
|---|---|
| **T** Başlarken | Kod yazmadan önce: problem sınıfı, ölçüt, kapsam, tehlike |
| **Y** Yazarken | Klavye başında verilen kararlar |
| **D** Dokunurken | Yabancı ya da mevcut koda müdahale |
| **B** Bitirmeden | Bitti demeden önce irdeleme ve doğrulama |
| **A** Arıza | Bir şey bozulduğunda: hata ayıklama, olay incelemesi |

## Başlarken

*Kod yazmadan önce: problem sınıfı, ölçüt, kapsam, tehlike*

### KOD-01 — Önce problem sınıfını teşhis et, sonra çözüm ara

"Bunu nasıl çözerim?" sorusunu bir kez erteleyip "bu hangi problem sınıfına ait?" diye sor. 100M kullanıcıya mesaj bir kuyruk ürünü seçimi değil kuyruk kuramı problemidir; iki servisin aynı veriyi yazması bir veritabanı seçimi değil dağıtık tutarlılık problemidir; aynı olayın tekrar gelince bozması idempotentlik problemidir. Fark çözümün niteliğinde değil, tek hamlede erişilen bilgi hacmindedir.

**Kırılır:** Problem gerçekten yerel ve tekilse — bir yazım hatası, bir eksik alan, bir kopyala-yapıştır kusuru. Orada sınıf araması saf gecikmedir.

**Neden:** Bir problemi uygun biçimselleştirmeye taşımak, o alanın teoremlerini, algoritmalarını ve en önemlisi imkânsızlık sonuçlarını tek hamlede probleme bağlar.

*Kaynak: BELGE-176*

### KOD-02 — Birleştirme yapan her işlemde yasaları kontrol et

Bir şeyi parça parça hesaplayıp birleştirecekseniz beş yasayı tek tek yoklayın: birleşme (assoc → paralelleştirilebilir), değişme (comm → sıra önemsiz), birim (identity → boş durum tanımlı), ters (inverse → geri alınabilir), etkisizlik (idempotent → tekrar zararsız). Yasa sağlanmıyorsa hesabı değil TAŞINAN TEMSİLİ değiştirin: ortalama yerine (sum, count), p95 yerine t-digest özeti, son yazan kazansın yerine (timestamp, value), distinct count yerine HyperLogLog.

**Kırılır:** Cebirsel yapı hiç yoksa — iş gelip bekliyorsa, çıktı girdiyi etkiliyorsa, geçmiş önemliyse. Yasa kontrolünün boş çıkması da bilgidir: cebirsel çerçeveyi zorlama, dinamik çerçeveye geç (kuyruk kuramı, kontrol kuramı, Markov).

**Neden:** Temsil değişimi paralel çalışmayı, artımlı güncellemeyi ve yeniden deneme güvenliğini bir arada kazandırır. İki makinenin ortalamalarını eşit ağırlıkla toplamak (30+50)/2=40 verir; gerçek cevap 50'dir.

*Kaynak: BELGE-176*

### KOD-03 — Seçtiğin çerçevenin neyi YASAKLADIĞINI yaz

Bir yapıyı teşhis ettikten sonra en yüksek getirili soru şudur: bu dil bana neyi yasaklıyor? Medyan monoid değildir, o sorgu paralelleşmez. Doluluk 1'e giderken bekleme sınırsız büyür, o gecikme kod eniyilemesiyle çözülmez. CAP gereği bölünme anında tutarlılık ve erişilebilirlik aynı anda sağlanamaz.

**Kırılır:** Problem küçük ve tek makinede kalıyorsa — imkânsızlık sonuçlarının çoğu ölçek veya dağıtıklık varsayar.

**Neden:** Bir biçimselleştirmenin asıl kazancı pozitif bir çözüm değil, arama uzayının kapatılmasıdır. Yanlış yola hiç girmemek, doğru yolu bulmaktan daha çok zaman kazandırır.

*Kaynak: BELGE-176*

### KOD-04 — Başarı ölçütünü üretimden önce ve dışarıdan yaz

Hedefi, ulaşılıp ulaşılmadığı makinece denetlenebilecek biçimde önceden yaz; şu an ulaşılmadığını doğrula; en küçük adımla ulaş; hedef bozulmadan içeriyi düzenle. Kritik nitelik "dışarıdan"dır — ölçüt üretim başladıktan sonra yazılırsa üretilen şeye göre biçimlenir ve kendini onaylar.

**Kırılır:** Keşif fazında. Alan bilinmezken ölçüt erken donar. Orada doğru yol spike-and-stabilize'dir: keşif kodunu yaz, çalıştır, öğren ve AT; sonra öğrenilen şekille ölçüt koy.

**Neden:** Ölçütlü sistemde çıktı kalitesi prosedürün kalitesine bağlanır ve ölçeklenir; ölçütsüzde kişinin kalitesine bağlıdır ve ölçeklenmez. Bedeli de vardır: ölçüte sığmayan her şey kaybolur (Goodhart).

*Kaynak: BELGE-153*

### KOD-05 — Spec'e sistemin YAPMAMASI gerekeni de yaz

Nitelikli bir tanım şunları kapsar: amaç, kullanıcı senaryoları, kabul kriterleri, girdi/çıktı yapıları, arayüz sözleşmesi, yükleme durumu, hata durumu, boş durum, yetki kuralları, sınır durumları ve sistemin yapmaması gereken davranışlar. Zincir nettir: spec maddesi → kabul kriteri → test senaryosu → gerçekleştirim doğrulaması.

**Kırılır:** Spec üretim sürecinin dışında duran bir rapora dönüştüğünde. Ayırt edici ölçüt budur: içeride işleyen kontrat mı, dışarıda duran doküman mı? Birincisi kaldıraç, ikincisi yüktür.

**Neden:** Yapay zekâ kodu hızlı yazabilir; sistemin davranış geometrisini insan tarif etmelidir. Geometri net değilse kod yazmak yalnızca belirsizliği hızlandırır.

*Kaynak: BELGE-046*

### KOD-06 — İnceleme derinliğini tehlikeye göre seç — bu kataloğu her değişiklikte açma

Tehlike = f(geri alınabilirlik, etki yarıçapı, maruziyet). Düşük tehlikede yalnızca çekirdek üç-dört madde. Orta tehlikede tam liste artı yazılı varsayım listesi. Yüksek tehlikede tam liste artı bağımsız ikinci geçiş artı çalıştırılabilir doğrulama. Geri alınamaz işlemleri ayrıştır — veri silme, para transferi, dışarıya bildirim, fiziksel etki — ve ağır süreci yalnızca o kümeye uygula.

**Kırılır:** Bir eksen bağlama göre katman değiştirebilir: kütüphane API'sinde "insan faktörü" (yanlış kullanımı kolaylık) kritik katmana çıkar.

**Neden:** Elli maddelik listeyi her değişiklikte uygulamak sürdürülemez; sonuçta ya inceleme yapılmaz ya mekanik yapılıp değersizleşir. Havacılık ve tıptaki süreç ağırlığı hatanın geri alınamazlığından türer; yazılığın büyük bölümünde hata geri alınabilir.

*Kaynak: BELGE-169, BELGE-148*

### KOD-07 — Bir soruşturmada ilk yazılan şey hipotez değil kapsamdır

Neyi sisteme dahil ettiğin alacağın cevabı önceden belirler. "Servis yavaş" teşhisi: sınırı sürece çizersen kod optimizasyonuna, veritabanını dahil edersen indeks eksikliğine, ağı dahil edersen DNS çözümleme gecikmesine, istemciyi dahil edersen agresif retry davranışına çıkar. Aynı gözlem, farklı sınırlarla farklı sistemlerin gözlemi hâline gelir.

**Kırılır:** Sistem yakın ayrıştırılabilirliğini yitirmişse — global değişebilir durum, gizli zamansal bağlantı, paylaşılan veritabanı tabloları varsa sınır çizmek işe yaramaz; anlamanın zorluğu tam olarak bu bozulmanın ölçüsüdür.

**Neden:** Sınırın dışında bıraktığın her şey ölçümlerinde açıklanamayan varyans olarak geri döner. Sınır kararı hangi varyansın açıklanacağını belirler.

*Kaynak: BELGE-166*

## Yazarken

*Klavye başında verilen kararlar*

### KOD-08 — Oku ile yaz arasında durum değişebilir

Bir değeri okuyup koşul kontrolünden geçirip sonra ona dayanarak yazan her kod yolunda, okuma ile yazma arasında o değerin değişebileceğini varsay. Bakiye 100 iken eşzamanlı iki istek 80'er birim talep ederse ikisi de bakiyeyi 100 okur ve ikisi de koşuldan geçer.

**Kırılır:** İşlem tek atomik ifadeyle yapılıyorsa — veritabanının kendi koşullu güncellemesi, karşılaştır-ve-değiştir, ya da tek bir kilit altındaki blok. Orada okuma ile yazma arasında aralık yoktur.

**Neden:** Kontrollü test ortamında sorunsuz çalışan sistem, gerçek eşzamanlılık altında farklı davranır. Bu kusur okumakla görünmez; varsayımı yazıya dökmekle görünür.

*Kaynak: BELGE-174*

### KOD-09 — Ardışık iki yan etkili çağrı yarım kalabilir

Birbiri ardına yapılan iki yan etkili çağrıda, birincisi başarılı ikincisi başarısız olduğunda sistemin hangi durumda kalacağını yaz. Tutar gönderenden düşer, alıcıya ulaşmaz. Kullanıcıya "başarılı" yanıtı döndüğünde tam olarak hangi garanti verilmiş oluyor: düşüldü mü, ulaştı mı, ikisi tek transaction içinde mi?

**Kırılır:** İkinci adımın telafi edilebilir bir geri alma yolu varsa ya da yeniden denemesi zararsızsa. O zaman yarım kalma geçici bir durumdur, kalıcı bir tutarsızlık değil.

**Neden:** "Transfer" teriminin operasyonel tanımı yazılmadığında, kodun verdiği garanti ile kullanıcının anladığı garanti ayrışır ve fark ancak arıza anında görünür.

*Kaynak: BELGE-174*

### KOD-10 — Dış servise yazan çağrıda yanıt gelmemesi başarısızlık demek değildir

Dışarıya yazan bir çağrı yanıt alınmadan koparsa, karşı sistem işlemi tamamlamış olabilir ama çağıran bunu bilmez. Yeniden gönderim çift kayıt üretir. Çözüm bir idempotency anahtarıdır.

**Kırılır:** İşlem doğası gereği idempotentse — aynı değeri set etmek, aynı satırı aynı içerikle üzerine yazmak. Ama dikkat: kuruluşta idempotent olan olay tipi altı ay sonra yeni bir alan eklendiğinde idempotent olmaktan çıkar ve varsayım hâlâ koddadır.

**Neden:** En sık ve en sessiz veri bozulması sınıfı budur; hata değil fazladan doğru görünen kayıt üretir.

*Kaynak: BELGE-174, BELGE-176*

### KOD-11 — Gösterge niyeti değil gerçekleşen durumu bildirmeli

Bir kuyruğa yazmanın başarılı dönmesi mesajın işlendiğini, dağıtım aracının başarı bildirmesi yeni sürümün çalıştığını, yapılandırma değişikliğinin uygulanması hedef davranışın oluştuğunu göstermez. Arzulanan durum ile gözlemlenen durumu ayrı büyüklükler olarak taşı ve ikisi arasındaki farkı birinci sınıf bir gösterge say.

**Kırılır:** Komut ile durum arasında fiilen aralık yoksa — senkron, tek süreç içi, dönüş değeri sonucun kendisi olan çağrılarda ayrı gösterge gereksiz karmaşıklıktır.

**Neden:** Three Mile Island'da kontrol odasındaki gösterge vananın durumunu değil kendisine gönderilen komutu yansıtıyordu; operatörler saatlerce kapalı sandıkları bir vanadan soğutucu kaybetti. Fark normal işleyişte görünmez, arıza anında belirleyicidir — çünkü arıza tam olarak komutun gerçekleşmediği durumdur.

*Kaynak: BELGE-148*

### KOD-12 — Birimi, para birimini, zaman dilimini sayının içinde taşı

Çıplak bir sayı taşıdığı varsayımı taşımaz. Birim, para birimi, zaman dilimi ve koordinat sistemi değerin yanında değil içinde bulunmalıdır. Aynı ilke servis arayüzleri için de geçerlidir: sözleşmenin belgelenmiş olması yetmez, çalışma zamanında doğrulanabilir olması gerekir.

**Kırılır:** Değer tek bir dar bağlamdan hiç çıkmıyorsa ve o bağlamın birimi tipte zaten sabitse. Sınırı geçen her değer için geçerlidir.

**Neden:** Mars Climate Orbiter'da her iki bileşen de kendi içinde doğru çalışıyordu; hata hiçbir bileşenin içinde değil, aralarındaki sözleşmenin belirsizliğindeydi.

*Kaynak: BELGE-148*

### KOD-13 — Her dış çağrı için üç soruyu birden sor

Zaman aşımına uğrarsa ne olur? Yanlış cevap dönerse ne olur? YAVAŞ AMA BAŞARILI olursa ne olur? Üçüncüsü en çok atlanan ve en pahalı olandır: yavaşlama retry üretir, retry yükü artırır, yük yavaşlamayı artırır.

**Kırılır:** Çağrı gerçekten dışsal değilse — aynı süreç içinde, ağ geçmeyen, kendi kodun. Orada üçlü soru gürültüdür.

**Neden:** Yazılım sistemleri düz nedensel zincirler değil döngüler içerir; pozitif geri besleme küçük bir gecikmeyi tam kesintiye çevirir.

*Kaynak: BELGE-166*

### KOD-14 — Yasaklama yerine olanaksızlaştırma

Yanlış davranış belgede yasaklanmışsa kural zayıftır; sistemde ifade edilemiyorsa güçlüdür. Tehlikeli durumu temsil edemeyen tipler, geri alınamaz komutu engelleyen ara katmanlar, elle atlanamayan dağıtım kapıları, ayrıcalıklı işlem için ikinci onay.

**Kırılır:** Kısıt tipe ya da kapıya indirilemiyorsa. "Müşteri bu ekranı 2019'daki bir şikâyet üzerine istedi" bilgisi bir teste dönüştürülemez, yalnızca bir karar kaydında saklanabilir.

**Neden:** Yapılamayan bir şeyin neden yapılmaması gerektiğinin hatırlanması gerekmez. Gerekçe taşıma sorununu ortadan kaldırmaz ama etkisiz kılar.

*Kaynak: BELGE-148*

### KOD-15 — Kapasite aşıldığında ne olacağı da tasarım konusudur

Yük atma, öncelikli kuyruklama ve kademeli işlev kaybını önceden tanımla. Bu tasarımın yokluğunda sistem aşırı yük altında rastgele bir bileşenden — genellikle en kritik olanından — kopar.

**Kırılır:** Yükün üst sınırı yapısal olarak sabitse ve kapasitenin altındaysa. Kullanıcıya açık her yüzeyde bu varsayım kırılgandır.

**Neden:** Apollo 11'in bilgisayarı aşırı yüklendiğinde çökmedi, öncelik sırasına göre düşük öncelikli görevleri düşürdü. Aşırı yük altındaki davranış bir arıza değil bir tasarım kararıydı.

*Kaynak: BELGE-148*

### KOD-16 — Yorum gerekçe taşır; gerekçeyi engellediği somut başarısızlık olarak yaz

Kodun ne yaptığını kodun kendisi söyler. Yorumun tek meşru işlevi koddan okunamayan gerekçeyi taşımaktır ve gerekçe kuralla AYNI YERDE durmalıdır. Genel ilke zayıftır, somut başarısızlık güçlüdür: "Domain katmanı kalıcılıktan habersiz olmalıdır" bir buyruktur; "şema değiştiğinde domain katmanının değişmemesi için" ise kuralın koruduğu şeyi adlandırdığı için hangi koşulda gevşetilebileceğini de söyler.

**Kırılır:** Kod zaten gerekçeyi taşıyorsa — iyi adlandırılmış bir fonksiyon çağrısı, kısıtı ifade eden bir tip. Orada yorum tekrardır ve tekrar eden yorum kod değişince yanlış bilgiye dönüşür.

**Neden:** Gerekçesi aktarılmamış kural, uygulayıcı için maliyeti görünür / faydası görünmez bir yüktür; terk edilmesi disiplinsizlik değil rasyonel karardır.

*Kaynak: BELGE-184, BELGE-148*

### KOD-17 — Yedeklilik sayıyla değil paylaşılan bağımlılıkla ölçülür

Farklı bölgelerde çalışan iki kopya aynı yapılandırma kaynağına bağlıysa yedekli değildir. İkinci kural: kurtarma yolu kurtarılacak sistemden bağımsız olmalıdır — erişim, kimlik doğrulama ve iletişim kanallarının arızalı sistemin üzerinden geçmesi en sık ve en pahalı yapısal kusurdur.

**Kırılır:** Ortak arıza kipinin maliyeti kabul edilmişse ve bu kabul tarihiyle kaydedilmişse. Sessizce kabul edilmişse kırılmaz.

**Neden:** Fukushima'da yedek jeneratörlerin tümü aynı fiziksel tehdide — su basmasına — açıktı. Yedeklilik sayısal olarak vardı, işlevsel olarak yoktu.

*Kaynak: BELGE-148*

### KOD-18 — Aynı veriyi ikinci bir yerde tutma

Aynı bilginin state.summary, state.current.summary ve recordDetail.summary olarak üç yerde durması tek bir soru üretir: gerçek kaynak hangisi? Bu soru cevapsızsa hem insan hem model yanlış alanı günceller — hatayı çözdüğünü sanırken kullanılmayan bir alanı düzeltir.

**Kırılır:** İkinci kopya kasıtlı bir önbellekse ve geçersizleştirme yolu yazılıysa. Kasıtsız her kopya doğruluk kaynağı belirsizliğidir.

**Neden:** Model olasılık tabanlı örüntü tamamlama ile üretir; sistemdeki varyasyon arttıkça olası doğru yolların sayısı artar ve isabet oranı düşer. Tekil doğruluk kaynağı yapay zekâ destekli geliştirmede daha da kritiktir.

*Kaynak: BELGE-040, BELGE-038*

### KOD-19 — Hata ürettiğinde nedeni sonradan bulunabilsin

Bir işlem başarısız olduğunda geriye şunlar kalmalı: işlem kimliği, hangi hesap/kaynak, hangi servis, kaçıncı deneme, hangi sürüm. Aksi hâlde sistem hata üretmiş ama o hatanın tanısal değerini yitirmiştir. Üç kanal ayrı soruya cevap verir: metrik "bozuldu mu", iz "nerede", günlük "neden".

**Kırılır:** Hata zaten çağıranın elinde tam bağlamla dönüyorsa ve kaybolmuyorsa. Sınırı geçen ve asenkron olan her hata için geçerlidir.

**Neden:** Gözlenebilirlik sonradan eklenen bir özellik değil tasarım kararıdır; iç durumunu dışarı yansıtmayan bileşen kontrol teorisi anlamında gözlenemezdir ve gözlenemeyen sistem güvenilir biçimde kontrol edilemez.

*Kaynak: BELGE-174, BELGE-166*

### KOD-20 — Yaslandığın yasayı özellik testine kodla

Bir tasarım bir cebirsel varsayıma yaslanıyorsa o varsayımı üç satırla canlı tut: merge(merge(a,b),c) == merge(a,merge(b,c)); merge(a, birim) == a; merge(a,a) == a. Yeni bir tür eklendiğinde test kırılır ve sessiz bozulma önlenir.

**Kırılır:** Varsayım tipte zaten ifade edilmişse ve tip sistemi onu ihlal edilemez kılıyorsa.

**Neden:** Kuruluş anında geçerli olan eşleme sistem evrildikçe geçerliliğini yitirir ve bu yitim gözlemlenmez: "olaylar idempotent" varsayımı altı ay sonra yeni olay tipiyle geçersizleşir, varsayım hâlâ kodda durur, sistem sessizce hatalı sonuç üretir.

*Kaynak: BELGE-176*

## Dokunurken

*Yabancı ya da mevcut koda müdahale*

### KOD-21 — Gerekçesi bulunamayan kontrolü silme

Gerekçesi bulunamayan bir kontrol, gereksiz olduğu kanıtlanmış bir kontrol değildir; yalnızca gerekçesi bulunamamış bir kontroldür. Silmek yerine ilgili noktaya bir kayıt satırı koy ve iki gün bekle: hiç tetiklenmiyorsa silme kararı için dayanak oluşur, tetikleniyorsa kaybolmuş gerekçe bulunmuş olur.

**Kırılır:** Kontrolün koruduğu koşulun artık var olamayacağı yapısal olarak gösterilebiliyorsa — ilgili alan tipten kaldırılmış, ilgili dış sistem kapanmışsa.

**Neden:** Therac-25'te önceki modeldeki donanımsal kilitler "yazılım kendini kanıtladı" gerekçesiyle kaldırıldı. Kilidin var olma nedeni yazılım hatasının fiziksel düzeyde durdurulabilmesiydi; bu neden aktarılmadığı için kilit işlevsiz bir maliyet kalemi sayıldı. İşlevi tanımı gereği görünmez olan koruma, gerekçesi kayıtlı değilse ilk sadeleştirmede kaldırılır.

*Kaynak: BELGE-184, BELGE-148*

### KOD-22 — Anlamadığın kodu değiştirmeden önce davranışını dondur

Doğru olduğunu düşündüğün davranışı değil, FİİLEN GERÇEKLEŞEN davranışı test et; çıktı hatalı görünse bile test o çıktıyı beklesin. Kaba olabilir: fonksiyonun gerçek girdilerle ürettiği çıktıyı bir dosyaya kaydet ve testi o dosyayla karşılaştır. Birkaç saatte kurulur, en sık kırılan bölgeyi kapatır.

**Kırılır:** Mevcut davranış hatalıysa bu yöntem hatayı da korur — değişmezliği garanti eder, doğruluğu değil. Bilinen bir hatayı düzeltiyorsan önce hatayı teste çevir, sonra davranışı değiştir.

**Neden:** Kaybolan gerekçe bir noktada bir davranışa dönüşmüştür. O davranış test altına alındığında gerekçe bilinmese de ihlal sinyal üretir. Bilgi geri kazanılmaz; ihlal tespit edilebilir hâle getirilir ve pratik koruma açısından ikisi denktir.

*Kaynak: BELGE-184*

### KOD-23 — Derleyicinin göremediği beş bağı düz metin araması ile çıkar

Bir birimi değiştirmeden önce çağrı noktalarını bul. Derleyicinin yakaladıkları kolay kısımdır; asıl risk şurada: yansıma ve dinamik çağrı; yapılandırma dosyasından okunan sınıf veya alan adları; metin olarak yazılmış veritabanı sorguları, kolon ve tablo adları; olay ve mesaj adları, kuyruk anahtarları; dış sistemlerin beklediği alan adları ve biçimler. İlgili adları kod tabanında düz metin olarak aramak zorunlu adımdır.

**Kırılır:** Değiştirilen isim gerçekten dosya-yerel ve dışa açılmıyorsa (private, modül dışına çıkmayan). Dışa çıkan her ad için geçerlidir.

**Neden:** Bu beş kategorinin ortak özelliği hiçbirinde aracın uyarı vermemesidir; bağlamı olmayan kişinin en sık arıza ürettiği yerlerdir.

*Kaynak: BELGE-184*

### KOD-24 — Değiştirmek yerine ekle, bir süre paralel çalıştır

Anlaşılmayan bir yolun yerine yenisini koymak yerine yeni yolu mevcut olanın yanına ekle ve eski yolu yerinde bırak. İki yolu bir süre birlikte çalıştır, çıktıları karşılaştır, uyum doğrulandıktan sonra eskiyi kaldır. Tek seferde değiştirmeye göre belirgin biçimde yavaştır; buna karşılık her aşamasında geri dönülebilirdir.

**Kırılır:** Yan etkili işlemlerde doğrudan uygulanamaz — iki yolun ikisi de yazıyorsa çift kayıt üretir; orada ek düzenek (gölge yazma, kuru çalıştırma) gerekir.

**Neden:** Gerekçesi bilinmeyen bir sistemde geri dönebilme, hızlı ilerlemeden değerlidir.

*Kaynak: BELGE-184, BELGE-040*

### KOD-25 — Testleri spesifikasyon olarak oku; tuhaf olanlar en çok bilgi taşır

Var olan testler, kaybolmuş gerekçenin yazıya geçmiş tek parçasıdır. Genel testler az bilgi taşır; asıl bilgi tuhaf, spesifik ve sabit sayı içeren testlerdedir. "Şu alan boşken şu hata kodu dönmeli" biçiminde bir test, bir zamanlar bu durumun yaşandığının kanıtıdır. Yeni bir modüle girerken önce testleri okumak, kodu okumaktan daha hızlı bağlam sağlar.

**Kırılır:** Test süiti kodun yapısından türetilmişse (yoğun taklit, çağrı sırası doğrulaması) spesifikasyon değil kodun tekrarıdır ve hiçbir bilgi taşımaz.

**Neden:** Aynı mantık depodaki tarihsel ize de uzanır: tuhaf görünen tek satırlık düzeltmeler — bir koşul, bir bekleme çağrısı, bir özel durum kontrolü — neredeyse her zaman yaşanmış bir üretim arızasının izidir. git log -S ve git blame o izi verir.

*Kaynak: BELGE-184*

### KOD-26 — Yeniden kullandığın bileşen doğrulama zarfını kendisiyle taşımaz

Bir bileşenin doğruluğu mutlak değil, üretildiği varsayımlar kümesine görelidir. Bir kütüphane belirli bir yük profili, belirli bir veri dağılımı ve belirli bir hata modeli varsayarak yazılmıştır; bu varsayımların hiçbiri sürüm numarasında görünmez. Bağımlılığın hangi zarfta doğrulandığını sor ve kendi kullanım profilinle karşılaştır.

**Kırılır:** Kendi kullanım profilin zarfın içinde kalıyorsa ve bu yazılıysa. Sözlü olarak "bizde sorun çıkarmadı" zarf kanıtı değildir.

**Neden:** Ariane 5'te önceki nesilden devralınan atalet referans yazılımı yeni aracın farklı uçuş profilinde taşma üretti. Bileşen kendi doğrulama zarfı içinde kusursuzdu; kusurlu olan o zarfın dışında yeniden kullanılmasıydı. Ek ders: kalkıştan sonra hiçbir işlevi olmayan kodun sistemde bırakılması nötr bir karar değildir.

*Kaynak: BELGE-148*

### KOD-27 — Kullanımdan kalkmış bayrağı ya da alan adını yeniden kullanma

Emekliye ayrılmış bir bayrak, alan adı, kolon ya da mesaj tipi yeni bir anlamla yeniden kullanılamaz. Eski kod bir yerde hâlâ ayakta olabilir ve aynı adı eski anlamıyla okur.

**Kırılır:** Eski anlamı okuyan hiçbir çalışan örneğin kalmadığı KANITLANABİLİYORSA — tüm istemciler zorunlu güncellemeden geçmiş, tüm kuyruklar boşalmışsa.

**Neden:** Knight Capital'de dağıtım sekiz sunucunun yedisinde tamamlandı; yeni kod yıllar önce kullanımdan kalkmış bir işlevin bayrağını yeniden kullanıyordu ve güncellenmeyen sunucuda aynı bayrak eski davranışı tetikledi. Kısmi dağıtım ile bayrak yeniden kullanımının birleşimi kırk beş dakikada şirketi iflasa götürdü.

*Kaynak: BELGE-148*

### KOD-28 — Bağlam yokken hedef güvenli olmak değil, yanlışı saatler içinde fark etmektir

Bağlam yokken her değişikliği güvenli hâle getirmek mümkün değildir. Hedefi değiştir: küçük ve tek amaçlı değişiklikler, sık ve geri alınabilir konuşlandırma, değişen yola konmuş kayıt satırları, değişimden sonraki ilk gün ölçütlerin izlenmesi. Kaybolan bilginin telafisi doğru tahmin etmek değil, yanlış tahminin ucuz olmasıdır.

**Kırılır:** İşlem geri alınamazsa — veri silme, para transferi, dışarıya bildirim, fiziksel etki. Orada ucuz yanılma diye bir şey yoktur; KOD-06'nın ağır süreci uygulanır.

**Neden:** Devir teslimin yapılmadığı bir ortamda kaybolan bilgiyi geri kazanmak çoğu durumda mümkün değildir; ihtiyaç duyulan şey bilinmeyen kısıtı öğrenmek değil, çiğnendiğinde bunu üretim ortamından önce ya da hemen sonra duymaktır.

*Kaynak: BELGE-184*

### KOD-29 — Modelin "ne yapıyor" açıklaması iddiadır, "neden var" açıklaması tahmindir

Dil modeli tam olarak kodu okuyup gerekçeyi göremeyen okuyucudur; tuhaf duran bir yapıyı gereksiz karmaşıklık sayması bir hata değil beklenen davranıştır. Modelin bir bloğun NE yaptığına dair açıklaması doğrulanabilir bir iddiadır; NEDEN orada olduğuna dair açıklaması ise bir tahmindir ve kanıt sayılamaz.

**Kırılır:** Gerekçe bağlama açıkça verilmişse — depoda otomatik okunan bir kısıt dosyası, kodun yanındaki bir karar kaydı. O zaman model tahmin etmez, okur.

**Neden:** Model üretim tarafını hızlandırır, doğrulama tarafını aynı oranda hızlandırmaz; darboğaz doğrulamaya kayar ve birim zamanda üretime sızan hatalı değişiklik sayısı artar. Bu, model kalitesinden bağımsız yapısal bir sonuçtur.

*Kaynak: BELGE-184, BELGE-038*

## Bitirmeden

*Bitti demeden önce irdeleme ve doğrulama*

### KOD-30 — Savunmak için değil çürütmek için oku; her turda merceği değiştir

İyi bir inceleme, işi savunmak için değil onu çürütebildiği ölçüde çürütmeye çalışmak için yürütülür; çürütme girişimi başarısız olduğunda güven artar. Ve aynı mercekle daha çok bakmak aynı şeyi bulur — bulgular çabadan değil AÇI DEĞİŞİMİNDEN gelir. Katmanları döndür: amaç, gereksinim, varsayım, arayüz, veri ve durum, zaman, hata, sınır koşulları, güvenlik, insan, gözlemlenebilirlik, geri alınabilirlik, karar gerekçesi, bilinmeyenler.

**Kırılır:** Nesnenin şekli henüz belirsizse — keşif fazında ortada çürütülecek bir iddia yoktur. Önce şekil, sonra irdeleme.

**Neden:** Onaylayıcı kanıt toplamak ucuz ve yanıltıcıdır. Ekiplerin çoğunun atladığı bir katman daha vardır: incelemenin kendisinin incelenmesi — doğru kişiye mi soruldu, uygulanan test aranan hatayı yakalayabilir miydi, ekibin tamamı aynı kör noktayı mı paylaşıyor.

*Kaynak: BELGE-174*

### KOD-31 — Doyum kriteri tek başına yeterli değildir; kapsam koşulunu da ara

"Üç tur üst üste yeni kritik bulgu yok" ölçütü tek başına kırılgandır. Yanına iki koşul daha koy: her katman en az iki kez tarandı mı (kapsam doyumu), ve bir bütçe tavanı. İlk ikisi sağlanmadan döngü durmamalı, üçüncüsü aşıldığında zorunlu olarak durmalıdır.

**Kırılır:** Nesne tek turda bitecek kadar küçükse döngü kurmanın maliyeti getirisini aşar.

**Neden:** Doyum doğruluk anlamına gelmez: dar bir çerçeveye sıkışmış bir inceleme hızla doyar ve süreci tamamlanmış olarak raporlar. Karşı sınama basittir — nesneye bilinen bir kusur kasten yerleştir; döngü bunu bulamıyorsa hatalı olan döngüdür.

*Kaynak: BELGE-174*

### KOD-32 — Örtük varsayımı yazıya dök; her tespiti alıntıyla bağla

Zihinde sessizce kabul edilen varsayımları açık metne dönüştür — yazılmayan varsayım görünmez olduğu için denetlenemez. Her tespit ilgili satırı birebir alıntılasın ya da çalıştırılabilir bir karşı örnek üretsin. Okuma kandırılabilir; geçmeyen bir test geçmez.

**Kırılır:** Çalıştırma üretim verisi veya üretim ortamı gerektiriyorsa çalıştırılabilir kanıt elde edilemez; orada alıntı ve bağımsız ikinci geçiş kalır.

**Neden:** En pahalı hatalar incelemecinin "gördü" sandığı ama beklentisine dayanarak tahmin ettiği yerlerde saklanır. Hem insan hem model metni bütünsel okur; tanıdık bir kalıp görüldüğünde ayrıntı okunmaz, kalıba göre tahmin edilir. Alıntı zorunluluğu tam olarak bu kestirmeyi kapatır.

*Kaynak: BELGE-169*

### KOD-33 — Yüksek tehlikede bağımsız ikinci geçiş yap

Sonuca hiç bakmadan işi sıfırdan yeniden üret ve iki sonucu karşılaştır. Ayrışan her nokta, paylaşılan gizli bir varsayıma işaret eder.

**Kırılır:** Düşük tehlikede maliyeti getirisini aşar — KOD-06'daki eşiğe bak.

**Neden:** Kıdemli üç mühendisin onayından geçen seksen sayfalık bir termal analizde en tepedeki kişi 34. sayfadaki tek bir hatalı varsayımı yakalar. Bu bir kahramanlık hikâyesi değil, sistem başarısızlığıdır: üç bağımsız inceleme belgede yazılı olmayan bir varsayımı görememiştir, çünkü hiçbiri işi bağımsız olarak yeniden yapmamıştır.

*Kaynak: BELGE-169*

### KOD-34 — Bulgunun şeklini kod tabanında ara; tekil olaydan ilkeye geç

Her gerçek kusurun bir ŞEKLİ vardır. O şekli kod tabanının tamamında ara — bir hata orada beşe dönüşür. Sonra bir basamak yukarı çık: çıkarılacak sonuç "teknisyen yanlış taktı" değil "kritik bağlantı yanlış montaja fiziksel olarak izin vermemeli"dir.

**Kırılır:** Olay gerçekten tekilse ve tekrarlamayan bir dış koşuldan doğuyorsa — tek seferlik bir veri bozulması, kapanmış bir dış sisteme özgü davranış.

**Neden:** Variant analizi insanların atladığı adımdır; düzeltilip variant'ı aranmamış bir hata yarım düzeltilmiştir.

*Kaynak: BELGE-174*

### KOD-35 — Test bağımsız bir ikinci türetme mi, kodun tekrarı mı?

Test ve kod aynı niyetin iki bağımsız türetmesidir; uyuşmaları kanıt değeri taşır çünkü bağımsızdırlar. Test implementasyonun yapısından türetildiğinde (her iş birliği nesnesinin taklit edilmesi, çağrı sıralarının doğrulanması) bağımsızlık çöker ve geriye totoloji kalır: kodun kod olduğunu doğrulayan bir test. Ayrıca kırmızı fazını gördün mü — ilk yazımında geçen bir test, hiçbir şey ölçmediği fark edilmemiş bir alettir.

**Kırılır:** Karakterizasyon testinde ilişki terstir: orada kod sabit dünya, test ise yanlışlanabilir bir sanıdır ve kodun şeklinden türetilmiş olması kusur değil amaçtır.

**Neden:** Yoğun taklit içeren süitlerin yemyeşil yanarken sistemin çalışmamasının sebebi budur. Ayrıca testler modelin temel geri bildirim mekanizmasıdır; testler kırılgan veya yüzeyselse model işlevsel olarak körleşir — kod üretmeye devam eder ama gerçek etkisini değerlendiremez.

*Kaynak: BELGE-153, BELGE-038*

### KOD-36 — Tek değişiklikte çok test kırmızıysa bu bir tanıdır

Dışa dönük davranış değişmediyse kusur testlerdedir: süit yapıya kenetlenmiştir. Davranış gerçekten değiştiyse kırmızılar doğru ve bilgilendiricidir. İkinci sinyal: testi kurmak için çok sayıda bağımlılığı ayağa kaldırmak gerekiyorsa bu tasarım hakkında ampirik bir veridir — hipotez testi yapılmıyor, termometre okunuyor.

**Kırılır:** Kaskadın kaynağı paylaşılan kurulum bloğuysa tanı yanıltıcıdır; ortak kurulum süitin gizli tekil noktasıdır ve oradaki bir varsayım değiştiğinde bağımsız görünen testler topluca düşer.

**Neden:** Kırk test aynı iç ayrıntıya dokunuyorsa o ayrıntı kırk kenarlı bir düğüme dönüşmüştür. Test süiti API'nin ikinci tüketicisidir; her test bir bağımlılık kenarıdır. Süit kutsal değildir, bir maliyet-fayda kalemidir ve test silinebilir.

*Kaynak: BELGE-153*

### KOD-37 — Geçici olarak devre dışı bıraktığın korumaları geri aç

Aktarılması ve kapatılması gereken bilgi, tamamlanmış işler değil TAMAMLANMAMIŞ olanlar ve geçici olarak devre dışı bırakılmış korumalardır: susturulmuş bir uyarı kuralı, atlanmış bir test, gevşetilmiş bir eşik, açık bırakılmış bir hata ayıklama bayrağı.

**Kırılır:** Kapatma kalıcı ve kasıtlıysa ve bu karar tarihiyle, gerekçesiyle kaydedilmişse. Kaydedilmemişse geçicidir ve unutulur.

**Neden:** Piper Alpha'da bakım için sökülmüş bir emniyet valfinin durumu vardiya devrinde eksik aktarıldı ve sonraki vardiya pompayı çalıştırılabilir varsaydı. Bilgi en çok sorumluluk el değiştirirken kaybolur; kazaların orantısız bölümü bu ana denk gelir.

*Kaynak: BELGE-148*

### KOD-38 — Bu incelemenin neyi KAPSAMADIĞINI yaz

Bitirirken üç satır ekle: bu inceleme neyi kapsamadı (performans, güvenlik, dağıtım, göç), hangi tespit doğrulandı ve hangisi varsayım olarak kaldı, hangi ölçüt ilk gün izlenecek. Kesin doğrulanan / güçlü desteklenen / varsayılan ama test edilmemiş ayrı işaretlenmeli.

**Kırılır:** Değişiklik gerçekten tek dosyalık ve geri alınabilirse üç satır fazladır; bir satır yeter.

**Neden:** Bu ayrım yapılmadığında bir varsayım birkaç aktarım sonra olgu olarak dolaşıma girer.

*Kaynak: BELGE-169, BELGE-166*

## Arıza

*Bir şey bozulduğunda: hata ayıklama, olay incelemesi*

### KOD-39 — Mekanizma zinciri kurulmadan yapılan düzeltme semptom bastırmaktır

"Ne ile birlikte oluyor?" sorusundan "hangi süreç üzerinden oluyor?" sorusuna geç. Teşhis ancak adım adım zincir kurulduğunda tamamlanır: bağlantı havuzu doldu → istekler kuyrukta bekledi → istemci zaman aşımına uğradı → retry gönderdi → yük ikiye katlandı → havuz daha da doldu.

**Kırılır:** Zincirin bir halkası hesaplamalı olarak indirgenemezse — bazı sistemlerin davranışını öğrenmenin tek yolu onları çalıştırmaktır, kısayol yoktur. Orada zincir kurmak yerine deney yapılır.

**Neden:** Zincir kurulmadan yapılan düzeltme aynı arızanın bir sonraki biçimini engellemez.

*Kaynak: BELGE-166*

### KOD-40 — Kırmızı bir test kodun yanlış olduğunu kanıtlamaz

Hiçbir hipotez tek başına test edilmez; her test arka plan varsayımları demetiyle birlikte sınanır. Test başarısız olduğunda hangi varsayımın yanlış olduğu mantıksal olarak belirsizdir: kod mu hatalı, test mi hatalı, ortam mı farklı, bağımlılık sürümü mü değişti? Ve ters yönde: test hatanın varlığını gösterir, yokluğunu değil.

**Kırılır:** Test bir dakika önce yeşildi ve aradaki tek fark senin değişikliğinse belirsizlik pratikte yok denecek kadar azdır.

**Neden:** Duhem-Quine problemi hata ayıklamada en sık atlanan adımdır; ekip kodu düzeltmeye çalışırken sorun ortamdadır.

*Kaynak: BELGE-166*

### KOD-41 — Ölçüm, ölçtüğü olaydan hızlı örneklemiyorsa kanıt değildir

Toplama aralığı on beş saniye olan bir metrik, üç saniyelik bir doygunluk olayını hiç göstermez. Yüzde birlik örnekleme oranıyla çalışan bir iz toplayıcı nadir yolu asla yakalamaz. Toplulaştırma sırasında yüzdelik dilimlerin ortalamasını almak matematiksel olarak anlamsızdır ve kuyruk gecikmesini sistematik olarak küçük gösterir. Ayrıca ölçmek sistemi değiştirir (prob etkisi).

**Kırılır:** Aradığın olay ölçüm penceresinden uzun sürüyorsa — saatlerce süren bir bellek sızıntısı on beş saniyelik metrikte net görünür.

**Neden:** Ölçüm zincirinin kendisi bir sistemdir ve o da hata üretir. Aracı doğrulamadan yapılan ölçüm, sapmasızlığı gösterilmemiş bir aygıtla yapılan ölçümdür.

*Kaynak: BELGE-166*

### KOD-42 — Göremediğin veri sistematik olarak filtrelenmiş olabilir

Çökme raporu altyapısında biriken kayıtlar, yalnızca raporlamanın ayakta kalabildiği çökmelerdir; süreci anında öldüren hatalar hiç görünmez. Zaman aşımına uğrayan istekler tamamlananların gecikme histogramında yer almaz — yani en yavaş istekler ölçümden sistematik olarak dışlanır. Kullanıcı anketleri yalnızca terk etmemiş kullanıcılara ulaşır.

**Kırılır:** Ölçüm noktası olayın kendisinden önce ve dışında duruyorsa (ağ geçidi tarafında sayılan istek, istemcinin gönderdiği başlangıç işareti) sansür kalkar.

**Neden:** Sansürlü veri üzerinde yapılan kalıntı analizi yanlış yöne işaret eder.

*Kaynak: BELGE-166*

### KOD-43 — Korelasyon değil müdahale; ama patlama yarıçapını önce sınırla

"Yavaş sorgu ile yüksek hata oranı birlikte görülüyor" bir korelasyondur; ikisini de tetikleyen üçüncü bir neden olabilir. Sorguya yapay gecikme enjekte edip hata oranının yükseldiğini görmek karşıolgusal bilgi üretir. Müdahale kendiliğinden bilgi vermez, KARŞILAŞTIRMA verir: kontrol grubu olmadan yapılan üretim değişikliği aynı anda olan her şeyle karışır.

**Kırılır:** Patlama yarıçapı önceden sınırlandırılamıyorsa müdahale edilmez. Sınırlanabiliyorsa da önce gözlemle ucuz olan elenir.

**Neden:** Pasif gözlem birliktelik ilişkisi üretir ve bu ilişki ortak bir üçüncü nedenle de açıklanabilir. Kontrollü müdahale, müdahale edilmeseydi sonucun ortaya çıkmayacağını deneysel olarak gösterir. Chaos engineering'in epistemolojik değeri buradadır.

*Kaynak: BELGE-166*

### KOD-44 — Asıl bilgi modelin açıklayamadığı yüzdededir

Kapasite modelin trafiğin yüzde doksanını açıklıyorsa asıl bilgi kalan yüzde ondadır. "Ortalama gecikme modelle uyumlu ama 99. yüzdelik üç kat yüksek" gözlemi, ortalamayı değil kuyruğu üreten bir mekanizmaya işaret eder: çöp toplama duraklaması, kilit çekişmesi, bağlantı havuzu tükenmesi. Ve bir uyarı: sekiz özel durumla donatılmış bir teşhis hipotezi geçmiş olayların tümünü açıklar ve bir sonrakini öngöremez.

**Kırılır:** Kalıntı ölçüm gürültüsü mertebesindeyse — orada açıklanacak bir şey yoktur, KOD-41'e bak.

**Neden:** Sadelik burada estetik tercih değil öngörü gücü kriteridir: iyi model, henüz görülmemiş olayı doğru tahmin edendir.

*Kaynak: BELGE-166*

### KOD-45 — Her parça doğru çalışırken bütün bozulabilir

Retry fırtınası, thundering herd, önbellek çığı, metastabil arıza. Bunların ortak özelliği her bileşenin kendi başına doğru çalışmasıdır; bileşen düzeyinde inceleme bu sınıfı hiçbir zaman bulamaz. Metastabil arıza özellikle öğreticidir: "nedeni bul ve kaldır" sezgisini kırar — neden zaten kalkmıştır, sistem yine de düzelmez. Ek sinyal: 30 saniye ile 31 saniye arasında davranış NİTELİKSEL olarak değişiyorsa orada gizli bir eşik vardır ve bulunmalıdır.

**Kırılır:** Sistem gerçekten yakın ayrıştırılabilirse ve etkileşim yüzeyi darsa bu sınıf oluşmaz — ama global değişebilir durum, gizli zamansal bağlantı ya da paylaşılan tablo varsa ayrıştırılabilirlik zaten yoktur.

**Neden:** "Yüzde 50 yükte iyi çalışıyordu" gözlemi yüzde 80 hakkında neredeyse hiçbir şey söylemez; doluluk kritik eşiğe yaklaştıkça kuyruk gecikmesi patlar. Bu bir kusur değil matematiksel bir zorunluluktur ve çözümü kod eniyilemesi değil kapasite planlaması ya da geri basınç tasarımıdır.

*Kaynak: BELGE-166, BELGE-043*

### KOD-46 — Kök neden tekil bir kutu değil, hizalanmış deliklerdir

Ciddi arızalar tek bir hatadan değil, birden çok savunma katmanındaki deliklerin hizalanmasından doğar: kod incelemesi kaçırdı, test kapsamadı, kanarya çok kısa sürdü, alarm eşiği yanlıştı, runbook eskiydi. Düzeltme birden çok katmana yapılmalıdır — yalnızca kodu düzeltip alarmı düzeltmemek aynı deliği açık bırakır. Ölçüt: runbook çeşitliliği arıza modu çeşitliliğinden az olamaz.

**Kırılır:** Sistem gerçekten tek katmanlıysa — küçük bir araç, tek kullanıcılı bir betik. Orada katman aramak tören olur.

**Neden:** Sıkı bağlı ve etkileşimsel olarak karmaşık sistemlerde bazı arızalar öngörülemez ve kaçınılmazdır; kusur değil yapının doğal sonucudurlar. Buradan iki tasarım yönü çıkar: bağı gevşetmek ve etkileşim karmaşıklığını azaltmak.

*Kaynak: BELGE-166*

### KOD-47 — Sapmanın kendisini değil sapma eğilimini izle

Aralıklı olarak başarısız olan sınamalar, düzenli biçimde susturulan uyarılar, tekrarlayan ancak kendiliğinden düzelen hata kayıtları, her yayında bir kez daha esnetilen bir eşik — bunların tümü sapma sinyalidir. İzlenmesi gereken büyüklük anomalinin son sonucu değil SIKLIĞINDAKİ DEĞİŞİMDİR. Bir sapma kabul edilecekse kararın tarihini ve gerekçesini kaydet.

**Kırılır:** Sapmanın sıklığı ölçülemiyorsa — kayıt tutulmuyorsa. O zaman önce ölçüm kurulur, eğilim sonra izlenir.

**Neden:** Kural krizde tartışılarak kaldırılmaz; sessizce, tekil bir istisna olarak delinir ve ikinci istisna birincisine dayanarak meşrulaşır. Referans noktası artık kural değil son gözlenen sapmadır. Kaydetmek, sonraki kararın referansının önceki sapma değil özgün kural olmasını sağlar — aşınmaya karşı en doğrudan yapısal önlem budur. Ve geriye dönük göstergeler (çalışma süresi, olay sayısı) riski gizler; anlamlı göstergeler ileriye dönüktür: yedekten geri dönüş en son ne zaman sınandı?

*Kaynak: BELGE-148*

