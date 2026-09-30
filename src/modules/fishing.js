/**
 * Automated Fishing Engine for Mineflayer
 * Casts fishing line, listens for bite / bobber splash, reels in catch, and repeats.
 */
class FishingEngine {
  constructor(bot) {
    this.bot = bot;
    this.isFishing = false;
  }

  async startFishing() {
    const rod = this.bot.inventory.items().find(i => i.name.includes('fishing_rod'));
    if (!rod) {
      this.bot.chat(`[${this.bot.username}] Balık tutmak için oltam yok reis!`);
      return;
    }

    const water = this.bot.findBlock({
      matching: (b) => b && b.name === 'water',
      maxDistance: 12
    });

    if (!water) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda su birikintisi bulamadım.`);
      return;
    }

    this.isFishing = true;
    this.bot.chat(`[${this.bot.username}] Oltamı aldım, balık tutmaya başlıyorum...`);
    await this.bot.equip(rod, 'hand');
    await this.bot.lookAt(water.position.offset(0.5, 0.5, 0.5));

    this.castLoop();
  }

  async castLoop() {
    if (!this.isFishing) return;

    try {
      this.bot.activateItem(); // Cast
      
      // Wait for fish bite or timeout
      const onFishBite = () => {
        if (!this.isFishing) return;
        this.bot.activateItem(); // Reel in!
        setTimeout(() => this.castLoop(), 1500);
      };

      // Listen for collect or sound
      this.bot.once('playerCollect', onFishBite);

      // Fallback timeout if no bite within 18 seconds
      setTimeout(() => {
        this.bot.removeListener('playerCollect', onFishBite);
        if (this.isFishing) {
          this.bot.activateItem();
          setTimeout(() => this.castLoop(), 1200);
        }
      }, 18000);
    } catch (_) {
      this.isFishing = false;
    }
  }

  stop() {
    this.isFishing = false;
    this.bot.chat(`[${this.bot.username}] Balık tutmayı bıraktım.`);
  }
}

module.exports = FishingEngine;
