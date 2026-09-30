/**
 * ==============================================================================
 * BARD, JUKEBOX MUSICIAN & SQUAD MORALE ENGINE (src/modules/bard.js)
 * Jukebox disc playback, note block rhythm fanfares, and battlefield battle chants.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class BardEngine {
  constructor(bot) {
    this.bot = bot;
    this.isPlaying = false;
  }

  // Find nearest Jukebox block
  findJukebox(maxDist = 16) {
    return this.bot.findBlock({
      matching: (b) => b && b.name === 'jukebox',
      maxDistance: maxDist
    });
  }

  // Play a music disc in a jukebox
  async playMusicDisc() {
    const jukebox = this.findJukebox();
    if (!jukebox) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda müzik kutusu (jukebox) bulunamadı!`);
      return;
    }

    const disc = this.bot.inventory.items().find(i => i.name.includes('music_disc'));
    if (!disc) {
      this.bot.chat(`[${this.bot.username}] Çantamda müzik plağı (music disc) yok reis.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] 🎵 '${disc.name}' plağı takılıyor, parti başlasın!`);
    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(jukebox.position.x, jukebox.position.y, jukebox.position.z, 2));
      await this.bot.equip(disc, 'hand');
      await this.bot.activateBlock(jukebox);
      this.isPlaying = true;
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Müzik kutusu hatası: ${err.message}`);
    }
  }

  // Sing a morale-boosting battle chant in chat
  singBattleHymn() {
    const hymns = [
      '🎶 "Kılıçlar kınından çıktı, kalkanlar göğe kalktı! luciferdiyetm emretti, tüm zombiler darmadağın!" ⚔️',
      '🎶 "Madende elmas ararız, düşmanı ikiye yararız! Biz Titan ordusuyuz, geceyi güne katarız!" 💎',
      '🎶 "Creeper patlasa ne yazar, okçular pusuda azar! Bizim liderimizin namı tüm sunucuyu sarar!" 🛡️',
      '🎶 "Nether lavı vız gelir, ejderhaya güç yetmez! luciferdiyetm ordusu asla pes etmez!" 🐉'
    ];

    const randomSong = hymns[Math.floor(Math.random() * hymns.length)];
    this.bot.chat(`[${this.bot.username}] ${randomSong}`);
  }
}

module.exports = BardEngine;
