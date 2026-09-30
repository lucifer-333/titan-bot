/**
 * ==============================================================================
 * ELYTRA FLIGHT & ROCKET PROPULSION ENGINE (src/modules/elytra_navigator.js)
 * Aerial gliding, firework kinetic acceleration, and safe stall-flare landings.
 * ==============================================================================
 */

class ElytraNavigatorEngine {
  constructor(bot) {
    this.bot = bot;
    this.isFlying = false;
    this.flightLoop = null;
  }

  hasFlightGear() {
    const items = this.bot.inventory.items();
    const elytra = items.find(i => i.name === 'elytra');
    const rockets = items.filter(i => i.name === 'firework_rocket');
    return { elytra, rockets };
  }

  async startFlight(targetPos = null) {
    const { elytra, rockets } = this.hasFlightGear();
    if (!elytra) {
      this.bot.chat(`[${this.bot.username}] Uçuş için çantamda Elytra yok reis!`);
      return;
    }

    if (rockets.length === 0) {
      this.bot.chat(`[${this.bot.username}] İtici güç için Havai Fişek Roketi (firework_rocket) eksik!`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] 🪂 Elytra kuşanılıyor, hava sahasına çıkılıyor...`);

    try {
      // 1. Equip Elytra in chest slot (slot 6)
      await this.bot.equip(elytra, 'torso');
      await this.bot.equip(rockets[0], 'hand');

      // 2. Takeoff jump
      this.bot.setControlState('jump', true);
      await this.bot.waitForTicks(5);
      this.bot.setControlState('jump', false);
      await this.bot.waitForTicks(3);
      this.bot.setControlState('jump', true); // Open elytra in mid-air

      // 3. Ignite first rocket
      await this.bot.look(this.bot.entity.yaw, 0.15, true); // Pitch slightly up
      this.bot.activateItem();

      this.isFlying = true;
      this.bot.chat(`[${this.bot.username}] 🚀 Uçuş başladı! Yüksek hızda süzülüyorum.`);

      // Periodic flare and altitude check
      this.flightLoop = setInterval(() => {
        if (!this.isFlying || !this.bot.entity) {
          clearInterval(this.flightLoop);
          return;
        }

        // If touching ground or submerged in water, terminate flight
        if (this.bot.entity.onGround || this.bot.entity.isInWater) {
          this.landSafely();
        }
      }, 500);

    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Uçuş başlatma hatası: ${err.message}`);
    }
  }

  // Safe flare landing: pitches upward to kill downward kinetic velocity
  async landSafely() {
    this.isFlying = false;
    if (this.flightLoop) clearInterval(this.flightLoop);
    this.bot.setControlState('jump', false);

    try {
      // Look up to stall wing speed
      await this.bot.look(this.bot.entity.yaw, -0.6, true);
      this.bot.chat(`[${this.bot.username}] 🛬 Güvenli iniş yapıldı, paraşüt toplandı.`);
    } catch (_) {}
  }
}

module.exports = ElytraNavigatorEngine;
