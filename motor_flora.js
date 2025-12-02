/**
 * MOTOR FLORA 3D - MULTI-BIOMA V3 (Fusión Completa)
 * Soporta: Árboles Recursivos, Coníferas, Cactáceas, Palmeras, Acuáticas y FLORES LOW POLY.
 */

import * as THREE from 'three';
import { seededRandomRange, seededRandom, toCartesian } from './utils.js';

export const Flora3D = {
    animatedBranches: [],

    // --- CONSTRUCTOR DE VEGETACIÓN GENERAL (Árboles, Cactus, etc) ---
    build: (group, config, seed) => {
        Flora3D.animatedBranches = [];

        const growthType = config.growthType || 'recursive'; 

        // Materiales Base
        const hueBark = seededRandomRange(config.colorBranch[0], config.colorBranch[1]);
        const barkMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${hueBark}, 40%, 30%)`, 
            roughness: 1.0, flatShading: true 
        });

        const hueLeaf = seededRandomRange(config.colorLeaf[0], config.colorLeaf[1]);
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${hueLeaf}, 60%, 45%)`, 
            roughness: 0.8, flatShading: true, side: THREE.DoubleSide 
        });

        const rootGroup = new THREE.Group();
        group.add(rootGroup);

        switch (growthType) {
            case 'conifer':
                buildConifer(rootGroup, config, seed, barkMat, leafMat);
                break;
            case 'segmented':
                buildSegmented(rootGroup, config, seed, barkMat, leafMat);
                break;
            case 'palm':
                buildPalm(rootGroup, config, seed, barkMat, leafMat);
                break;
            case 'cactus':
                buildCactus(rootGroup, config, seed, barkMat); 
                break;
            case 'floating': 
                buildFloating(rootGroup, config, seed, leafMat, config.flowerColor);
                break;
            case 'bush':
                buildBush(rootGroup, config, seed, barkMat, leafMat);
                break;
            case 'recursive':
            default:
                const baseH = 200 * (config.scale || 1.0);
                const sLen = baseH * (config.startLengthFactor || 0.25);
                const sWid = sLen * 0.18;
                growRecursive(rootGroup, null, sLen, sWid, 0, 4, config, seed, barkMat, leafMat);
                break;
        }

        group.userData.floraEngine = Flora3D;
    },

    // --- CONSTRUCTOR DE FLORES (RESTAURADO & LOW POLY) ---
    buildFlower: (group, config, seed) => {
        Flora3D.animatedBranches = []; 

        const { 
            petalCount, spread, colorPetal, colorCenter, 
            petalShape, petalWidth, centerRatio,
            petalSat, petalLit, petalBend
        } = config;

        // 1. MATERIALES LOW POLY
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.9, flatShading: true });
        
        const hueCenter = seededRandomRange(colorCenter[0], colorCenter[1]);
        const centerMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${hueCenter}, 80%, 40%)`, 
            roughness: 1.0,
            flatShading: true 
        });
        
        const huePetal = seededRandomRange(colorPetal[0], colorPetal[1]);
        const sat = petalSat !== undefined ? petalSat : 70;
        const lit = petalLit !== undefined ? petalLit : 60;

        const petalMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${huePetal}, ${sat}%, ${lit}%)`, 
            roughness: 0.6, 
            flatShading: true, 
            side: THREE.DoubleSide 
        });

        // 2. TALLO (Prisma Hexagonal - Low Poly)
        const stemHeight = 60 + seededRandom() * 40;
        const stemGeo = new THREE.CylinderGeometry(2, 3, stemHeight, 5); 
        stemGeo.translate(0, stemHeight / 2, 0);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.castShadow = true;
        group.add(stem);

        // 3. CABEZA
        const headGroup = new THREE.Group();
        headGroup.position.y = stemHeight;
        headGroup.rotation.x = seededRandomRange(0.2, 0.4); 
        headGroup.rotation.z = seededRandomRange(-0.1, 0.1);
        group.add(headGroup);

        // 4. CENTRO (Icosaedro - Look de Gema/Cristal)
        const centerSize = (spread * 1.5) * centerRatio + 4;
        const centerGeo = new THREE.IcosahedronGeometry(centerSize, 0); 
        centerGeo.scale(1, 0.6, 1);
        const centerMesh = new THREE.Mesh(centerGeo, centerMat);
        centerMesh.castShadow = true;
        headGroup.add(centerMesh);

        // 5. PÉTALOS (Geometría Base Optimizada)
        const goldenAngle = 137.5 * (Math.PI / 180);
        let basePetalGeo;

        if (petalShape === 'pointed') {
            basePetalGeo = new THREE.ConeGeometry(1, 1, 4); 
            basePetalGeo.translate(0, 0.5, 0); 
            basePetalGeo.rotateX(-Math.PI/2);  
            basePetalGeo.scale(1, 0.1, 1);     
        } else if (petalShape === 'thin') {
            basePetalGeo = new THREE.BoxGeometry(1, 1, 0.1);
            basePetalGeo.translate(0, 0.5, 0); 
        } else { // round
            basePetalGeo = new THREE.IcosahedronGeometry(1, 0);
            basePetalGeo.translate(0, 1, 0); 
            basePetalGeo.scale(1, 1, 0.15);
        }

        const renderCount = Math.min(petalCount, 300);
        const bendMin = petalBend ? petalBend[0] : -0.2;
        const bendMax = petalBend ? petalBend[1] : 0.1;

        for (let i = 0; i < renderCount; i++) {
            const angle = i * goldenAngle;
            // Corrección de radio para evitar flotación
            const distFactor = Math.sqrt(i);
            const radius = (spread * 0.55) * distFactor + (centerSize * 0.4); 
            
            const { x, y } = toCartesian(radius, angle);
            
            const petal = new THREE.Mesh(basePetalGeo, petalMat);
            petal.position.set(x, 0, y);
            
            const size = (i / renderCount) * seededRandomRange(4, 6) + 3;
            const w = size * (petalWidth || 1);
            const l = size * 2.8;
            petal.scale.set(w, l, w);

            petal.lookAt(0, 0, 0);
            petal.rotateY(Math.PI); // Girar para mirar al centro
            petal.rotateX(seededRandomRange(bendMin, bendMax)); // Curvatura

            petal.position.y = seededRandomRange(-0.2, 0.2); // Z-fighting fix

            petal.castShadow = true;
            petal.receiveShadow = true;
            headGroup.add(petal);
        }
        
        Flora3D.animatedBranches.push(headGroup);
        headGroup.userData = { baseRotX: headGroup.rotation.x, baseRotZ: headGroup.rotation.z, seed: seed, depth: 1 };
    },

    update: (time) => {
        const windStrength = 0.002;
        const windSpeed = 0.001;
        const count = Flora3D.animatedBranches.length;
        if (count === 0) return;

        for(let i = 0; i < count; i++) {
            const branch = Flora3D.animatedBranches[i];
            const depth = branch.userData.depth || 0;
            const seed = branch.userData.seed || 0;
            const noiseX = Math.sin(time * windSpeed + seed) * windStrength * depth;
            const noiseZ = Math.cos(time * windSpeed * 0.8 + seed) * windStrength * depth;
            branch.rotation.x = branch.userData.baseRotX + noiseX;
            branch.rotation.z = branch.userData.baseRotZ + noiseZ;
        }
    }
};

