/**
 * GENERADOR DE CHUNKS ASÍNCRONO V9 - GEOMETRÍA SÓLIDA
 * - Triangulación estandarizada (Diagonal fija Backslash).
 * - Garantiza que no haya huecos visuales entre chunks.
 */
import * as THREE from 'three';
import { TerrainHeight } from './mapa_relieve.js';
import { Biomes } from './mapa_biomas.js';
import { Flora3D } from './motor_flora.js';

const SEA_LEVEL = -5;
const CHUNK_RES = 30; // Resolución del chunk
const TIME_BUDGET = 12; 

const waterMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2288bb, 
    transparent: true, 
    opacity: 0.6, 
    roughness: 0.1,
    metalness: 0.4,
    side: THREE.DoubleSide
});

export const WorldGenerator = {
    
    async createChunk(offsetX, offsetZ, size) {
        const res = CHUNK_RES;
        const blockSize = size / res; 
        
        const chunkGroup = new THREE.Group();
        chunkGroup.position.set(offsetX, 0, offsetZ);

        const positions = [];
        const normals = [];
        const colors = [];
        
        let startTime = performance.now();

        // Calcular normal para iluminación Flat (Low Poly)
        const computeFlatNormal = (vA, vB, vC) => {
            const cb = new THREE.Vector3().subVectors(vC, vB);
            const ab = new THREE.Vector3().subVectors(vA, vB);
            cb.cross(ab).normalize();
            return cb;
        };

        const addTriangle = (v1, v2, v3, color) => {
            positions.push(v1.x, v1.y, v1.z);
            positions.push(v2.x, v2.y, v2.z);
            positions.push(v3.x, v3.y, v3.z);
            
            const n = computeFlatNormal(v1, v2, v3);
            // Repetimos la normal para los 3 vértices (Flat Shading)
            normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
            colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
        };

        for (let ix = 0; ix < res; ix++) {
            // Control de rendimiento
            if (performance.now() - startTime > TIME_BUDGET) {
                await new Promise(resolve => setTimeout(resolve, 0));
                startTime = performance.now();
            }

            for (let iz = 0; iz < res; iz++) {
                
                // Coordenadas locales (relativas al centro del chunk)
                const x0 = ix * blockSize - size/2;
                const z0 = iz * blockSize - size/2;
                const x1 = (ix + 1) * blockSize - size/2;
                const z1 = (iz + 1) * blockSize - size/2;

                // Coordenadas mundiales (para el ruido)
                const wx0 = offsetX + ix * blockSize;
                const wz0 = offsetZ + iz * blockSize;
                const wx1 = offsetX + (ix + 1) * blockSize;
                const wz1 = offsetZ + (iz + 1) * blockSize;

                // Obtener alturas EXACTAS en los 4 vértices
                const h00 = TerrainHeight.get(wx0, wz0);     // Top-Left
                const h10 = TerrainHeight.get(wx1, wz0);     // Top-Right
                const h01 = TerrainHeight.get(wx0, wz1);     // Bottom-Left
                const h11 = TerrainHeight.get(wx1, wz1);     // Bottom-Right

                // Datos de bioma (usamos centro del quad)
                const cx = wx0 + blockSize * 0.5;
                const cz = wz0 + blockSize * 0.5;
                const hAvg = (h00 + h10 + h01 + h11) * 0.25;
                const moisture = TerrainHeight.getMoisture(cx, cz);
                const isLava = TerrainHeight.isLava(cx, cz);
                
                const biome = Biomes.getBiomeData(hAvg, moisture, isLava);
                const col = new THREE.Color(isLava ? 0xff3300 : biome.color);
                
                // Pequeña variación de color
                const noiseC = (Math.random() - 0.5) * 0.03;
                col.r += noiseC; col.g += noiseC; col.b += noiseC;

                // Vértices 3D
                const v00 = new THREE.Vector3(x0, h00, z0);
                const v10 = new THREE.Vector3(x1, h10, z0);
                const v01 = new THREE.Vector3(x0, h01, z1);
                const v11 = new THREE.Vector3(x1, h11, z1);

                // --- TRIANGULACIÓN ESTÁNDAR ---
                // Cortamos siempre de v00 a v11 (Diagonal Principal)
                // T1: Top-Left -> Bottom-Left -> Bottom-Right
                addTriangle(v00, v01, v11, col);
                
                // T2: Top-Left -> Bottom-Right -> Top-Right
                addTriangle(v00, v11, v10, col);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const mat = new THREE.MeshStandardMaterial({ 
            vertexColors: true, 
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true,
            side: THREE.FrontSide
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        chunkGroup.add(mesh);

        // Agua
        const waterGeo = new THREE.PlaneGeometry(size, size);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
        waterMesh.position.y = SEA_LEVEL;
        chunkGroup.add(waterMesh);

        // Flora
        this.generateFlora(chunkGroup, offsetX, offsetZ, size);

        return { group: chunkGroup, mesh: mesh };
    },

    generateFlora(group, offsetX, offsetZ, size) {
        // Reducimos densidad para evitar lag
        const treeCount = 4; 
        for(let i=0; i<treeCount; i++) {
            const lx = (Math.random() - 0.5) * size;
            const lz = (Math.random() - 0.5) * size;
            const wx = lx + offsetX;
            const wz = lz + offsetZ;
            
            const y = TerrainHeight.get(wx, wz);
            
            if (y <= SEA_LEVEL || y > 150 || TerrainHeight.isLava(wx, wz)) continue;

            const m = TerrainHeight.getMoisture(wx, wz);
            const biome = Biomes.getBiomeData(y, m, false);

            if (biome.flora && biome.flora !== 'none') {
                if (Math.random() < 0.4) {
                    const tGroup = new THREE.Group();
                    tGroup.position.set(lx, y, lz);
                    const s = 0.5 + Math.random() * 0.8;
                    tGroup.scale.set(s, s, s);
                    tGroup.rotation.y = Math.random() * 6.28;
                    
                    Flora3D.build(tGroup, Biomes.getTreeConfig(biome), Math.random());
                    group.add(tGroup);
                }
            }
        }
    }
};