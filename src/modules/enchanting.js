/**
 * ==============================================================================
 * ENCHANTING & ANVIL REPAIR ENGINE (src/modules/enchanting.js)
 * Enchanting table manipulation, lapis lazuli handling, and anvil item repairs.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class EnchantingEngine {
  constructor(bot) {
    this.bot = bot;
    this.isEnchanting = false;
  }

  // Find nearest enchanting table
  findEnchantingTable(maxDist = 16) {
    return this.bot.findBlock({
      matching: (b) => b && b.name === 'enchanting_table',
      maxDistance: maxDist
    });
  }

  // Find nearest anvil
  findAnvil(maxDist = 16) {
    return this.bot.findBlock({
      matching: (b) => b && (b.name === 'anvil' || b.name === 'chipped_anvil' || b.name === 'damaged_anvil'),
      maxDistance: maxDist
    });
  }

  // Automatically enchant chosen tool or weapon
  async enchantItem(itemKeyword = 'sword') {
    if (this.isEnchanting) return;
    const tableBlock = this.findEnchantingTable();

    if (!tableBlock) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda büyü masası (enchanting table) bulunamadı!`);
      return;
    }

    const targetItem = this.bot.inventory.items().find(i => i.name.includes(itemKeyword) && !i.name.includes('enchanted'));
    const lapis = this.bot.inventory.items().find(i => i.name === 'lapis_lazuli');

    if (!targetItem) {
      this.bot.chat(`[${this.bot.username}] Büyü basılacak uygun '${itemKeyword}' çantamda yok.`);
      return;
    }

    if (!lapis || lapis.count < 3) {
      this.bot.chat(`[${this.bot.username}] Büyü için en az 3 adet Lapis Lazuli gerekli!`);
      return;
    }

    this.isEnchanting = true;
    this.bot.chat(`[${this.bot.username}] 🔮 ${targetItem.name} için büyü masasına gidiyorum...`);

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(tableBlock.position.x, tableBlock.position.y, tableBlock.position.z, 2));
      const table = await this.bot.openEnchantmentTable(tableBlock);

      await table.putTargetItem(targetItem);
      await table.putLapis(lapis);

      // Select highest available enchantment tier (slot 2)
      await table.enchant(2);

      await table.takeTargetItem();
      table.close();

      this.isEnchanting = false;
      this.bot.chat(`[${this.bot.username}] ✨ ${targetItem.name} eşyasına başarıyla büyü basıldı!`);
    } catch (err) {
      this.isEnchanting = false;
      this.bot.chat(`[${this.bot.username}] Büyü basma hatası: ${err.message}`);
    }
  }

  // Repair damaged weapon/tool on an anvil
  async repairItem(itemKeyword = 'pickaxe') {
    const anvilBlock = this.findAnvil();
    if (!anvilBlock) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda örs (anvil) bulunamadı!`);
      return;
    }

    const damagedItems = this.bot.inventory.items().filter(i => 
      i.name.includes(itemKeyword) && i.durabilityUsed && i.durabilityUsed > 0
    );

    if (damagedItems.length < 2) {
      this.bot.chat(`[${this.bot.username}] Tamir etmek için aynı türden en az 2 adet hasarlı alet lazım.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] ⚒️ Örs üzerinde tamir işlemi yapılıyor...`);
    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(anvilBlock.position.x, anvilBlock.position.y, anvilBlock.position.z, 2));
      const anvil = await this.bot.openAnvil(anvilBlock);

      // Combine damaged items
      await anvil.combine(damagedItems[0], damagedItems[1]);
      anvil.close();
      this.bot.chat(`[${this.bot.username}] 🛠️ Eşyalar başarıyla birleştirilip tamir edildi!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Tamir hatası: ${err.message}`);
    }
  }
}

module.exports = EnchantingEngine;