// ==========================================
// ALGORITMOS DE ÁRBOLES Y BIOMAS
// ==========================================

function buildConifer(group, config, seed, barkMat, leafMat) {
    const height = 200 * (config.scale || 1);
    const trunkWidth = height * 0.05;
    const trunkGeo = new THREE.CylinderGeometry(trunkWidth * 0.2, trunkWidth, height, 5);
    trunkGeo.translate(0, height/2, 0);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.castShadow = true;
    group.add(trunk);

    const tiers = 12; 
    for(let i=1; i<tiers; i++) {
        const t = i / tiers; 
        const yPos = t * height * 0.9 + (height * 0.1); 
        const currentSpread = (1 - t) * (height * 0.35); 
        const branchCount = 5 + Math.floor(seededRandom() * 3);
        
        for(let b=0; b<branchCount; b++) {
            const angle = (b / branchCount) * Math.PI * 2 + (t); 
            const branchGroup = new THREE.Group();
            branchGroup.position.set(0, yPos, 0);
            branchGroup.rotation.y = angle;
            branchGroup.rotation.z = Math.PI/2 + 0.2 + (t * 0.3); 

            const bLen = currentSpread * seededRandomRange(0.8, 1.2);
            const bGeo = new THREE.CylinderGeometry(trunkWidth*0.2, trunkWidth*0.3, bLen, 3);
            bGeo.translate(0, bLen/2, 0);
            const branchMesh = new THREE.Mesh(bGeo, barkMat);
            branchGroup.add(branchMesh);

            const foliage = new THREE.Mesh(new THREE.ConeGeometry(trunkWidth*1.5, bLen*0.8, 4), leafMat);
            foliage.position.y = bLen * 0.5;
            foliage.scale.set(1, 1, 0.5); 
            branchGroup.add(foliage);

            trunk.add(branchGroup);
            branchGroup.userData = { baseRotX: branchGroup.rotation.x, baseRotZ: branchGroup.rotation.z, depth: 2, seed: seed+i+b };
            Flora3D.animatedBranches.push(branchGroup);
        }
    }
}

