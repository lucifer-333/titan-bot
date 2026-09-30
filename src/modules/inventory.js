/**
 * Smart Inventory Management & Chest Interaction Engine for Mineflayer
 * Auto-sorting, chest dumping, trash clearing, and equipment optimization.
 */
class InventoryEngine {
  constructor(bot) {
    this.bot = bot;
  }

  // Dump all items or filtered items into the nearest chest
  async depositIntoChest(filter = null) {
    const chestBlock = this.bot.findBlock({
      matching: (b) => b && (b.name === 'chest' || b.name === 'trapped_chest' || b.name === 'barrel'),
      maxDistance: 16
    });

    if (!chestBlock) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda sandık veya varil bulamadım!`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] Sandığa doğru gidiyorum...`);
    try {
      await this.bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalNear)(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z, 2));
      const chest = await this.bot.openChest(chestBlock);
      const items = this.bot.inventory.items();

      let depositedCount = 0;
      for (const item of items) {
        // Don't deposit armor or weapons
        if (item.name.includes('sword') || item.name.includes('helmet') || item.name.includes('chestplate') || item.name.includes('boots')) continue;
        if (filter && !item.name.includes(filter)) continue;

        try {
          await chest.deposit(item.type, null, item.count);
          depositedCount++;
        } catch (_) {}
      }

      chest.close();
      this.bot.chat(`[${this.bot.username}] Sandığa ${depositedCount} çeşit ganimeti aktardım!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Sandık açma hatası: ${err.message}`);
    }
  }

  // Drop trash items when inventory is getting clogged
  async clearTrash() {
    const trashNames = ['rotten_flesh', 'poisonous_potato', 'spider_eye', 'dirt', 'gravel', 'diorite', 'andesite', 'granite'];
    const trashItems = this.bot.inventory.items().filter(i => trashNames.includes(i.name));

    if (trashItems.length === 0) {
      this.bot.chat(`[${this.bot.username}] Envanterimde gereksiz çöp yok reis.`);
      return;
    }

    for (const item of trashItems) {
      try {
        await this.bot.tossStack(item);
      } catch (_) {}
    }
    this.bot.chat(`[${this.bot.username}] Gereksiz çöpleri yere attım, yer açtım!`);
  }
}

module.exports = InventoryEngine;
