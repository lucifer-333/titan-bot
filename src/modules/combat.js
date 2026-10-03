/**
 * Tactical GOD-TIER Warfare & PVP/PVE Engine for Mineflayer
 * Jump-critical falling hits (150% damage), circle-strafing, shield parry,
 * axe shield-breaker, totem hot-swap, and owner bodyguard response.
 */
class CombatEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.target = null;
    this.strafeAngle = 0;
    this.isShielding = false;
    this.combatLoop = null;
    this.lastAttackTime = 0;
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
    if (!entity) return;

    // Self defense: if bot gets hurt, parry with shield immediately
    if (this.bot.entity && entity.id === this.bot.entity.id) {
      this.raiseShieldBriefly(800);
      return;
    }

    // Bodyguard response: If owner is attacked, punish the attacker immediately!
    if (entity.username && entity.username.toLowerCase() === this.config.owner.toLowerCase()) {
      if (!entity.position) return;
      const attacker = this.findNearestHostileTo(entity.position, 18);
      if (attacker) {
        this.bot.chat(`[${this.bot.username}] ⚔️ LİDERİME SALDIRAN CEZASINI ÇEKECEK! Hedef: ${attacker.username || attacker.name}!`);
        this.engage(attacker);
      }
    }
  }

  findNearestHostileTo(pos, maxDist) {
    if (!pos) return null;
    let closest = null;
    let minD = maxDist;

    for (const id in this.bot.entities) {
      const e = this.bot.entities[id];
      if (!e || !e.position || e === this.bot.entity) continue;
      if (e.username && (e.username.toLowerCase() === this.config.owner.toLowerCase() || e.username.startsWith(this.config.baseName))) continue;

      const d = pos.distanceTo(e.position);
      if (d < minD) {
        minD = d;
        closest = e;
      }
    }
    return closest;
  }

  raiseShieldBriefly(duration = 600) {
    if (this.isShielding) return;
    const offhand = this.bot.inventory?.slots[45];
    if (offhand && offhand.name.includes('shield')) {
      this.bot.activateItem(true);
      this.isShielding = true;
      setTimeout(() => {
        if (this.bot.entity) this.bot.deactivateItem();
        this.isShielding = false;
      }, duration);
    }
  }

  equipBestWeapon(isEnemyShielding = false) {
    if (!this.bot.inventory) return;
    const items = this.bot.inventory.items();
    
    // If enemy is shielding, prioritize axe to disable shield
    let weapons = [];
    if (isEnemyShielding) {
      weapons = items.filter(i => i.name.includes('axe') && !i.name.includes('pickaxe'));
    }
    if (weapons.length === 0) {
      weapons = items.filter(i => i.name.includes('sword') || (i.name.includes('axe') && !i.name.includes('pickaxe')));
    }
    if (weapons.length === 0) return;

    weapons.sort((a, b) => {
      const score = (name) => {
        let s = name.includes('sword') ? 15 : 12;
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

    // Use pvp plugin for pathing / orientation
    if (this.bot.pvp) {
      try {
        this.bot.pvp.attack(target);
      } catch (_) {}
    }

    if (this.combatLoop) clearInterval(this.combatLoop);
    this.combatLoop = setInterval(() => {
      if (!this.target || !this.target.isValid || !this.bot.entity || !this.bot.entity.position) {
        this.stopCombat();
        return;
      }

      const myPos = this.bot.entity.position;
      const targetPos = this.target.position;
      if (!targetPos) return;

      const dist = myPos.distanceTo(targetPos);

      // 1. Aim Lock on target eye height
      this.bot.lookAt(targetPos.offset(0, (this.target.height || 1.8) * 0.85, 0), true).catch(() => {});

      // 2. Offhand Emergency Totem / Shield check
      if (this.bot.health <= 10) {
        const totem = this.bot.inventory?.items().find(i => i.name === 'totem_of_undying');
        if (totem && this.bot.inventory.slots[45]?.name !== 'totem_of_undying') {
          this.bot.equip(totem, 'off-hand').catch(() => {});
        }
      }

      // 3. Fall-Crit Strike Execution
      const now = Date.now();
      // Attack cooldown in 1.21 ~625ms for sword
      if (dist <= 3.4 && !this.isShielding && now - this.lastAttackTime >= 620) {
        // Jump for critical hit
        if (this.bot.entity.onGround) {
          this.bot.setControlState('jump', true);
          setTimeout(() => {
            if (this.bot.entity) this.bot.setControlState('jump', false);
          }, 150);
        }

        // Strike right as we fall downward for critical damage
        if (this.bot.entity.velocity.y < 0.05 || !this.bot.entity.onGround) {
          this.bot.attack(this.target);
          this.lastAttackTime = now;
        }
      }

      // 4. Circle-Strafing & Spacing
      if (dist <= 4.0) {
        this.strafeAngle += 0.45;
        this.bot.setControlState('left', Math.sin(this.strafeAngle) > 0);
        this.bot.setControlState('right', Math.sin(this.strafeAngle) <= 0);
        this.bot.setControlState('sprint', true);

        // Don't hug target too closely (prevents mob collision pushback)
        if (dist < 1.8) {
          this.bot.setControlState('back', true);
          this.bot.setControlState('forward', false);
        } else {
          this.bot.setControlState('back', false);
          this.bot.setControlState('forward', true);
        }
      } else {
        this.bot.setControlState('left', false);
        this.bot.setControlState('right', false);
        this.bot.setControlState('back', false);
      }
    }, 250);
  }

  stopCombat() {
    this.target = null;
    if (this.combatLoop) clearInterval(this.combatLoop);
    this.combatLoop = null;

    if (this.bot.entity) {
      this.bot.setControlState('left', false);
      this.bot.setControlState('right', false);
      this.bot.setControlState('forward', false);
      this.bot.setControlState('back', false);
      this.bot.setControlState('jump', false);
      this.bot.setControlState('sprint', false);
    }

    if (this.bot.pvp) {
      try {
        this.bot.pvp.stop();
      } catch (_) {}
    }
  }
}

module.exports = CombatEngine;