function buildSegmented(group, config, seed, barkMat, leafMat) {
    const stems = config.clusterSize || 5; 
    const heightBase = 150 * (config.scale || 1);
    
    for(let s=0; s<stems; s++) {
        const stemGroup = new THREE.Group();
        const offsetX = seededRandomRange(-20, 20);
        const offsetZ = seededRandomRange(-20, 20);
        stemGroup.position.set(offsetX, 0, offsetZ);
        stemGroup.rotation.x = seededRandomRange(-0.1, 0.1);
        stemGroup.rotation.z = seededRandomRange(-0.1, 0.1);

        const segments = 8;
        const segLen = heightBase / segments;
        const width = config.widthDecay ? heightBase * 0.02 : 3; 

        let currentY = 0;
        const isGreen = config.colorBranch[0] > 60 && config.colorBranch[0] < 150;
        const stemMat = isGreen ? new THREE.MeshStandardMaterial({ color: leafMat.color, roughness: 0.6 }) : barkMat;

        for(let i=0; i<segments; i++) {
            const geo = new THREE.CylinderGeometry(width*0.9, width, segLen, 5);
            geo.translate(0, segLen/2, 0);
            const segMesh = new THREE.Mesh(geo, stemMat);
            segMesh.position.y = currentY;
            stemGroup.add(segMesh);

            const nodeGeo = new THREE.TorusGeometry(width*0.95, width*0.1, 4, 6);
            nodeGeo.rotateX(Math.PI/2);
            const node = new THREE.Mesh(nodeGeo, stemMat);
            node.position.y = currentY + segLen;
            stemGroup.add(node);

            if (i > segments * 0.4) {
                const leafCount = 2;
                for(let l=0; l<leafCount; l++) {
                    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(width*1.5, segLen*0.8), leafMat);
                    leaf.position.y = currentY + segLen;
                    leaf.rotation.y = Math.random() * Math.PI * 2;
                    leaf.rotation.z = Math.PI / 4;
                    leaf.rotation.x = 0.5;
                    stemGroup.add(leaf);
                }
            }
            currentY += segLen;
        }
        stemGroup.userData = { baseRotX: stemGroup.rotation.x, baseRotZ: stemGroup.rotation.z, depth: 3, seed: seed+s };
        Flora3D.animatedBranches.push(stemGroup);
        group.add(stemGroup);
    }
}

function buildPalm(group, config, seed, barkMat, leafMat) {
    const height = 180 * (config.scale || 1);
    const width = height * 0.04;
    const segs = 10;
    const segLen = height / segs;
    let currentY = 0;
    let curve = 0;
    
    const trunkGroup = new THREE.Group();
    group.add(trunkGroup);

    for(let i=0; i<segs; i++) {
        const t = i/segs;
        const geo = new THREE.CylinderGeometry(width*(1-t*0.3), width*(1-(t-0.1)*0.3), segLen, 7);
        geo.translate(0, segLen/2, 0);
        
        const mesh = new THREE.Mesh(geo, barkMat);
        mesh.position.y = currentY;
        mesh.position.x = curve;
        mesh.rotation.z = -t * 0.5; 
        
        trunkGroup.add(mesh);
        
        currentY += Math.cos(t*0.5) * segLen;
        curve += Math.sin(t*0.5) * segLen;
    }

    const topGroup = new THREE.Group();
    topGroup.position.set(curve, currentY, 0);
    topGroup.rotation.z = -0.5; 
    trunkGroup.add(topGroup);

    if (config.fruit) {
        const cocoGeo = new THREE.SphereGeometry(width*1.5, 6, 6);
        const cocoMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
        for(let i=0; i<3; i++) {
            const coco = new THREE.Mesh(cocoGeo, cocoMat);
            coco.position.set(Math.sin(i*2)*width*2, -width, Math.cos(i*2)*width*2);
            topGroup.add(coco);
        }
    }

    const frondCount = 12; 
    for(let i=0; i<frondCount; i++) {
        const frondGroup = new THREE.Group();
        frondGroup.rotation.y = (i / frondCount) * Math.PI * 2;
        
        const frondLen = height * 0.6;
        const stemGeo = new THREE.BoxGeometry(width*0.5, frondLen, width*0.1);
        stemGeo.translate(0, frondLen/2, 0);
        
        const frondMesh = new THREE.Mesh(stemGeo, leafMat);
        frondGroup.rotation.x = Math.PI / 4 + (Math.random()*0.2); 
        
        frondGroup.add(frondMesh);
        
        const leaflets = 8;
        for(let l=0; l<leaflets; l++) {
            const lt = l/leaflets;
            const leaflet = new THREE.Mesh(new THREE.PlaneGeometry(frondLen*0.4, width*2), leafMat);
            leaflet.position.y = lt * frondLen;
            leaflet.rotation.x = Math.PI/2;
            leaflet.rotation.z = Math.PI/6;
            frondMesh.add(leaflet);
        }

        topGroup.add(frondGroup);
        frondGroup.userData = { baseRotX: frondGroup.rotation.x, baseRotZ: frondGroup.rotation.z, depth: 2, seed: seed+i };
        Flora3D.animatedBranches.push(frondGroup);
    }
}

