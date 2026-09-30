/**
 * ==============================================================================
 * AUTONOMOUS FACTORY & LIVESTOCK BREEDING ENGINE (src/modules/factory.js)
 * Multi-crop rotation, sugar cane harvesting, livestock breeding, milking & shearing.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class FactoryEngine {
  constructor(bot) {
    this.bot = bot;
    this.isWorking = false;
  }

  // 1. Sugar Cane Auto-Harvesting (Harvests upper stalk, leaves base intact)
  async harvestSugarCane() {
    const canes = this.bot.findBlocks({
      matching: (b) => b && b.name === 'sugar_cane',
      maxDistance: 24,
      count: 20
    });

    if (canes.length === 0) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda şeker kamışı bulunamadı.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] 🎋 Şeker kamışları hasat ediliyor...`);
    for (const pos of canes) {
      const block = this.bot.blockAt(pos);
      const below = this.bot.blockAt(pos.offset(0, -1, 0));

      // Only break if it's the 2nd or 3rd block (don't break the root block!)
      if (below && below.name === 'sugar_cane') {
        try {
          await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
          await this.bot.dig(block);
        } catch (_) {}
      }
    }
  }

  // 2. Animal Breeding (Cows, Sheep, Chickens, Pigs)
  async breedAnimals() {
    this.bot.chat(`[${this.bot.username}] 🐑 Çiftlik hayvanları besleniyor ve çoğaltılıyor...`);

    const breedingMap = {
      cow: 'wheat',
      sheep: 'wheat',
      chicken: 'wheat_seeds',
      pig: 'carrot'
    };

    const nearbyAnimals = Object.values(this.bot.entities).filter(e => {
      if (!e || !breedingMap[e.name]) return false;
      return this.bot.entity.position.distanceTo(e.position) <= 16;
    });

    if (nearbyAnimals.length === 0) {
      this.bot.chat(`[${this.bot.username}] Beslenecek yakın hayvan bulunamadı.`);
      return;
    }

    for (const animal of nearbyAnimals) {
      const foodItemName = breedingMap[animal.name];
      const foodItem = this.bot.inventory.items().find(i => i.name === foodItemName);
      if (!foodItem) continue;

      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(animal.position.x, animal.position.y, animal.position.z, 2));
        await this.bot.equip(foodItem, 'hand');
        await this.bot.activateEntity(animal);
        await this.bot.waitForTicks(8);
      } catch (_) {}
    }

    this.bot.chat(`[${this.bot.username}] Hayvanların beslenmesi tamamlandı!`);
  }

  // 3. Shearing Sheep
  async shearSheep() {
    const shears = this.bot.inventory.items().find(i => i.name === 'shears');
    if (!shears) {
      this.bot.chat(`[${this.bot.username}] Yün kırkmak için makas (shears) gerekli!`);
      return;
    }

    const sheep = Object.values(this.bot.entities).find(e => 
      e.name === 'sheep' && this.bot.entity.position.distanceTo(e.position) <= 16
    );

    if (!sheep) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda kırkılacak koyun yok.`);
      return;
    }

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(sheep.position.x, sheep.position.y, sheep.position.z, 2));
      await this.bot.equip(shears, 'hand');
      await this.bot.activateEntity(sheep);
      this.bot.chat(`[${this.bot.username}] ✂️ Koyunun yünü kırkıldı!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Kırkma hatası: ${err.message}`);
    }
  }

  // 4. Milking Cows
  async milkCows() {
    const bucket = this.bot.inventory.items().find(i => i.name === 'bucket');
    if (!bucket) {
      this.bot.chat(`[${this.bot.username}] Süt sağmak için boş kova (bucket) lazım!`);
      return;
    }

    const cow = Object.values(this.bot.entities).find(e => 
      e.name === 'cow' && this.bot.entity.position.distanceTo(e.position) <= 16
    );

    if (!cow) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda sağılacak inek yok.`);
      return;
    }

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(cow.position.x, cow.position.y, cow.position.z, 2));
      await this.bot.equip(bucket, 'hand');
      await this.bot.activateEntity(cow);
      this.bot.chat(`[${this.bot.username}] 🥛 Taze süt sağıldı!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Süt sağma hatası: ${err.message}`);
    }
  }
}

module.exports = FactoryEngine;
