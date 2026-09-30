/**
 * Mining & Excavation Engine for Mineflayer
 * Vein mining, strip mining, torch placement, and ore detection.
 */
const { goals } = require('mineflayer-pathfinder');

class MiningEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.isMining = false;
  }

  equipBestPickaxe() {
    const items = this.bot.inventory.items();
    const pickaxes = items.filter(i => i.name.includes('pickaxe'));
    if (pickaxes.length === 0) return false;

    pickaxes.sort((a, b) => {
      const score = (name) => {
        if (name.includes('netherite')) return 6;
        if (name.includes('diamond')) return 5;
        if (name.includes('iron')) return 4;
        if (name.includes('stone')) return 2;
        return 1;
      };
      return score(b.name) - score(a.name);
    });

    this.bot.equip(pickaxes[0], 'hand').catch(() => {});
    return true;
  }

  placeTorchIfDark() {
    const pos = this.bot.entity.position;
    const block = this.bot.blockAt(pos);
    if (!block || block.light >= 7) return;

    const torch = this.bot.inventory.items().find(i => i.name.includes('torch'));
    if (!torch) return;

    const floor = this.bot.blockAt(pos.offset(0, -1, 0));
    if (floor && floor.boundingBox === 'block') {
      this.bot.equip(torch, 'hand').then(() => {
        this.bot.placeBlock(floor, { x: 0, y: 1, z: 0 }).catch(() => {});
      }).catch(() => {});
    }
  }

  // Recursive or BFS Vein Mining for continuous ore veins
  async mineVein(startingBlock, maxBlocks = 12) {
    if (!startingBlock) return;
    const oreName = startingBlock.name;
    const visited = new Set();
    const queue = [startingBlock.position];
    let minedCount = 0;

    this.bot.chat(`[${this.bot.username}] ${oreName} damarı bulundu, tamamını temizliyorum!`);

    while (queue.length > 0 && minedCount < maxBlocks) {
      const curPos = queue.shift();
      const key = `${curPos.x},${curPos.y},${curPos.z}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const target = this.bot.blockAt(curPos);
      if (!target || target.name !== oreName) continue;

      this.equipBestPickaxe();
      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(curPos.x, curPos.y, curPos.z, 2.5));
        await this.bot.dig(target);
        minedCount++;
        this.placeTorchIfDark();

        // Search adjacent 6 blocks for more ore
        const offsets = [
          [1, 0, 0], [-1, 0, 0],
          [0, 1, 0], [0, -1, 0],
          [0, 0, 1], [0, 0, -1]
        ];

        for (const [dx, dy, dz] of offsets) {
          const nextPos = curPos.offset(dx, dy, dz);
          const nextKey = `${nextPos.x},${nextPos.y},${nextPos.z}`;
          if (!visited.has(nextKey)) {
            const nextBlock = this.bot.blockAt(nextPos);
            if (nextBlock && nextBlock.name === oreName) {
              queue.push(nextPos);
            }
          }
        }
      } catch (err) {
        break;
      }
    }

    this.bot.chat(`[${this.bot.username}] Damar temizlendi, ${minedCount} adet ${oreName} kazıldı!`);
  }

  // Linear Strip Mining (tunnels)
  async stripMine(length = 10) {
    this.isMining = true;
    this.bot.chat(`[${this.bot.username}] ${length} blokluk tünel kazmaya başlıyorum...`);

    for (let i = 0; i < length; i++) {
      if (!this.isMining) break;
      const eyePos = this.bot.entity.position.offset(0, 1, 0);
      const forwardVec = this.bot.entity.position.clone();
      
      // Dig head level and feet level
      const headBlock = this.bot.blockAt(eyePos.offset(0, 0, 1));
      const feetBlock = this.bot.blockAt(eyePos.offset(0, -1, 1));

      this.equipBestPickaxe();
      if (headBlock && headBlock.boundingBox === 'block') {
        try { await this.bot.dig(headBlock); } catch (_) {}
      }
      if (feetBlock && feetBlock.boundingBox === 'block') {
        try { await this.bot.dig(feetBlock); } catch (_) {}
      }

      if (i % 5 === 0) this.placeTorchIfDark();
    }
    this.isMining = false;
    this.bot.chat(`[${this.bot.username}] Tünel kazısı tamamlandı!`);
  }
}

module.exports = MiningEngine;
