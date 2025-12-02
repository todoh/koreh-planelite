/**
 * MODO PREVIEW - GESTOR ASÍNCRONO SIN LAG
 * - Gestiona la carga de chunks mediante promesas y colas.
 * - Evita tirones permitiendo que la generación ocurra en segundo plano (simulado).
 */
import * as THREE from 'three';
import { WorldGenerator } from './mapa_generacion.js';
import { TerrainHeight } from './mapa_relieve.js';
import { HumanParams, generateHumanStructure } from './human_definitions.js';
import { Human3D } from './motor_humanos.js';
import { Skeleton } from './skeleton_core.js';
import { PlayerController } from './controles.js';
import { Flora3D } from './motor_flora.js';
import { Minimap } from './minimap.js'; 

export const PreviewWorld = {
    isOpen: false,
    scene: null,
    camera: null,
    renderer: null,
    playerController: null,
    animationFrameId: null,
    
    chunks: new Map(), 
    chunkSize: 150,    
    renderDistance: 3, 
    currentChunkCoord: { x: 0, z: 0 },
    
    // Cola de generación para evitar colisiones de peticiones
    pendingChunks: new Set(),
    isGenerating: false,

    init() {
        const canvas = document.getElementById('world-canvas');
        if (!canvas) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x88ccff); 
        this.scene.fog = new THREE.Fog(0x88ccff, 150, 450); 

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 500);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
        
        this.resize();

        const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(100, 200, 50);
        sun.castShadow = true;
        
        const d = 120;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.mapSize.width = 1024; 
        sun.shadow.mapSize.height = 1024;
        sun.shadow.bias = -0.0005; 
        this.scene.add(sun);

        TerrainHeight.setSeed(Math.random());

        this.createPlayer();
        Minimap.init('minimap-container', 'minimap-canvas', this.playerController.player);

        window.addEventListener('resize', () => this.resize());
    },

    createPlayer() {
        const group = new THREE.Group();
        group.scale.set(0.15, 0.15, 0.15); 

        const params = JSON.parse(JSON.stringify(HumanParams));
        Object.keys(params).forEach(k => params[k].val = params[k].min + Math.random()*(params[k].max - params[k].min));
        params.age.val = 0.2 + Math.random() * 0.6; 
        
        const humanData = generateHumanStructure(params);
        const skeleton = new Skeleton(humanData.config);
        const meshMap = Human3D.build(group, humanData.config, Math.random());
        
        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false; 
            }
        });

        group.userData = { skeleton, meshMap, config: humanData.config };
        this.scene.add(group);
        
        this.playerController = new PlayerController(group, skeleton, this.camera, this.renderer.domElement);
    },

    updateChunks() {
        if (!this.playerController) return;
        if (this.isGenerating) return; // Si ya estamos trabajando en un chunk, esperamos.

        const px = this.playerController.position.x;
        const pz = this.playerController.position.z;
        
        const cx = Math.floor(px / this.chunkSize);
        const cz = Math.floor(pz / this.chunkSize);

        this.currentChunkCoord = { x: cx, z: cz };
        const activeKeys = new Set();
        
        // 1. Identificar chunks necesarios
        const neededChunks = [];
        
        // Escaneamos en espiral o distancia (simple box por ahora)
        for (let x = cx - this.renderDistance; x <= cx + this.renderDistance; x++) {
            for (let z = cz - this.renderDistance; z <= cz + this.renderDistance; z++) {
                const key = `${x},${z}`;
                activeKeys.add(key);

                // Si no existe y no está pendiente
                if (!this.chunks.has(key) && !this.pendingChunks.has(key)) {
                    neededChunks.push({ x, z, key });
                }
            }
        }

        // Ordenar por distancia al jugador para cargar primero lo cercano
        neededChunks.sort((a, b) => {
            const distA = Math.pow(a.x - cx, 2) + Math.pow(a.z - cz, 2);
            const distB = Math.pow(b.x - cx, 2) + Math.pow(b.z - cz, 2);
            return distA - distB;
        });

        // 2. Iniciar generación del MÁS CERCANO (uno a la vez para mantener FPS)
        if (neededChunks.length > 0) {
            const target = neededChunks[0];
            this.generateChunkAsync(target.x, target.z, target.key);
        }

        // 3. Limpieza de chunks viejos (sincrono, es rápido)
        for (const [key, chunkData] of this.chunks) {
            if (!activeKeys.has(key)) {
                this.scene.remove(chunkData.group);
                chunkData.group.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                });
                this.chunks.delete(key);
            }
        }
    },

    async generateChunkAsync(x, z, key) {
        this.isGenerating = true;
        this.pendingChunks.add(key);

        try {
            // Llamada al generador asíncrono
            const chunkData = await WorldGenerator.createChunk(
                x * this.chunkSize, 
                z * this.chunkSize, 
                this.chunkSize
            );

            // Verificar si aún lo necesitamos (el jugador podría haberse movido rápido)
            // pero por simplicidad lo añadimos igual para evitar huecos.
            this.scene.add(chunkData.group);
            this.chunks.set(key, chunkData);
            
            if (this.playerController) {
                const meshes = Array.from(this.chunks.values()).map(c => c.mesh);
                this.playerController.updateTerrainColliders(meshes);
            }

        } catch (e) {
            console.error("Error generando chunk", e);
        } finally {
            this.pendingChunks.delete(key);
            this.isGenerating = false; // Liberar el flag para el siguiente frame
        }
    },

    open() {
        const modal = document.getElementById('world-preview-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.isOpen = true;
        if (!this.renderer) this.init();
        
        if(Minimap.container) {
            Minimap.container.classList.remove('hidden');
            Minimap.lastTerrainUpdatePos = { x: -99999, z: -99999 };
        }

        this.resize();
        this.loop();
    },

    close() {
        const modal = document.getElementById('world-preview-modal');
        if (modal) modal.classList.add('hidden');
        if(Minimap.container) Minimap.container.classList.add('hidden');

        this.isOpen = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    },

    resize() {
        if (!this.camera || !this.renderer) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    loop() {
        if (!this.isOpen) return;

        const time = performance.now();

        this.updateChunks();

        if (this.playerController) this.playerController.update(time);

        const playerGroup = this.playerController?.player;
        if (playerGroup) {
            const { skeleton, meshMap } = playerGroup.userData;
            const yFix = 82; 
            skeleton.bones.forEach(bone => {
                const meshGroup = meshMap.get(bone.id);
                if (meshGroup) {
                    meshGroup.position.set(bone.globalStart.x - 50, -bone.globalStart.y + yFix, 0);
                    meshGroup.rotation.z = -bone.globalAngle;
                }
            });
        }

        Flora3D.update(time);
        Minimap.update();

        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
};

window.PreviewWorld = PreviewWorld;