function buildCactus(group, config, seed, mat) {
    const type = config.subType || 'saguaro'; 
    const height = 120 * (config.scale || 1);
    const width = height * 0.15;
    
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x558844, roughness: 0.9, flatShading: true });

    if (type === 'pad') {
        const buildPad = (parent, x, y, z, scale, depth) => {
            if (depth > 4) return;
            const padGeo = new THREE.CylinderGeometry(width*scale, width*scale*0.8, width*scale*0.2, 8);
            padGeo.rotateX(Math.PI/2); 
            padGeo.scale(1, 1.5, 1); 
            
            const pad = new THREE.Mesh(padGeo, cactusMat);
            pad.position.set(x, y, z);
            pad.rotation.z = seededRandomRange(-0.5, 0.5);
            pad.rotation.y = seededRandomRange(-0.5, 0.5);
            parent.add(pad);

            if (depth > 2 && Math.random() > 0.7) {
                const fruit = new THREE.Mesh(new THREE.SphereGeometry(width*0.2, 4, 4), new THREE.MeshBasicMaterial({color: 0xff3366}));
                fruit.position.y = width*scale*0.8;
                pad.add(fruit);
            }

            const count = Math.floor(seededRandomRange(1, 3.5));
            for(let i=0; i<count; i++) {
                const angle = seededRandomRange(-1, 1);
                const nx = Math.sin(angle) * width * scale * 0.8;
                const ny = Math.cos(angle) * width * scale * 0.8;
                buildPad(pad, nx, ny + (width*scale*0.8), 0, scale * 0.85, depth + 1);
            }
        };
        buildPad(group, 0, width, 0, 1.0, 0);

    } else {
        const trunkGeo = new THREE.CylinderGeometry(width, width*0.9, height, 7);
        trunkGeo.translate(0, height/2, 0);
        const trunk = new THREE.Mesh(trunkGeo, cactusMat);
        group.add(trunk);

        const arms = Math.floor(seededRandomRange(1, 5));
        for(let i=0; i<arms; i++) {
            const hPos = seededRandomRange(height*0.3, height*0.7);
            const armLen = seededRandomRange(height*0.2, height*0.5);
            const armGroup = new THREE.Group();
            armGroup.position.set(0, hPos, 0);
            armGroup.rotation.y = seededRandomRange(0, Math.PI*2);
            
            const elbowGeo = new THREE.CylinderGeometry(width*0.8, width*0.8, width*2, 6);
            elbowGeo.translate(0, width, 0);
            elbowGeo.rotateZ(Math.PI/2);
            armGroup.add(new THREE.Mesh(elbowGeo, cactusMat));

            const upGeo = new THREE.CylinderGeometry(width*0.7, width*0.8, armLen, 6);
            upGeo.translate(width, width + armLen/2, 0);
            armGroup.add(new THREE.Mesh(upGeo, cactusMat));

            trunk.add(armGroup);
        }
    }
}

