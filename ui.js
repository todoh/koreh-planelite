import { Generators } from './generacion.js';
import { AnimationController } from './animacion.js';
import { Genesis3D } from './motor_3d_core.js';

// --- GESTIÓN DEL VISOR A PANTALLA COMPLETA ---
export const Viewer = {
    activeItem: null,
    currentSeed: 0,
    libraryRef: null,

    init(library) {
        this.libraryRef = library;
        const canvas = document.getElementById('fullscreen-canvas');
        if (canvas) {
            Genesis3D.init(canvas);
        }
    },
    
    open(item) {
        this.activeItem = item;
        this.currentSeed = item.seed;
        
        const species = this.libraryRef[item.speciesId];
        
        const modal = document.getElementById('modal-viewer');
        modal.classList.remove('hidden');
        
        // --- FIX VISUALIZACIÓN: FORZAR REDIMENSIONADO ---
        // Esperamos un frame para que el navegador sepa que el div ya no está oculto
        // y tenga dimensiones reales antes de dibujar.
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            // Forzamos al motor 3D a leer el nuevo tamaño del contenedor
            if (Genesis3D.onWindowResize) Genesis3D.onWindowResize();
        });
        
        document.getElementById('viewer-title').textContent = species.name.toUpperCase();
        
        const infoDiv = document.getElementById('viewer-info');
        infoDiv.innerHTML = `
            <p class="text-cyan-400 font-bold">MODO: VISUALIZACIÓN VOLUMÉTRICA (3D)</p>
            <p>CLASE: ${species.type.toUpperCase()}</p>
            <p>ADN: <span id="viewer-seed">${this.currentSeed.toFixed(5)}</span></p>
            <p class="opacity-70 text-[10px] mt-2">CONTROLES: CLICK IZQ (Rotar) | CLICK DER (Mover) | RUEDA (Zoom)</p>
        `;

        const btnPlay = document.getElementById('btn-play-pause');
        btnPlay.classList.remove('hidden');
        
        // Llamamos a buildEntity que tiene la lógica para Huesos Y Plantas
        Genesis3D.buildEntity(species.type, species.config, this.currentSeed);
        
        AnimationController.start((time) => Genesis3D.render(time));

        this.updatePlayIcon();
    },

    close() {
        AnimationController.stop();
        const modal = document.getElementById('modal-viewer');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            this.activeItem = null;
            Genesis3D.cleanScene(); // Limpiar memoria 3D
        }, 300);
    },

    regenerate() {
        this.currentSeed = Math.random();
        document.getElementById('viewer-seed').textContent = this.currentSeed.toFixed(5);
        
        if (this.activeItem) {
            const species = this.libraryRef[this.activeItem.speciesId];
            Genesis3D.buildEntity(species.type, species.config, this.currentSeed);
        }
    },

    togglePlay() {
        if (AnimationController.isPlaying) {
            AnimationController.stop();
        } else {
            AnimationController.start((time) => Genesis3D.render(time));
        }
        this.updatePlayIcon();
    },

    updatePlayIcon() {
        const icon = document.getElementById('icon-play-pause');
        const isPlaying = AnimationController.isPlaying;
        icon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
        if(window.lucide) window.lucide.createIcons();
    },

    downloadCurrent(format) {
        alert("Descarga no disponible en modo 3D Volumétrico.");
    }
};

// ... Resto de funciones (drawCanvas, createCardElement) para las miniaturas 2D
export const drawCanvas = (uniqueId, speciesId, seed, library) => {
    const canvas = document.getElementById(`canvas-${uniqueId}`);
    if (!canvas) return;
    const species = library[speciesId];
    if (!species) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (Generators[species.type]) {
        Generators[species.type](ctx, rect.width, rect.height, 0, seed, species.config);
    }
};

export const createCardElement = (item, library, deleteCallback) => {
    const species = library[item.speciesId];
    const div = document.createElement('div');
    div.className = "group relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 border border-gray-800 hover:border-cyan-500 animate-fade-in";
    
    div.onclick = () => Viewer.open(item);
    
    div.innerHTML = `
        <canvas id="canvas-${item.id}" class="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"></canvas>
        <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
            <h3 class="text-white font-bold text-lg flex items-center gap-2">${species.name}</h3>
            <p class="text-cyan-400/80 text-xs font-mono mt-1">ID: ${species.id.toUpperCase()} | VAR: ${item.seed.toFixed(3)}</p>
            <div class="absolute top-4 right-4 bg-purple-900/80 px-2 py-1 rounded text-[10px] font-bold border border-purple-500/30 text-purple-200">3D</div>
        </div>
        <button class="delete-btn absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    div.querySelector('.delete-btn').onclick = (e) => {
        e.stopPropagation();
        deleteCallback(item.id);
    };
    return div;
};