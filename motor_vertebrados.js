/**
 * MOTOR DE VERTEBRADOS (K + M)
 * Orquestador que une el esqueleto matemático con el renderizado artístico.
 */

import { Skeleton } from './skeleton_core.js';
import { SkinRenderer } from './skin_renderer.js';

// Caché de esqueletos para no reconstruirlos en cada frame (Optimización)
const skeletonCache = new Map();

export const VertebrateEngine = {
    
    render: (ctx, width, height, time, seed, config) => {
        ctx.save();
        
        // 1. OBTENER O CREAR ESQUELETO (Instancia única por espécimen)
        // Usamos el 'seed' como identificador único de instancia temporal
        // Nota: En una app real, el objeto 'item' debería tener su propia instancia persistente.
        // Aquí simulamos regenerando si cambia mucho, pero idealmente se guarda en memoria.
        let skeleton = new Skeleton(config); 

        const centerX = width / 2;
        const centerY = height / 2 + 50;
        
        ctx.translate(centerX, centerY);
        ctx.scale(config.scale, config.scale);
        // Invertimos Y para que coordenadas positivas suban, si fuera necesario, 
        // pero aquí mantenemos el estándar de canvas (Y positivo baja).

        // 2. ACTUALIZAR FÍSICA (K - Camino)
        // Calculamos posiciones absolutas de todos los huesos
        skeleton.update(0, 0, time, config.speed); // 0,0 porque ya hicimos translate

        // 3. RENDERIZAR PIEL Y ÓRGANOS (M - Material)
        SkinRenderer.render(ctx, skeleton, config, seed);

        ctx.restore();
    }
};