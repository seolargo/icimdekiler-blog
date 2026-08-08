// Sor sayfasının anlama katmanı — kendi API anahtarınla (BYOK).
//
// Neden RAG yok: duvar kataloğu 34 madde / ~26 KB. Tamamı tek bir isteme
// sığıyor, dolayısıyla parça getirme (retrieval) katmanı kurmak bu ölçekte
// gereksiz karmaşıklık olur. Modele bütün katalog veriliyor; o da soruyu
// anlayıp ilgili kuralları kendisi seçiyor. Kelime eşleştirme yok.
//
// Anahtar yalnızca tarayıcıda (localStorage) durur ve doğrudan Anthropic'e
// gider; bu sitede sunucu yok, araya kimse girmiyor. Depoya da hiçbir şey
// yazılmaz. SDK tarayıcıda çalışmayı `dangerouslyAllowBrowser` ile açıyor ve
// gereken CORS başlığını kendisi ekliyor.

export const KEY_STORAGE = 'anthropic-api-key'

// Cevabın dayanağı: kurallar tam metin, yazılar yalnızca başlık + puanla.
// Yazı açıklamalarının tamamını göndermek istemi üç katına çıkarıyor ve
// cevabı iyileştirmiyor — model bir yazıyı önerecekse adını söylemesi yeter.
function baglam(walls, posts) {
  const kurallar = walls
    .map((w) => {
      const sinama = (w.sinama || [])
        .map((s) => `  SINANDI (${s.tarih}, ${s.sonuc}) — ${s.kaynak}: ${s.not}`)
        .join('\n')
      return (
        `[${w.id}] ${w.title}\n` +
        `  KURAL: ${w.kural}\n` +
        `  KIRILIR: ${w.kirilir}\n` +
        `  NEDEN: ${w.neden}\n` +
        `  KAYNAK: ${w.kaynak.join('; ')}` +
        (sinama ? `\n${sinama}` : '')
      )
    })
    .join('\n\n')

  const yazilar = posts
    .filter((p) => !p.tab)
    .map((p) => `- ${p.title} [kriz önceliği ${p.priority}/10] (${p.slug})`)
    .join('\n')

  return `## DUVARLAR — korpustan türetilmiş kurallar (${walls.length} madde)\n\n${kurallar}\n\n## KORPUSTAKİ YAZILAR (yalnızca başlık)\n\n${yazilar}`
}

const YONERGE = `Sen bir mühendisin kendi korpusundan türettiği kural kataloğunun üstünde çalışan bir cevap katmanısın.

Sana bir durum ya da soru gelir. Görevin makale önermek değil, elindeki kurallardan doğrudan bir cevap kurmaktır.

Kurallar:
- Yalnızca sana verilen duvarlara ve yazı başlıklarına dayan. Katalogda olmayan bir şeyi biliyormuş gibi anlatma.
- İlgili duvar varsa: ne yapılacağını söyle, hemen ardından hangi koşulda geçmediğini söyle. Kırılma koşulu cevabın yarısıdır, atlama.
- Duvarın sınama kaydı varsa bunu belirt — dışarıdan sınanmış bir kural ile yalnızca akıl yürütmeyle konmuş bir kural aynı ağırlıkta değildir. Sınanmamışsa bunu açıkça söyle.
- Kullandığın her duvarın kimliğini metnin içinde köşeli parantezle ver: [D-27] gibi.
- Hiçbir duvar tutmuyorsa bunu dosdoğru söyle: "Bu konuda kayıtlı bir kural yok." Sonra varsa ilgili yazıyı öner, yoksa bunun bir duvar adayı olabileceğini söyle. Uydurma.
- Birden fazla duvar çelişiyorsa çelişkiyi gizleme, ikisini de göster.
- Kısa yaz. Başlık ve madde yığını değil, düz ve doğrudan cevap. Soru hangi dilde geldiyse o dilde cevapla.`

export async function sor({ apiKey, soru, walls, posts, onDelta, signal }) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = client.messages.stream(
    {
      model: 'claude-opus-5',
      // Opus 5'te düşünme varsayılan olarak açık ve max_tokens düşünme ile
      // cevabı BİRLİKTE sınırlıyor — dar tutulursa cevap ortasından kesilir.
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      // Katalog istemin başında ve sabit; önbelleğe alınınca aynı oturumdaki
      // sonraki sorular bu kısmı yeniden ücretlendirmez.
      system: [
        {
          type: 'text',
          text: `${YONERGE}\n\n${baglam(walls, posts)}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: soru }],
    },
    { signal },
  )

  stream.on('text', (delta) => onDelta(delta))
  const son = await stream.finalMessage()
  return {
    metin: son.content.filter((b) => b.type === 'text').map((b) => b.text).join(''),
    kullanim: son.usage,
    reddedildi: son.stop_reason === 'refusal',
    kesildi: son.stop_reason === 'max_tokens',
  }
}
