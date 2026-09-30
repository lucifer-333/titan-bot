/**
 * ==============================================================================
 * SMART WAREHOUSE & CHEST CATEGORIZATION ENGINE (src/modules/warehouse.js)
 * Autonomous inventory sorting, multi-chest item routing, and depot organization.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class WarehouseEngine {
  constructor(bot) {
    this.bot = bot;
    this.isSorting = false;
    this.chestCategories = {
      ores: ['raw_iron', 'raw_copper', 'raw_gold', 'iron_ingot', 'gold_ingot', 'diamond', 'emerald', 'coal', 'redstone', 'lapis_lazuli', 'netherite_ingot'],
      blocks: ['dirt', 'cobblestone', 'stone', 'deepslate', 'andesite', 'diorite', 'granite', 'gravel', 'sand', 'oak_planks', 'spruce_planks', 'birch_planks'],
      food: ['bread', 'cooked_beef', 'cooked_porkchop', 'cooked_mutton', 'cooked_chicken', 'apple', 'carrot', 'potato', 'golden_apple', 'wheat'],
      combat: ['sword', 'axe', 'bow', 'crossbow', 'arrow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots', 'totem_of_undying']
    };
  }

  // Categorize a single item
  getItemCategory(itemName) {
    for (const [cat, list] of Object.entries(this.chestCategories)) {
      if (list.some(k => itemName.includes(k))) return cat;
    }
    return 'misc';
  }

  // Find all nearby chests within range
  findNearbyChests(maxDist = 20) {
    return this.bot.findBlocks({
      matching: (b) => b && (b.name === 'chest' || b.name === 'trapped_chest' || b.name === 'barrel'),
      maxDistance: maxDist,
      count: 12
    });
  }

  // Sort and deposit inventory into specialized chests
  async organizeAndDeposit() {
    if (this.isSorting) return;
    const chestPositions = this.findNearbyChests();

    if (chestPositions.length === 0) {
      this.bot.chat(`[${this.bot.username}] 20 blokluk alanda hiçbir sandık veya varil bulunamadı!`);
      return;
    }

    this.isSorting = true;
    this.bot.chat(`[${this.bot.username}] 📦 Depo yönetimi başlatıldı (${chestPositions.length} sandık inceleniyor)...`);

    for (let i = 0; i < chestPositions.length; i++) {
      const pos = chestPositions[i];
      const chestBlock = this.bot.blockAt(pos);
      if (!chestBlock) continue;

      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
        const chest = await this.bot.openChest(chestBlock);

        // Inspect what items this chest already stores to maintain category integrity
        const existingItems = chest.containerItems();
        const dominantCategory = existingItems.length > 0 ? this.getItemCategory(existingItems[0].name) : null;

        // Deposit matching inventory items
        const myItems = this.bot.inventory.items();
        for (const item of myItems) {
          // Never deposit active armor or equipped weapon
          if (item.name.includes('sword') && item.slot === this.bot.quickBarSlot + 36) continue;

          const itemCat = this.getItemCategory(item.name);
          const shouldDeposit = dominantCategory ? (itemCat === dominantCategory) : true;

          if (shouldDeposit) {
            try {
              await chest.deposit(item.type, null, item.count);
            } catch (_) {}
          }
        }

        chest.close();
      } catch (err) {}
    }

    this.isSorting = false;
    this.bot.chat(`[${this.bot.username}] ✅ Eşyalar kategorilerine göre sandıklara akıllıca yerleştirildi!`);
  }
}

module.exports = WarehouseEngine;
