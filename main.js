import { Viewer, createCardElement, drawCanvas } from './ui.js';
import { Generators } from './generacion.js';
import { SVGContext } from './svg_context.js';
import { BoundsCalculator } from './utils.js';
import { HumanEditor } from './human_editor.js';
import { PreviewWorld } from './preview.js'; 

// Lista de archivos JSON a cargar
const SPECIES_FILES = [
    './especies.json',
    './a-arboles.json',
    './a-insectos.json',
    './vertebrados_data.json',
    './data_simios.json',
    './data_caninos.json',
    './data_felinos.json',
    './data_cefalopodos.json',
    './data_aracnidos.json',
    './data_mariposas.json',
    './data_aves_rapaces.json',
    './data_aves_corral.json',
    './data_peces.json',
    './data_mamiferos_agua.json'
];

// Estado de la Aplicación
const App = {
    items: [],
    filter: 'all',
    speciesLibrary: {}, 

    async init() {
        try {
            const fetchPromises = SPECIES_FILES.map(url => 
                fetch(url).then(response => {
                    if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${url}`);
                    return response.json();
                })
            );

            const allSpeciesData = await Promise.all(fetchPromises);
            
            this.speciesLibrary = allSpeciesData.reduce((acc, currentSet) => ({
                ...acc,
                ...currentSet
            }), {});

            Viewer.init(this.speciesLibrary);

            Object.keys(this.speciesLibrary).forEach((key) => {
                this.addItem(key, false);
            });

            this.renderUI();
            this.renderGallery();
            
            // INYECTAR LOS DOS BOTONES (EDITOR Y PREVIEW)
            this.injectHeaderButtons();

            window.Viewer = Viewer; 
            window.App = this; 

        } catch (error) {
            console.error("Error crítico:", error);
            document.body.innerHTML = `<div class="p-10 text-red-500">Error: ${error.message}. <br>Asegúrate de que los archivos en SPECIES_FILES existen.</div>`;
        }
    },

    injectHeaderButtons() {
        const headerButtons = document.querySelector('header div div:last-child');
        if (headerButtons) {
            // 1. Botón Editor Humano
            const editorBtn = document.createElement('button');
            editorBtn.onclick = () => HumanEditor.open();
            editorBtn.className = "flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 rounded text-xs font-bold border border-purple-700 transition-colors shadow-lg shadow-purple-900/20";
            editorBtn.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i> EDITOR HUMANO`;
            
            // 2. NUEVO BOTÓN: MODO MUNDO
            const worldBtn = document.createElement('button');
            worldBtn.onclick = () => PreviewWorld.open();
            worldBtn.className = "flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-900 to-emerald-900 hover:from-green-800 hover:to-emerald-800 text-green-200 rounded text-xs font-bold border border-green-700 transition-colors shadow-lg shadow-green-900/20";
            worldBtn.innerHTML = `<i data-lucide="globe" class="w-4 h-4"></i> MODO MUNDO`;

            const zipBtn = headerButtons.querySelector('button[onclick*="downloadAll"]');
            
            if (zipBtn) {
                // Insertar antes del botón ZIP
                headerButtons.insertBefore(worldBtn, zipBtn);
                headerButtons.insertBefore(editorBtn, zipBtn);
            } else {
                headerButtons.appendChild(worldBtn);
                headerButtons.appendChild(editorBtn);
            }
            
            if(window.lucide) window.lucide.createIcons();
        }
    },

    addItem(speciesId, shouldRender = true) {
        const item = {
            id: Date.now() + Math.random(),
            speciesId: speciesId,
            seed: Math.random()
        };
        this.items.unshift(item);
        if (shouldRender) this.renderGallery();
    },

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderGallery();
    },

    setFilter(type) {
        this.filter = type;
        this.renderUI(); 
        this.renderGallery();
    },
    
    async downloadAll(format = 'png') {
        const confirmMsg = `Se descargarán ${this.items.length} archivos. ¿Continuar?`;
        if(!confirm(confirmMsg)) return;

        const itemsToDownload = this.items.filter(item => {
            if (this.filter === 'all') return true;
            return this.speciesLibrary[item.speciesId].type === this.filter;
        });

        const vSize = 2000; 

        for (let i = 0; i < itemsToDownload.length; i++) {
            const item = itemsToDownload[i];
            const species = this.speciesLibrary[item.speciesId];
            const filename = `${species.name.replace(/\s+/g, '_')}_${item.seed.toFixed(3)}`;

            if (format === 'png') {
                const bounds = new BoundsCalculator();
                if (Generators[species.type]) {
                    Generators[species.type](bounds, vSize, vSize, 0, item.seed, species.config);
                }

                if (bounds.minX !== Infinity) {
                    const entityW = bounds.maxX - bounds.minX;
                    const entityH = bounds.maxY - bounds.minY;
                    const maxDim = Math.max(entityW, entityH);
                    
                    const exportSize = 1024;
                    const margin = exportSize * 0.1;
                    const scale = (exportSize - (margin * 2)) / maxDim;
                    const centerX = (bounds.minX + bounds.maxX) / 2;
                    const centerY = (bounds.minY + bounds.maxY) / 2;

                    const canvas = document.createElement('canvas');
                    canvas.width = exportSize;
                    canvas.height = exportSize;
                    const ctx = canvas.getContext('2d');

                    ctx.translate(exportSize/2, exportSize/2);
                    ctx.scale(scale, scale);
                    ctx.translate(-centerX, -centerY);

                    if (Generators[species.type]) {
                        Generators[species.type](ctx, vSize, vSize, 0, item.seed, species.config);
                    }

                    const link = document.createElement('a');
                    link.download = `${filename}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }

            } else if (format === 'svg') {
                const width = 800;
                const height = 800;
                const svgCtx = new SVGContext(width, height);
                svgCtx.translate(width/2, height/2); 
                
                if (Generators[species.type]) {
                    Generators[species.type](svgCtx, width, height, 0, item.seed, species.config);
                }
                
                const svgContent = svgCtx.getSerializedSvg();
                const blob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.download = `${filename}.svg`;
                link.href = url;
                link.click();
                
                await new Promise(r => setTimeout(r, 50));
                URL.revokeObjectURL(url);
            }
            await new Promise(r => setTimeout(r, 150));
        }
    },

    renderUI() {
        // FILTROS ACTUALIZADOS CON LAS NUEVAS CATEGORÍAS
        const filters = ['all', 'tree', 'flower', 'animal', 'vertebrate', 'simian', 'canine', 'feline', 'cephalopod', 'arachnid', 'butterfly', 'bird', 'fish', 'aquatic_mammal'];
        const filterContainer = document.getElementById('filter-container');
        
        const names = {
            all: 'Todos', tree: 'Árboles', flower: 'Flores', animal: 'Insectos', vertebrate: 'Vertebrados',
            simian: 'Simios', canine: 'Caninos', feline: 'Felinos', 
            cephalopod: 'Cefalópodos', arachnid: 'Arácnidos', butterfly: 'Mariposas', bird: 'Aves',
            fish: 'Peces', aquatic_mammal: 'Mamíferos Agua'
        };

        filterContainer.innerHTML = filters.map(f => `
            <button onclick="App.setFilter('${f}')" 
                class="px-3 py-1 rounded text-xs font-bold uppercase transition-colors whitespace-nowrap ${this.filter === f ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}">
                ${names[f] || f}
            </button>
        `).join('');
        
        if(window.lucide) window.lucide.createIcons();
    },

    renderGallery() {
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';

        const filtered = this.items.filter(item => {
            if (this.filter === 'all') return true;
            return this.speciesLibrary[item.speciesId] && this.speciesLibrary[item.speciesId].type === this.filter;
        });

        const emptyState = document.getElementById('empty-state');
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // 1. PRIMERO: Crear los elementos y ponerlos en el DOM
        filtered.forEach(item => {
            const el = createCardElement(item, this.speciesLibrary, (id) => this.deleteItem(id));
            grid.appendChild(el);
        });
        
        // 2. SEGUNDO: Esperar a que el navegador calcule el Layout (Grid) antes de dibujar
        // Esto soluciona el problema de los Canvas en blanco al inicio
        setTimeout(() => {
            filtered.forEach(item => {
                drawCanvas(item.id, item.speciesId, item.seed, this.speciesLibrary);
            });
        }, 50); // 50ms de espera es suficiente para asegurar que el DOM tiene dimensiones
        
        if(window.lucide) window.lucide.createIcons();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});