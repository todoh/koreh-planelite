/**
 * MOTOR DE ANIMACIÓN (A -> Acción y T -> Tramo de Tiempo)
 * Gestiona el bucle de renderizado, limita los FPS y controla la velocidad del tiempo (Slow Motion).
 */

export const AnimationController = {
    animationId: null,
    isPlaying: false,
    
    // Configuración de Tiempo
    fps: 30,           // Tasa de refresco (Cinemático)
    speedFactor: 0.09,  // VELOCIDAD: 1.0 = Tiempo real, 0.3 = Slow Motion (30% velocidad)
    
    // Estado interno
    lastFrameTime: 0,
    accumulatedTime: 0, // El tiempo "falso" que le pasamos al generador
    callback: null,

    /**
     * Inicia el bucle de animación
     * @param {Function} drawCallback - Función a ejecutar en cada frame
     */
    start(drawCallback) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.callback = drawCallback;
        
        // Sincronizamos el tiempo inicial para evitar saltos
        this.lastFrameTime = performance.now();
        this.loop(performance.now());
    },

    /**
     * Detiene el bucle
     */
    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    /**
     * Bucle interno con control de Delta Time y Speed Factor
     */
    loop(currentTime) {
        if (!this.isPlaying) return;

        // 1. Solicitud del siguiente frame (K -> Camino continuo)
        this.animationId = requestAnimationFrame((t) => this.loop(t));

        // 2. Cálculo del tiempo transcurrido real desde el último frame dibujado
        const rawDelta = currentTime - this.lastFrameTime;
        const interval = 1000 / this.fps;

        // 3. Control de FPS (T -> Tramo)
        if (rawDelta > interval) {
            // Aquí está la magia:
            // En lugar de pasar el tiempo real, acumulamos tiempo multiplicado por el factor.
            // Esto hace que la física (senos/cosenos) avance más lento.
            this.accumulatedTime += rawDelta * this.speedFactor;

            // Ajuste para mantener los FPS estables sin deriva temporal
            this.lastFrameTime = currentTime - (rawDelta % interval);

            // 4. Ejecutamos el dibujo pasando el TIEMPO SIMULADO
            if (this.callback) this.callback(this.accumulatedTime);
        }
    }
};