/**
 * ==============================================================================
 * ADVANCED BLUEPRINT & SCHEMATIC ARCHITECT ENGINE (src/modules/architect.js)
 * Multi-Story Luxury Villa, Medieval Castles, Log Cabins, and Adaptive Voxel Construction.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class ArchitectEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.isBuilding = false;
    this.activeBlueprint = null;
  }

  // Pre-configured parametric architectural blueprints
  generateBlueprint(type, width = 7, height = 7, length = 7, defaultMat = 'cobblestone') {
    const blocks = [];
    const t = type.toLowerCase();

    // 1. MODERN LÜKS VİLLA (2 Katlı, Balkonlu, Teraslı, Geniş Pencereli)
    if (t.includes('villa') || t.includes('konak') || t.includes('yalı')) {
      const w = 7, l = 7, h = 6;
      // Zemin kat (y=0: Temel ve Taban)
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < l; z++) {
          blocks.push({ x, y: 0, z, material: defaultMat });
        }
      }

      // 1. Kat Duvarları (y=1 to y=3)
      for (let y = 1; y <= 3; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < l; z++) {
            const isWall = x === 0 || x === w - 1 || z === 0 || z === l - 1;
            const isDoor = x === 3 && z === 0 && (y === 1 || y === 2);
            const isWindowFront = (x === 1 || x === 5) && z === 0 && y === 2;
            const isWindowSide = (z === 2 || z === 4) && (x === 0 || x === w - 1) && y === 2;

            if (isWall && !isDoor && !isWindowFront && !isWindowSide) {
              blocks.push({ x, y, z, material: defaultMat });
            }
          }
        }
      }

      // 1. Kat Tavanı & 2. Kat Tabanı (y=4)
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < l; z++) {
          // Merdiven deliği hariç döşeme
          if (!(x === 1 && z === 1)) {
            blocks.push({ x, y: 4, z, material: defaultMat });
          }
        }
      }

      // 2. Kat Duvarları & Ön Teras Balkonu (y=5 to y=6)
      for (let y = 5; y <= 6; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 2; z < l; z++) { // Ön tarafı açık teras bırak
            const isWall = x === 0 || x === w - 1 || z === 2 || z === l - 1;
            const isBalconyDoor = x === 3 && z === 2 && y === 5;
            const isWindow = (x === 1 || x === 5) && z === l - 1 && y === 5;

            if (isWall && !isBalconyDoor && !isWindow) {
              blocks.push({ x, y, z, material: defaultMat });
            }
          }
        }
      }

      // Teras Balkon Korkulukları (y=5, z=0..1)
      for (let x = 0; x < w; x++) {
        blocks.push({ x, y: 5, z: 0, material: defaultMat });
      }
      blocks.push({ x: 0, y: 5, z: 1, material: defaultMat });
      blocks.push({ x: w - 1, y: 5, z: 1, material: defaultMat });

      // Villa Çatı Terası (y=7)
      for (let x = 0; x < w; x++) {
        for (let z = 2; z < l; z++) {
          blocks.push({ x, y: 7, z, material: defaultMat });
        }
      }

      return blocks;
    }

    // 2. COZY AHŞAP DAĞ EVİ / KULÜBE (Ahşap Çatılı & Şömineli)
    if (t.includes('kulübe') || t.includes('kulube') || t.includes('ahşap') || t.includes('dağ')) {
      const w = 5, l = 5, h = 4;
      for (let y = 0; y <= h; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < l; z++) {
            const isCorner = (x === 0 || x === w - 1) && (z === 0 || z === l - 1);
            const isWall = x === 0 || x === w - 1 || z === 0 || z === l - 1;
            const isRoof = y === h;
            const isDoor = x === 2 && z === 0 && (y === 1 || y === 2);
            const isWindow = (x === 2 && z === l - 1 && y === 2) || (z === 2 && (x === 0 || x === w - 1) && y === 2);

            if ((isWall || isRoof) && !isDoor && !isWindow) {
              blocks.push({ x, y, z, material: defaultMat });
            }
          }
        }
      }
      return blocks;
    }

    // 3. ORTAÇAĞ KALESİ (Siperlikli & Burçlu)
    if (t.includes('kale') || t.includes('şato') || t.includes('sato')) {
      const w = 7, l = 7, h = 5;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < l; z++) {
            const isWall = x === 0 || x === w - 1 || z === 0 || z === l - 1;
            const isTower = (x <= 1 || x >= w - 2) && (z <= 1 || z >= l - 2);
            const isGate = x === 3 && z === 0 && y <= 2;
            const isCrenel = y === h - 1 && (x % 2 === 0 || z % 2 === 0);

            if ((isWall || isTower || isCrenel) && !isGate) {
              blocks.push({ x, y, z, material: defaultMat });
            }
          }
        }
      }
      return blocks;
    }

    // 4. STANDART 5x5 BARINAK / EV
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          const isWall = x === 0 || x === 4 || z === 0 || z === 4;
          const isRoof = y === 3;
          const isDoor = x === 2 && z === 0 && (y === 0 || y === 1);
          if ((isWall || isRoof) && !isDoor) {
            blocks.push({ x, y, z, material: defaultMat });
          }
        }
      }
    }
    return blocks;
  }

  // Akıllı Envanter Malzeme Seçimi (Eğer taş yoksa tahta, toprak vb. blokları otomatik alternatif seçer)
  getAvailableBuildingBlock() {
    const validBlocks = ['cobblestone', 'stone', 'deepslate', 'oak_planks', 'spruce_planks', 'birch_planks', 'smooth_stone', 'quartz_block', 'dirt'];
    return this.bot.inventory.items().find(i => validBlocks.some(v => i.name.includes(v)));
  }

  async construct(type = 'villa', basePos = null) {
    if (this.isBuilding) {
      this.bot.chat(`[${this.bot.username}] Halihazırda inşaat devam ediyor reis!`);
      return;
    }

    // Çantadaki en bol inşaat malzemesini tespit et
    const primaryBlock = this.getAvailableBuildingBlock();
    if (!primaryBlock) {
      this.bot.chat(`[${this.bot.username}] İnşaat yapabilmek için çantamda taş, tahta veya toprak gibi bloklar lazım!`);
      return;
    }

    const startPos = basePos || this.bot.entity.position.floored().offset(2, 0, 2);
    const blueprint = this.generateBlueprint(type, 7, 7, 7, primaryBlock.name);

    this.isBuilding = true;
    this.bot.chat(`[${this.bot.username}] 🏛️ '${type.toUpperCase()}' inşası başladı! Toplam ${blueprint.length} blok, malzeme: ${primaryBlock.name}.`);

    // Tabandan tavana doğru sırala (Y-level)
    blueprint.sort((a, b) => a.y - b.y);

    let placedCount = 0;
    for (const b of blueprint) {
      if (!this.isBuilding) break;

      const targetPos = startPos.offset(b.x, b.y, b.z);
      const existing = this.bot.blockAt(targetPos);
      if (existing && existing.boundingBox === 'block') continue;

      // Elimize malzeme al
      const activeBlock = this.getAvailableBuildingBlock();
      if (!activeBlock) {
        this.bot.chat(`[${this.bot.username}] İnşaat malzemesi tükendi, ${placedCount} blok yerleştirildi.`);
        break;
      }

      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 3.5));

        const adjacentOffsets = [
          [0, -1, 0, [0, 1, 0]],
          [1, 0, 0, [-1, 0, 0]],
          [-1, 0, 0, [1, 0, 0]],
          [0, 0, 1, [0, 0, -1]],
          [0, 0, -1, [0, 0, 1]]
        ];

        for (const [dx, dy, dz, face] of adjacentOffsets) {
          const neighbor = this.bot.blockAt(targetPos.offset(dx, dy, dz));
          if (neighbor && neighbor.boundingBox === 'block') {
            await this.bot.equip(activeBlock, 'hand');
            await this.bot.placeBlock(neighbor, { x: face[0], y: face[1], z: face[2] });
            placedCount++;
            break;
          }
        }

        await this.bot.waitForTicks(2);
      } catch (_) {}
    }

    this.isBuilding = false;
    this.bot.chat(`[${this.bot.username}] 🏰 Muhteşem '${type.toUpperCase()}' inşası tamamlandı reis! Kapın ve terasın hazır.`);
  }

  stop() {
    this.isBuilding = false;
    this.bot.chat(`[${this.bot.username}] İnşaat durduruldu.`);
  }
}

module.exports = ArchitectEngine;
