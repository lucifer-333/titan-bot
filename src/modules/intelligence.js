/**
 * ==============================================================================
 * THREAT ANALYSIS & SOUND/CHAT INTELLIGENCE ENGINE (src/modules/intelligence.js)
 * Audio acoustic monitoring, server chat sentiment, and hostile ambush alarms.
 * ==============================================================================
 */

class IntelligenceEngine {
  constructor(bot, config, dialogue) {
    this.bot = bot;
    this.config = config;
    this.dialogue = dialogue;
    this.lastThreatAlertTime = 0;
  }

  init() {
    // 1. Acoustic Threat Monitoring (Sound Effects)
    this.bot.on('hardcodedSoundEffect', (name, category, position) => {
      this.analyzeSound(name, position);
    });

    this.bot.on('soundEffect', (name, category, position) => {
      this.analyzeSound(name, position);
    });

    // 2. Chat Sentiment & Server Intelligence
    this.bot.on('chat', (sender, message) => {
      this.analyzeChatMessage(sender, message);
    });
  }

  analyzeSound(soundName, position) {
    const now = Date.now();
    if (now - this.lastThreatAlertTime < 4000) return; // Debounce alerts

    const cleanSound = (soundName || '').toLowerCase();

    // A. Creeper Priming / Hissing (Extreme Danger)
    if (cleanSound.includes('creeper.primed') || cleanSound.includes('fuse') || cleanSound.includes('tnt.primed')) {
      this.lastThreatAlertTime = now;
      this.bot.chat(`[${this.bot.username}] ⚠️ DİKKAT REİS! Arkanda CREEPER TISLAMASI var! HEMEN UZAKLAŞ!`);
      // Tactical immediate retreat
      this.bot.setControlState('back', true);
      this.bot.setControlState('jump', true);
      setTimeout(() => {
        this.bot.setControlState('back', false);
        this.bot.setControlState('jump', false);
      }, 1000);
      return;
    }

    // B. Explosion Threat
    if (cleanSound.includes('explode') || cleanSound.includes('explosion')) {
      this.lastThreatAlertTime = now;
      this.bot.chat(`[${this.bot.username}] 💥 Yakında bir patlama gerçekleşti, tetikteyim!`);
      return;
    }

    // C. Lava or Fire Hazard
    if (cleanSound.includes('lava') || cleanSound.includes('fire.ambient')) {
      this.lastThreatAlertTime = now;
      this.bot.chat(`[${this.bot.username}] ♨️ Yakınlardan lav/ateş sesi geliyor, adımlarına dikkat et reis.`);
      return;
    }

    // D. Zombie Door Breaking / Siege
    if (cleanSound.includes('zombie.break_door') || cleanSound.includes('door_break')) {
      this.lastThreatAlertTime = now;
      this.bot.chat(`[${this.bot.username}] 🚪 Tehlike! Bir zombi kapıyı kırmaya çalışıyor!`);
    }
  }

  analyzeChatMessage(sender, message) {
    if (sender === this.bot.username) return;
    const clean = message.toLowerCase().trim();

    // If sender is foreign (not owner, not bot)
    if (sender.toLowerCase() !== this.config.owner.toLowerCase()) {
      // If someone mentions bot's name or owner's name
      if (clean.includes(this.bot.username.toLowerCase()) || clean.includes(this.config.owner.toLowerCase())) {
        console.log(`[İstihbarat] ${sender} isimli oyuncu bot veya lider hakkında konuştu: "${message}"`);
        
        // Hostile / Provocative detection
        if (clean.includes('öl') || clean.includes('öldür') || clean.includes('bot') || clean.includes('ezik') || clean.includes('hile')) {
          this.bot.chat(`[${this.bot.username}] ${sender}, laflarına dikkat et! Liderim luciferdiyetm'in emrindeyim.`);
        }
      }

      // Help call in chat
      if (clean === 'yardım' || clean === 'help' || clean === 'kurtarın') {
        this.bot.chat(`[${this.bot.username}] ${sender}, yardım talebin tespit edildi. Liderimin onayı olmadan müdahale edemem.`);
      }
    }
  }
}

module.exports = IntelligenceEngine;
