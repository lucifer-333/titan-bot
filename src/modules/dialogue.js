/**
 * Natural Language Understanding & Tactical Dialogue Engine
 * High-depth Turkish response matrix, contextual status queries, and personality profiles.
 */
class DialogueEngine {
  constructor(bot, id) {
    this.bot = bot;
    this.id = id;
    this.role = id === 1 ? 'Baş Muhafız & Komutan' : 'Taktik İntikal & Keskin Savaşçı';
  }

  generateReply(cleanMsg) {
    const msg = cleanMsg.toLowerCase();

    // 1. Durum ve Sağlık Raporu
    if (msg.includes('nasılsın') || msg.includes('nasilsin') || msg.includes('naber') || msg.includes('durum')) {
      const hp = Math.round(this.bot.health || 20);
      const food = Math.round(this.bot.food || 20);
      const pos = this.bot.entity ? this.bot.entity.position.floored() : { x: 0, y: 0, z: 0 };
      return `Taş gibiyim reis! Sağlık: ${hp}/20 | Açlık: ${food}/20 | Konum: [${pos.x}, ${pos.y}, ${pos.z}]. Emrindeyim!`;
    }

    // 2. Kimlik ve Rütbe
    if (msg.includes('sen kimsin') || msg.includes('rütben ne') || msg.includes('görevin ne')) {
      return `Ben ${this.bot.username}! Rütbem: ${this.role}. Tek andım ve görevim luciferdiyetm'i korumaktır.`;
    }

    // 3. Silah ve Envanter Bilgisi
    if (msg.includes('envanter') || msg.includes('silahın ne') || msg.includes('çantada ne var')) {
      const items = this.bot.inventory.items();
      const weapon = items.find(i => i.name.includes('sword') || i.name.includes('axe'));
      const armor = items.filter(i => i.name.includes('helmet') || i.name.includes('chestplate') || i.name.includes('leggings') || i.name.includes('boots'));
      return `Silahım: ${weapon ? weapon.name : 'Boş'} | Kuşanılmış Zırh: ${armor.length}/4 parça | Toplam Eşya: ${items.length} slot.`;
    }

    // 4. Şakalar ve Moral
    if (msg.includes('şaka') || msg.includes('komik') || msg.includes('güldür')) {
      const jokes = [
        'Zombiye neden beyin yiyorsun demişler, "Ekmek bulamıyoruz reis" demiş!',
        'Creeper partiye gitmiş, alkışlayın derken kendini havaya uçurmuş.',
        'İskelet bara girip süt istemiş, barmen "kemik erimesi mi var?" demiş.',
        'Köylüye indirimin var mı dedik, "Hıııııı" dedi çekti gitti.',
        'Enderman neden suya girmez? Çünkü duş jeli pahalı.'
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // 5. Liderlik ve Övgü
    if (msg.includes('aferin') || msg.includes('helal') || msg.includes('kralsın') || msg.includes('adamsın')) {
      const praises = [
        'Senin liderliğinde her savaşı kazanırız reis!',
        'Eyvallah liderim, kanımızın son damlasına kadar yanındayız!',
        'Sen emret, dünyayı ikiye bölelim reis!'
      ];
      return praises[Math.floor(Math.random() * praises.length)];
    }

    // 6. Selamlaşma
    if (msg.includes('selam') || msg.includes('merhaba') || msg.includes('sa')) {
      return `Aleyküm selam liderim luciferdiyetm! Kılıçlarımız kınından çıkmış hazır bekliyor.`;
    }

    // 7. Hava ve Vakit
    if (msg.includes('hava nasıl') || msg.includes('saat kaç') || msg.includes('vakit')) {
      const isRaining = this.bot.isRaining ? 'Fırtınalı ve yağmurlu' : 'Açık hava';
      const time = this.bot.time ? (this.bot.time.timeOfDay > 13000 ? 'Gece vakti (Tehlikeli)' : 'Gündüz vakti') : 'Bilinmiyor';
      return `Hava durumu: ${isRaining} | Vakit: ${time}.`;
    }

    // Varsayılan askeri yanıt
    return `Emrini bekliyorum liderim luciferdiyetm, hazırdayım!`;
  }
}

module.exports = DialogueEngine;
