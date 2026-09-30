/**
 * ==============================================================================
 * MOUNT & LOGISTICS TRANSPORT ENGINE (src/modules/mount_manager.js)
 * Taming, saddling, equestrian cavalry, and pack-mule inventory logistics.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class MountManagerEngine {
  constructor(bot) {
    this.bot = bot;
    this.isTaming = false;
  }

  // Find nearest rideable animal
  findNearestMount(maxDist = 24) {
    const mountTypes = ['horse', 'donkey', 'mule', 'llama'];
    let nearest = null;
    let minDist = maxDist;

    for (const id in this.bot.entities) {
      const e = this.bot.entities[id];
      if (!e || !mountTypes.includes(e.name)) continue;

      const dist = this.bot.entity.position.distanceTo(e.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  // Mount nearest horse/donkey
  async mountAnimal() {
    const mount = this.findNearestMount();
    if (!mount) {
      this.bot.chat(`[${this.bot.username}] 24 blokluk alanda uygun bir binek (at/eşek) bulunamadı.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] ${mount.name} tespit edildi, üzerine biniyorum...`);
    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(mount.position.x, mount.position.y, mount.position.z, 2));
      await this.bot.mount(mount);
      this.bot.chat(`[${this.bot.username}] 🐎 Bineğe başarıyla bindim!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Bineğe binilemedi: ${err.message}`);
    }
  }

  // Dismount current vehicle
  dismount() {
    if (this.bot.vehicle) {
      this.bot.dismount();
      this.bot.chat(`[${this.bot.username}] Binekten indim reis.`);
    } else {
      this.bot.chat(`[${this.bot.username}] Şu anda herhangi bir bineğin üzerinde değilim.`);
    }
  }

  // Attach chest to donkey or mule and load excess items
  async equipChestToPackAnimal() {
    const donkey = Object.values(this.bot.entities).find(e => 
      (e.name === 'donkey' || e.name === 'mule' || e.name === 'llama') && 
      this.bot.entity.position.distanceTo(e.position) <= 6
    );

    if (!donkey) {
      this.bot.chat(`[${this.bot.username}] Yanımda sandık takılabilecek bir eşek veya katır yok.`);
      return;
    }

    const chestItem = this.bot.inventory.items().find(i => i.name === 'chest');
    if (!chestItem) {
      this.bot.chat(`[${this.bot.username}] Eşeğe takmak için çantamda 'chest' (sandık) yok.`);
      return;
    }

    try {
      await this.bot.equip(chestItem, 'hand');
      await this.bot.activateEntity(donkey);
      this.bot.chat(`[${this.bot.username}] 📦 Eşeğe lojistik sandığı takıldı! Fazla yükler aktarılabilir.`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Sandık takma hatası: ${err.message}`);
    }
  }
}

module.exports = MountManagerEngine;
