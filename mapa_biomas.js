/**
 * MAPA DE BIOMAS EXTENDIDO V5.1 (Fix Escala Cactus)
 * - Ajuste de escala para cactus (eran gigantes).
 */

import { seededRandom } from './utils.js';

export const Biomes = {
    types: {
        // --- VOLCÁNICO ---
        lava:        { name: "Magma",    color: 0xff4400, flora: null, emissive: true },
        
        // --- AGUA ---
        ocean:       { name: "Ocean",    color: 0x1a3355, flora: null },
        shallows:    { name: "Shallows", color: 0x226688, flora: 'water_lily' },
        
        // --- COSTA ---
        beach:       { name: "Beach",    color: 0xdccbba, flora: 'palm_coco' },
        
        // --- ÁRIDO / CALIENTE ---
        scorched:    { name: "Scorched", color: 0x553322, flora: 'dead' },
        desert:      { name: "Desert",   color: 0xe0cda0, flora: 'cactus_saguaro' },
        red_desert:  { name: "Red Desert", color: 0xc27e5c, flora: 'cactus_nopal' },
        savanna:     { name: "Savanna",  color: 0xaabb66, flora: 'acacia' },
        baobab_land: { name: "Drylands", color: 0x99aa55, flora: 'baobab' },
        
        // --- TROPICAL ---
        rainforest:  { name: "Jungle",   color: 0x115511, flora: 'bamboo_grove' },
        swamp:       { name: "Swamp",    color: 0x3b4f4f, flora: 'willow_weeping' },
        sugar_river: { name: "River Bank", color: 0x4b6f4f, flora: 'sugar_cane' },

        // --- TEMPLADO / LLANURAS ---
        canyon:      { name: "Canyon",   color: 0x995544, flora: 'shrub' },
        cliff:       { name: "Cliff",    color: 0x776655, flora: null },
        plains:      { name: "Plains",   color: 0x77cc77, flora: 'bush_berry' },
        mediterranean:{ name: "Mediterran", color: 0x889955, flora: 'olive' },
        
        // --- FLORES ---
        flower_field: { name: "Flower Field", color: 0x88dd88, flora: 'flower_mix' },
        sunflower_plains: { name: "Sun Plains", color: 0xaadd44, flora: 'sunflower' },

        // --- BOSQUES ---
        forest:      { name: "Forest",   color: 0x338844, flora: 'oak_classic' },
        birch_forest:{ name: "Birch Forest", color: 0x55aa66, flora: 'birch' },
        autumn_woods:{ name: "Autumn Woods", color: 0xd98c40, flora: 'maple' },
        cherry_grove:{ name: "Sakura Grove", color: 0xffb7c5, flora: 'sakura' },
        magic_forest:{ name: "Magic Forest", color: 0x663399, flora: 'jacaranda' },

        // --- MONTAÑA / FRÍO ---
        highlands:   { name: "Highland", color: 0x668855, flora: 'pine_nordic' },
        taiga:       { name: "Taiga",    color: 0x446655, flora: 'spruce_blue' },
        tundra:      { name: "Tundra",   color: 0xaaccbb, flora: 'bush_snow' },
        stone:       { name: "Stone",    color: 0x777777, flora: 'none' },
        snow:        { name: "Snow",     color: 0xffffff, flora: 'pine_nordic' } 
    },

    getBiomeData(y, moisture, isLavaZone) {
        if (isLavaZone) return this.types.lava;

        // --- AGUA (Reducido significativamente) ---
        if (y < -25) return this.types.ocean; 
        if (y < -2)  return this.types.shallows;
        if (y < 5)   return this.types.beach;

        // --- MONTAÑAS (Escala aumentada x2.5) ---
        if (y > 320) return this.types.snow; 
        
        if (y > 220) {
            if (moisture > 0.6) return this.types.taiga; 
            if (moisture > 0.3) return this.types.tundra;
            return this.types.stone; 
        }
        
        if (y > 140) {
            // Highlands
            if (moisture > 0.7) return this.types.highlands;
            if (moisture > 0.4) return this.types.autumn_woods;
            return this.types.cliff;
        }

        // --- TIERRAS MEDIAS ---
        // 1. ZONA ÁRIDA
        if (moisture < 0.15) return this.types.desert;
        if (moisture < 0.25) return this.types.red_desert;

        // 2. ZONA SECA
        if (moisture < 0.35) return this.types.scorched; 
        if (moisture < 0.45) return (Math.random() > 0.5) ? this.types.savanna : this.types.baobab_land; 

        // 3. ZONA TEMPLADA
        if (moisture < 0.55) return this.types.mediterranean;
        if (moisture < 0.60) return this.types.plains;
        if (moisture < 0.65) return this.types.sunflower_plains;

        // 4. ZONA FÉRTIL (Bosques Extensos)
        if (moisture < 0.70) return this.types.flower_field;
        if (moisture < 0.75) return this.types.birch_forest;
        if (moisture < 0.80) return this.types.forest;

        // 5. ZONA HÚMEDA
        if (moisture < 0.85) return this.types.cherry_grove;
        if (moisture < 0.90) return this.types.magic_forest;
        if (moisture < 0.95) return this.types.rainforest;
        
        return this.types.swamp;
    },

    getTreeConfig(biomeType) {
        const base = { growthType: 'recursive', colorBranch: [30,40], colorLeaf: [60,100], branchAngle: {min:0.5, max:0.8}, lengthDecay: 0.7, widthDecay: 0.7, gravity: 0, leafShape: 'circle', startLengthFactor: 0.25 };

        let floraKey = biomeType.flora;
        if (floraKey === 'flower_mix') {
            const flowers = ['tulip', 'dahlia', 'blue_aster', 'margarita', 'amapola_blanca', 'carnation', 'orchid'];
            floraKey = flowers[Math.floor(Math.random() * flowers.length)];
        }

        switch(floraKey) {
            case 'pine_nordic': return { ...base, growthType: 'conifer', colorBranch: [20, 30], colorLeaf: [140, 160], scale: 1.2 };
            case 'spruce_blue': return { ...base, growthType: 'conifer', colorBranch: [10, 20], colorLeaf: [170, 200], scale: 1.0 };
            
            case 'birch': return { ...base, colorBranch: [220, 240], colorLeaf: [70, 90], branchAngle: {min:0.2, max:0.4}, lengthDecay: 0.8, widthDecay: 0.6, gravity: 0.05, leafShape: 'circle', startLengthFactor: 0.25 };
            case 'maple': return { ...base, colorBranch: [20, 30], colorLeaf: [0, 20], branchAngle: {min:0.5, max:0.9}, lengthDecay: 0.75, widthDecay: 0.7, gravity: 0.02, leafShape: 'flower', startLengthFactor: 0.22 };
            
            case 'sakura': return { ...base, colorBranch: [10, 20], colorLeaf: [330, 350], branchAngle: {min:0.3, max:0.6}, lengthDecay: 0.8, widthDecay: 0.6, gravity: 0.02, leafShape: 'flower', startLengthFactor: 0.22 };
            case 'jacaranda': return { ...base, colorBranch: [20, 30], colorLeaf: [260, 290], branchAngle: {min:0.4, max:0.7}, lengthDecay: 0.75, widthDecay: 0.65, gravity: 0.03, leafShape: 'flower', startLengthFactor: 0.23 };
            
            case 'baobab': return { ...base, colorBranch: [35, 45], colorLeaf: [80, 100], branchAngle: {min:0.6, max:1.0}, lengthDecay: 0.6, widthDecay: 0.4, gravity: 0.01, leafShape: 'circle', startLengthFactor: 0.15 };
            case 'acacia': return { ...base, colorBranch: [30, 40], colorLeaf: [60, 80], branchAngle: {min:0.8, max:1.2}, lengthDecay: 0.7, widthDecay: 0.7, gravity: -0.02, leafShape: 'line', startLengthFactor: 0.2 };
            
            case 'olive': return { ...base, colorBranch: [40, 50], colorLeaf: [90, 110], branchAngle: {min:0.5, max:0.8}, lengthDecay: 0.7, widthDecay: 0.7, gravity: 0.08, leafShape: 'circle', startLengthFactor: 0.2 };
            
            case 'palm_coco': return { ...base, growthType: 'palm', colorBranch: [30, 45], colorLeaf: [70, 100], fruit: true, scale: 1.4 };
            case 'bamboo_grove': return { ...base, growthType: 'segmented', colorBranch: [80, 100], colorLeaf: [80, 120], clusterSize: 7, scale: 1.1 };
            case 'sugar_cane': return { ...base, growthType: 'segmented', colorBranch: [60, 80], colorLeaf: [70, 90], clusterSize: 12, widthDecay: true, scale: 0.6 };

            // CORRECCIÓN DE ESCALA: De 1.3 a 0.4 para que no sean rascacielos
            case 'cactus_saguaro': return { ...base, growthType: 'cactus', subType: 'saguaro', colorBranch: [0,0], colorLeaf: [0,0], scale: 0.4 };
            case 'cactus_nopal': return { ...base, growthType: 'cactus', subType: 'pad', colorBranch: [0,0], colorLeaf: [0,0], scale: 0.25 };

            case 'willow_weeping': return { ...base, colorBranch: [40, 50], colorLeaf: [70, 100], branchAngle: {min:0.2, max:0.5}, lengthDecay: 0.9, widthDecay: 0.8, gravity: 0.2, leafShape: 'line', startLengthFactor: 0.20 };
            
            case 'bush_berry': return { ...base, growthType: 'bush', colorBranch: [20, 30], colorLeaf: [50, 80], scale: 0.4, leafShape: 'circle' };
            case 'shrub': return { ...base, colorBranch: [40,50], colorLeaf: [50,70], branchAngle: {min:0.5, max:1.0}, lengthDecay: 0.5, widthDecay: 0.5, gravity: 0.1, leafShape: 'circle', startLengthFactor: 0.1 };
            case 'dead': return { ...base, colorBranch: [30,40], colorLeaf: [0,0], branchAngle: {min:0.5, max:1.2}, lengthDecay: 0.8, widthDecay: 0.6, gravity: 0.1, leafShape: 'none', startLengthFactor: 0.2 };

            case 'water_lily': return { ...base, growthType: 'floating', colorLeaf: [100, 140], hasFlower: true, scale: 1.0 };
            
            case 'sunflower': return { type: 'flower', petalCount: 400, centerRatio: 0.3, spread: 6, colorPetal: [45, 60], colorCenter: [20, 30], petalShape: 'pointed', petalWidth: 1.5, petalBend: [-0.1, 0.1], petalSat: 85, petalLit: 55 };
            case 'tulip': return { type: 'flower', petalCount: 6, centerRatio: 0.1, spread: 3.0, colorPetal: [330, 360], colorCenter: [50, 60], petalShape: 'round', petalWidth: 2.2, petalSat: 80, petalLit: 50, petalBend: [-1.0, -0.6] };
            case 'dahlia': return { type: 'flower', petalCount: 600, centerRatio: 0.05, spread: 4, colorPetal: [300, 340], colorCenter: [50, 60], petalShape: 'round', petalWidth: 2.5, petalBend: [0.2, 0.5], petalSat: 70, petalLit: 60 };
            case 'blue_aster': return { type: 'flower', petalCount: 200, centerRatio: 0.2, spread: 7, colorPetal: [200, 240], colorCenter: [40, 50], petalShape: 'thin', petalWidth: 0.5, petalBend: [-0.05, 0.05], petalSat: 65, petalLit: 70 };
            case 'amapola_blanca': return { type: 'flower', petalCount: 6, centerRatio: 0.15, spread: 4, colorPetal: [0, 0], colorCenter: [50, 60], petalShape: 'round', petalWidth: 2.5, petalSat: 5, petalLit: 90, petalBend: [-0.3, 0.1] };
            case 'margarita': return { type: 'flower', petalCount: 25, centerRatio: 0.25, spread: 4.5, colorPetal: [0, 0], colorCenter: [45, 55], petalShape: 'thin', petalWidth: 0.8, petalSat: 0, petalLit: 98, petalBend: [0.0, 0.05] };
            case 'carnation': return { type: 'flower', petalCount: 40, centerRatio: 0.1, spread: 3.5, colorPetal: [350, 10], colorCenter: [0, 0], petalShape: 'round', petalWidth: 1.2, petalSat: 80, petalLit: 50, petalBend: [-0.5, 0.5] };
            case 'orchid': return { type: 'flower', petalCount: 5, centerRatio: 0.1, spread: 5, colorPetal: [280, 310], colorCenter: [330, 350], petalShape: 'pointed', petalWidth: 1.8, petalSat: 60, petalLit: 70, petalBend: [-0.2, 0.1] };

            default: return base;
        }
    }
};