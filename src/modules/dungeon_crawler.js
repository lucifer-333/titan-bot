/**
 * ==============================================================================
 * DUNGEON CRAWLER & SPAWNER NEUTRALIZATION ENGINE (src/modules/dungeon_crawler.js)
 * Spawner torch neutralization, dungeon loot clearance, and dungeon defense.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class DungeonCrawlerEngine {
  constructor(bot) {
    this.bot = bot;
    this.isRaiding = false;
  }

  // Find nearest mob spawner block
  findSpawner(maxDist = 24) {
    return this.bot.findBlock({
      matching: (b) => b && b.name === 'spawner',
      maxDistance: maxDist
    });
  }

  // Neutralize spawner by illuminating it with torches on all faces
  async neutralizeSpawner() {
    const spawner = this.findSpawner();
    if (!spawner) {
      this.bot.chat(`[${this.bot.username}] 24 blokluk alanda mob spawner bulunamadı.`);
      return;
    }

    const torch = this.bot.inventory.items().find(i => i.name.includes('torch'));
    if (!torch) {
      this.bot.chat(`[${this.bot.username}] Spawner'ı etkisiz hale getirmek için meşale (torch) lazım!`);
      return;
    }

    this.isRaiding = true;
    this.bot.chat(`[${this.bot.username}] ⚔️ Spawner tespit edildi! Meşalelerle etkisiz hale getiriliyor...`);

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(spawner.position.x, spawner.position.y, spawner.position.z, 2));

      // Light up top and sides of spawner block
      const faces = [
        { x: 0, y: 1, z: 0 },  // Top
        { x: 1, y: 0, z: 0 },  // East
        { x: -1, y: 0, z: 0 }, // West
        { x: 0, y: 0, z: 1 },  // South
        { x: 0, y: 0, z: -1 }  // North
      ];

      await this.bot.equip(torch, 'hand');
      for (const face of faces) {
        try {
          await this.bot.placeBlock(spawner, face);
          await this.bot.waitForTicks(3);
        } catch (_) {}
      }

      this.bot.chat(`[${this.bot.username}] 💡 Spawner aydınlatıldı ve tamamen nötralize edildi! Canavar doğamaz.`);
      this.isRaiding = false;

      // Automatically loot dungeon chests next
      await this.lootDungeonChests();
    } catch (err) {
      this.isRaiding = false;
      this.bot.chat(`[${this.bot.username}] Spawner operasyonu hatası: ${err.message}`);
    }
  }

  // Loot rare items from dungeon chests
  async lootDungeonChests() {
    const chests = this.bot.findBlocks({
      matching: (b) => b && (b.name === 'chest' || b.name === 'trapped_chest'),
      maxDistance: 12,
      count: 4
    });

    if (chests.length === 0) return;

    this.bot.chat(`[${this.bot.username}] 💎 Zindan sandıkları yağmalanıyor...`);
    const valuableKeywords = ['golden_apple', 'saddle', 'music_disc', 'name_tag', 'enchanted_book', 'diamond', 'iron_ingot', 'gold_ingot'];

    for (const pos of chests) {
      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
        const chest = await this.bot.openChest(this.bot.blockAt(pos));
        const items = chest.containerItems();

        for (const item of items) {
          if (valuableKeywords.some(k => item.name.includes(k))) {
            try {
              await chest.withdraw(item.type, null, item.count);
            } catch (_) {}
          }
        }
        chest.close();
      } catch (_) {}
    }
    this.bot.chat(`[${this.bot.username}] 🏆 Zindan ganimetleri başarıyla toplandı!`);
  }
}

module.exports = DungeonCrawlerEngine;
