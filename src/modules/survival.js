/**
 * Advanced Survival & Life Preservation Engine for Mineflayer
 * Potion drinking, fire extinguishing, water surfacing, and health management.
 */
class SurvivalEngine {
  constructor(bot) {
    this.bot = bot;
    this.isDrinking = false;
  }

  init() {
    // Environmental check loop
    setInterval(() => {
      this.checkAir();
      this.checkFire();
      this.checkCriticalHealth();
    }, 1000);
  }

  checkAir() {
    if (this.bot.oxygenLevel !== null && this.bot.oxygenLevel < 5) {
      this.bot.setControlState('jump', true); // Swim up for air!
    } else if (this.bot.entity && !this.bot.entity.isInWater) {
      this.bot.setControlState('jump', false);
    }
  }

  checkFire() {
    if (this.bot.entity && (this.bot.entity.isOnFire || this.bot.entity.isInLava)) {
      const now = Date.now();
      if (!this.lastFireAlert || now - this.lastFireAlert > 6000) {
        this.lastFireAlert = now;
        this.bot.chat(`[${this.bot.username}] 🔥 Yanıyorum! Suya koşuyorum!`);
      }
      // Find nearest water block within 16 blocks
      const water = this.bot.findBlock({
        matching: (b) => b && b.name === 'water',
        maxDistance: 16
      });
      if (water && water.position && this.bot.pathfinder) {
        this.bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalBlock)(water.position.x, water.position.y, water.position.z));
      }
    }
  }

  async checkCriticalHealth() {
    if (this.bot.health < 8 && !this.isDrinking) {
      // Look for instant health or regeneration potion
      const potion = this.bot.inventory.items().find(i => i.name.includes('potion') && (i.name.includes('healing') || i.name.includes('regen')));
      if (potion) {
        this.isDrinking = true;
        try {
          await this.bot.equip(potion, 'hand');
          this.bot.activateItem();
          setTimeout(() => {
            this.bot.deactivateItem();
            this.isDrinking = false;
          }, 1800);
        } catch (_) {
          this.isDrinking = false;
        }
      }
    }
  }
}

module.exports = SurvivalEngine;
