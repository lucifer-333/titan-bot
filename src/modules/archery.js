/**
 * Tactical Archery & Projectile Sniper Engine for Mineflayer
 * Gravity-compensated aiming, bow charge timing, and long-range engagement.
 */
class ArcheryEngine {
  constructor(bot) {
    this.bot = bot;
    this.isShooting = false;
  }

  hasBowAndArrow() {
    const items = this.bot.inventory.items();
    const bow = items.find(i => i.name === 'bow' || i.name === 'crossbow');
    const arrow = items.find(i => i.name.includes('arrow'));
    return { bow, arrow };
  }

  async shootTarget(target) {
    if (!target || !target.position || this.isShooting) return false;
    const { bow, arrow } = this.hasBowAndArrow();
    if (!bow || !arrow) return false;

    this.isShooting = true;
    try {
      await this.bot.equip(bow, 'hand');

      // Target position with gravity compensation
      const dist = this.bot.entity.position.distanceTo(target.position);
      const elevationCorrection = (dist / 20) * 0.45; // Archery arc trajectory
      const aimPos = target.position.offset(0, 1.3 + elevationCorrection, 0);

      await this.bot.lookAt(aimPos, true);

      // Charge bow for full velocity
      this.bot.activateItem();
      await this.bot.waitForTicks(24); // ~1.2 seconds for full draw
      this.bot.deactivateItem();

      this.isShooting = false;
      return true;
    } catch (_) {
      this.bot.deactivateItem();
      this.isShooting = false;
      return false;
    }
  }
}

module.exports = ArcheryEngine;
