/**
 * Combat & Tactical Warfare Engine for Mineflayer
 * Advanced circle-strafing, jump critical hits, shield timing, and target prioritization.
 */
class CombatEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.target = null;
    this.strafeAngle = 0;
    this.isShielding = false;
    this.attackInterval = null;
  }

  init() {
    this.bot.on('entityHurt', (entity) => this.handleEntityHurt(entity));
    this.bot.on('entityDead', (entity) => {
      if (this.target && this.target.id === entity.id) {
        this.stopCombat();
      }
    });
  }

  handleEntityHurt(entity) {
    // If our bot gets hurt, raise shield if available
    if (entity === this.bot.entity) {
      this.raiseShieldBriefly(1200);
      return;
    }

    // Bodyguard logic: If owner is attacked, counterattack the aggressor immediately!
    if (entity.username && entity.username.toLowerCase() === this.config.owner.toLowerCase()) {
      const attacker = this.findNearestHostileTo(entity.position, 16);
      if (attacker) {
        this.bot.chat(`[${this.bot.username}] Liderime saldırdın! Bedelini ödeyeceksin!`);
        this.engage(attacker);
      }
    }
  }

  findNearestHostileTo(pos, maxDist) {
    let closest = null;
    let minD = maxDist;

    for (const id in this.bot.entities) {
      const e = this.bot.entities[id];
      if (!e || e === this.bot.entity) continue;
      if (e.username === this.config.owner || (e.username && e.username.startsWith(this.config.baseName))) continue;
      
      const d = pos.distanceTo(e.position);
      if (d < minD) {
        minD = d;
        closest = e;
      }
    }
    return closest;
  }

  raiseShieldBriefly(duration = 1000) {
    const offhand = this.bot.inventory.slots[45];
    if (offhand && offhand.name.includes('shield')) {
      this.bot.activateItem(true);
      this.isShielding = true;
      setTimeout(() => {
        this.bot.deactivateItem();
        this.isShielding = false;
      }, duration);
    }
  }

  equipBestWeapon() {
    const items = this.bot.inventory.items();
    const weapons = items.filter(i => i.name.includes('sword') || i.name.includes('axe'));
    if (weapons.length === 0) return;

    weapons.sort((a, b) => {
      const score = (name) => {
        let s = name.includes('sword') ? 15 : 8;
        if (name.includes('netherite')) s += 50;
        else if (name.includes('diamond')) s += 40;
        else if (name.includes('iron')) s += 25;
        else if (name.includes('stone')) s += 10;
        return s;
      };
      return score(b.name) - score(a.name);
    });

    this.bot.equip(weapons[0], 'hand').catch(() => {});
  }

  engage(target) {
    if (!target || !target.isValid) return;
    this.target = target;
    this.equipBestWeapon();

    // Use Mineflayer-pvp plugin for base engagement
    if (this.bot.pvp) {
      this.bot.pvp.attack(target);
    }

    // Advanced Tactical loop: jump for crits & strafe around target
    if (this.attackInterval) clearInterval(this.attackInterval);
    this.attackInterval = setInterval(() => {
      if (!this.target || !this.target.isValid) {
        this.stopCombat();
        return;
      }

      const dist = this.bot.entity.position.distanceTo(this.target.position);
      if (dist <= 3.8 && !this.isShielding) {
        // Critical hit timing: jump right before attack
        if (this.bot.entity.onGround && Math.random() < 0.6) {
          this.bot.setControlState('jump', true);
          setTimeout(() => this.bot.setControlState('jump', false), 250);
        }
      }

      // Circle strafe when close to confuse hostile mobs and players
      if (dist <= 4.5) {
        this.strafeAngle += 0.5;
        this.bot.setControlState('left', Math.sin(this.strafeAngle) > 0);
        this.bot.setControlState('right', Math.sin(this.strafeAngle) <= 0);
      } else {
        this.bot.setControlState('left', false);
        this.bot.setControlState('right', false);
      }
    }, 400);
  }

  stopCombat() {
    this.target = null;
    if (this.attackInterval) clearInterval(this.attackInterval);
    this.attackInterval = null;
    this.bot.setControlState('left', false);
    this.bot.setControlState('right', false);
    this.bot.setControlState('jump', false);
    if (this.bot.pvp) {
      this.bot.pvp.stop();
    }
  }
}

module.exports = CombatEngine;
