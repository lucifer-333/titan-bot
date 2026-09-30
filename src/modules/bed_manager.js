/**
 * Sleep & Chrono-Management Engine for Mineflayer
 * Automatic night detection, bed locating, sleeping to skip nights and resetting phantom spawn timers.
 */
class BedManagerEngine {
  constructor(bot) {
    this.bot = bot;
    this.isSleeping = false;
  }

  async sleepInNearestBed() {
    const bed = this.bot.findBlock({
      matching: (b) => b && b.name.includes('_bed'),
      maxDistance: 16
    });

    if (!bed) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda yatak bulamadım reis!`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] Yatağa yatıyorum, geceyi atlatıyoruz...`);
    try {
      await this.bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalNear)(bed.position.x, bed.position.y, bed.position.z, 1.5));
      await this.bot.sleep(bed);
      this.isSleeping = true;
      this.bot.chat(`[${this.bot.username}] Uyudum, iyi geceler reis!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Uyuyamadım: ${err.message}`);
    }
  }

  async wakeUp() {
    if (!this.isSleeping) return;
    try {
      await this.bot.wake();
      this.isSleeping = false;
      this.bot.chat(`[${this.bot.username}] Günaydın reis, göreve devam!`);
    } catch (_) {}
  }
}

module.exports = BedManagerEngine;