function buildFloating(group, config, seed, leafMat, flowerColor) {
    const size = 30 * (config.scale || 1);
    
    const padShape = new THREE.Shape();
    padShape.absarc(0, 0, size, 0.2, Math.PI * 2 - 0.2, false);
    padShape.lineTo(0,0);
    
    const padGeo = new THREE.ShapeGeometry(padShape);
    padGeo.rotateX(-Math.PI/2);
    
    const pad = new THREE.Mesh(padGeo, leafMat);
    pad.position.y = 1; 
    group.add(pad);

    if (config.hasFlower) {
        const flowerGroup = new THREE.Group();
        flowerGroup.position.y = 1;
        const fMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(seededRandomRange(300, 360)/360, 0.7, 0.6),
            side: THREE.DoubleSide 
        });
        const petals = 8;
        for(let i=0; i<petals; i++) {
            const petal = new THREE.Mesh(new THREE.SphereGeometry(size*0.3, 4, 4), fMat);
            petal.scale.set(0.5, 1, 0.2);
            petal.position.y = size * 0.2;
            const pivot = new THREE.Group();
            pivot.rotation.y = (i/petals) * Math.PI * 2;
            pivot.add(petal);
            petal.rotation.x = Math.PI/4;
            flowerGroup.add(pivot);
        }
        group.add(flowerGroup);
    }
}

function buildBush(group, config, seed, barkMat, leafMat) {
    const size = 40 * (config.scale || 1);
    const stems = 5;
    for(let i=0; i<stems; i++) {
        const angleX = seededRandomRange(-0.5, 0.5);
        const angleZ = seededRandomRange(-0.5, 0.5);
        const stemGroup = new THREE.Group();
        stemGroup.rotation.set(angleX, 0, angleZ);
        group.add(stemGroup);
        growRecursive(stemGroup, null, size, size*0.1, 0, 3, config, seed+i, barkMat, leafMat);
    }
}

function growRecursive(parentGroup, pos, len, width, depth, maxDepth, config, seed, barkMat, leafMat) {
    const nextWidth = width * (config.widthDecay || 0.7);
    const geometry = new THREE.CylinderGeometry(nextWidth, width, len, 3); 
    geometry.translate(0, len / 2, 0); 
    
    const branchMesh = new THREE.Mesh(geometry, barkMat);
    branchMesh.castShadow = true;
    branchMesh.receiveShadow = true;

    const branchGroup = new THREE.Group();
    branchGroup.add(branchMesh);
    branchGroup.userData = { depth: depth, seed: seed, baseRotX: 0, baseRotZ: 0 };
    Flora3D.animatedBranches.push(branchGroup);

    parentGroup.add(branchGroup);

    if (depth >= maxDepth - 1) {
        createBlockFoliage(branchGroup, len, config.leafShape, leafMat, seed);
    }

    if (depth >= maxDepth) return;

    const branchCount = Math.floor(seededRandomRange(1.8, 3.2));
    const angleMin = config.branchAngle ? config.branchAngle.min : 0.3;
    const angleMax = config.branchAngle ? config.branchAngle.max : 0.6;
    const nextLen = len * (config.lengthDecay || 0.8);

    for (let i = 0; i < branchCount; i++) {
        const subSeed = seed * 10 + i;
        const childHolder = new THREE.Group();
        childHolder.position.y = len; 
        const angle = seededRandomRange(angleMin, angleMax);
        const azimuth = (Math.PI * 2 * i / branchCount) + seededRandomRange(-0.2, 0.2);
        const gravityBend = (config.gravity || 0) * depth;

        childHolder.rotation.x = angle + gravityBend; 
        childHolder.rotation.y = azimuth;
        childHolder.userData = { depth: depth + 1, seed: subSeed, baseRotX: childHolder.rotation.x, baseRotZ: childHolder.rotation.z };
        Flora3D.animatedBranches.push(childHolder);
        branchGroup.add(childHolder);

        growRecursive(childHolder, null, nextLen, nextWidth, depth + 1, maxDepth, config, subSeed, barkMat, leafMat);
    }
}

function createBlockFoliage(group, yPos, type, material, seed) {
    let geo;
    let scale = 1.0;
    if (type === 'line') {
        geo = new THREE.ConeGeometry(4, 12, 4); scale = 1.5;
    } else {
        geo = new THREE.IcosahedronGeometry(6, 0); scale = seededRandomRange(1.0, 1.8);
    }
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = yPos;
    mesh.scale.setScalar(scale);
    mesh.rotation.set(seededRandom(), seededRandom(), seededRandom());
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
}