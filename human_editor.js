/**
 * EDITOR DE HUMANOS 3D (X -> Variable e I -> Individualidad)
 * Interfaz UI que controla el motor Genesis3D en tiempo real.
 */

import { HumanParams, generateHumanStructure } from './human_definitions.js';
import { AnimationController } from './animacion.js';
import { Genesis3D } from './motor_3d_core.js'; 

export const HumanEditor = {
    isOpen: false,
    params: JSON.parse(JSON.stringify(HumanParams)), 
    currentSeed: Math.random(),
    canvas: null,
    
    init() {
        if (document.getElementById('human-editor-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'human-editor-modal';
        modal.className = 'fixed inset-0 z-50 bg-black/95 flex hidden opacity-0 transition-opacity duration-300';
        
        modal.innerHTML = `
            <div class="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col p-6 overflow-y-auto z-10 shadow-2xl">
                <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-6">EDITOR 3D</h2>
                <div id="human-controls" class="space-y-6 flex-1"></div>
                <div class="mt-6 pt-6 border-t border-gray-800 space-y-3">
                     <button onclick="window.HumanEditor.randomize()" class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-mono text-sm border border-gray-700 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="shuffle" class="w-4 h-4"></i> ALEATORIZAR
                    </button>
                    <button onclick="window.HumanEditor.close()" class="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded text-sm transition-colors">CERRAR</button>
                </div>
            </div>
            <div class="flex-1 relative bg-gradient-to-br from-gray-900 to-black overflow-hidden flex items-center justify-center">
                <canvas id="human-canvas-3d" class="w-full h-full block outline-none"></canvas>
                <div class="absolute bottom-4 right-4 text-xs text-gray-500 pointer-events-none select-none bg-black/50 px-2 py-1 rounded">
                    Rotar: Click Izq | Mover: Click Der | Zoom: Rueda
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.canvas = document.getElementById('human-canvas-3d');
        
        // Inicializamos el motor (aunque el tamaño sea 0 al principio)
        Genesis3D.init(this.canvas);
        
        this.renderControls();
        window.HumanEditor = this;
        
        if(window.lucide) window.lucide.createIcons();
    },

    _syncParams() {
        const freshParams = JSON.parse(JSON.stringify(HumanParams));
        Object.keys(freshParams).forEach(key => {
            if (this.params[key]) freshParams[key].val = this.params[key].val;
        });
        this.params = freshParams;
        this.renderControls();
    },

    open() {
        this.init();
        this._syncParams();

        const modal = document.getElementById('human-editor-modal');
        modal.classList.remove('hidden');
        
        // --- FIX CRÍTICO: FORZAR REDIMENSIONADO ---
        // Esperamos un frame para que el navegador calcule el tamaño del div visible
        // y luego le decimos al motor 3D que actualice su tamaño.
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            // Forzar actualización de tamaño de cámara y renderer
            if (Genesis3D.onWindowResize) Genesis3D.onWindowResize();
        });
        // ------------------------------------------

        this.isOpen = true;
        
        if (!this.params.age) this.randomize(); 

        this.update3DModel();
        
        // Iniciar bucle
        AnimationController.start((time) => Genesis3D.render(time));
    },

    close() {
        const modal = document.getElementById('human-editor-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            AnimationController.stop(); 
            this.isOpen = false;
        }, 300);
    },

    update3DModel() {
        if (!this.canvas) return;
        const humanData = generateHumanStructure(this.params);
        Genesis3D.buildEntity('human', humanData.config, this.currentSeed);
    },

    renderControls() {
        const container = document.getElementById('human-controls');
        if (!container) return;
        container.innerHTML = '';
        Object.entries(this.params).forEach(([key, config]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'group';
            wrapper.innerHTML = `<div class="flex justify-between text-xs font-mono text-gray-400 mb-1"><span>${config.label}</span><span id="val-${key}">${config.val.toFixed(2)}</span></div>`;
            const input = document.createElement('input');
            input.type = 'range'; 
            input.min = config.min; 
            input.max = config.max; 
            input.step = (config.max - config.min) > 10 ? 1 : 0.01; 
            input.value = config.val;
            input.className = 'w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400';
            input.oninput = (e) => {
                this.params[key].val = parseFloat(e.target.value);
                const display = document.getElementById(`val-${key}`);
                if(display) display.textContent = this.params[key].val.toFixed(2);
                this.update3DModel();
            };
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });
    },

    randomize() {
        Object.keys(this.params).forEach(key => {
            const conf = this.params[key];
            this.params[key].val = conf.min + Math.random() * (conf.max - conf.min);
        });
        this.currentSeed = Math.random();
        this.renderControls(); 
        this.update3DModel();
    }
};