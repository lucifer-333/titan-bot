/**
 * Anti-AFK & Human-Like Life Simulation Engine for Mineflayer
 * Prevents AFK kicking, simulates natural human eye-saccades, idle head turns, and gestures.
 */
class AntiAFKEngine {
  constructor(bot) {
    this.bot = bot;
    this.isEnabled = true;
    this.timer = null;
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isEnabled || !this.bot.entity) return;

      // Only perform subtle natural gestures if bot is not in active pathfinding or combat
      if (!this.bot.pathfinder || !this.bot.pathfinder.isMoving()) {
        const action = Math.random();

        if (action < 0.4) {
          // Smooth glance in a natural direction
          const yaw = (Math.random() - 0.5) * Math.PI * 0.7;
          const pitch = (Math.random() - 0.5) * 0.4;
          this.bot.look(this.bot.entity.yaw + yaw, pitch, false).catch(() => {});
        } else if (action < 0.6) {
          // Subtle arm swing / punch air
          this.bot.swingArm('right');
        } else if (action < 0.75) {
          // Quick sneak gesture
          this.bot.setControlState('sneak', true);
          setTimeout(() => this.bot.setControlState('sneak', false), 250);
        }
      }
    }, 4500);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

module.exports = AntiAFKEngine;
