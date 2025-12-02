/**
 * UTILIDADES MATEMÁTICAS (N -> Número)
 * Funciones puras desacopladas para evitar dependencias circulares.
 */

let currentSeed = 0;

export const setSeed = (seed) => { currentSeed = seed; };

export const seededRandom = () => {
    // Algoritmo determinista simple: sin(x)
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
};

export const seededRandomRange = (min, max) => seededRandom() * (max - min) + min;

export const randomRange = (min, max) => Math.random() * (max - min) + min;

export const toCartesian = (radius, angle) => ({
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle)
});

/**
 * CALCULADORA DE LÍMITES (L -> Límite)
 * Simula un contexto 2D para calcular la caja envolvente exacta.
 * Utiliza un contexto dummy para delegar la matemática de matrices.
 */
export class BoundsCalculator {
    constructor() {
        this.minX = Infinity;
        this.maxX = -Infinity;
        this.minY = Infinity;
        this.maxY = -Infinity;
        // Usamos un canvas invisible para delegar la matemática de matrices (Z -> Conocimiento exacto)
        this.ctx = document.createElement('canvas').getContext('2d');
    }

    // --- MANEJO DE ESTADO ---
    save() { this.ctx.save(); }
    restore() { this.ctx.restore(); }

    // --- TRANSFORMACIONES ---
    translate(x, y) { this.ctx.translate(x, y); }
    rotate(angle) { this.ctx.rotate(angle); }
    scale(x, y) { this.ctx.scale(x, y); }
    setTransform(a, b, c, d, e, f) { this.ctx.setTransform(a, b, c, d, e, f); }
    
    // --- GEOMETRÍA ---
    addPoint(x, y) {
        const m = this.ctx.getTransform();
        // Aplicamos la matriz actual al punto (ax + cy + e, bx + dy + f)
        const px = x * m.a + y * m.c + m.e;
        const py = x * m.b + y * m.d + m.f;

        if (px < this.minX) this.minX = px;
        if (px > this.maxX) this.maxX = px;
        if (py < this.minY) this.minY = py;
        if (py > this.maxY) this.maxY = py;
    }

    // --- INTERFAZ DE DIBUJO ---
    beginPath() {}
    closePath() {}
    moveTo(x, y) { this.addPoint(x, y); }
    lineTo(x, y) { this.addPoint(x, y); }
    
    // Aproximamos curvas usando sus puntos de control (Caja Convexa)
    quadraticCurveTo(cpx, cpy, x, y) {
        this.addPoint(cpx, cpy);
        this.addPoint(x, y);
    }
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.addPoint(cp1x, cp1y);
        this.addPoint(cp2x, cp2y);
        this.addPoint(x, y);
    }
    
    rect(x, y, w, h) {
        this.addPoint(x, y);
        this.addPoint(x+w, y);
        this.addPoint(x+w, y+h);
        this.addPoint(x, y+h);
    }

    // Aproximación conservadora para arcos/elipses: Caja envolvente completa
    arc(x, y, radius, startAngle, endAngle) {
        this.addPoint(x - radius, y - radius);
        this.addPoint(x + radius, y - radius);
        this.addPoint(x + radius, y + radius);
        this.addPoint(x - radius, y + radius);
    }
    
    ellipse(x, y, rx, ry, rotation, startAngle, endAngle) {
        const maxR = Math.max(rx, ry);
        this.addPoint(x - maxR, y - maxR);
        this.addPoint(x + maxR, y - maxR);
        this.addPoint(x + maxR, y + maxR);
        this.addPoint(x - maxR, y + maxR);
    }

    // --- MÉTODOS VISUALES (Ignorados para el cálculo, pero necesarios para evitar errores) ---
    fill() {} 
    stroke() {} 
    clearRect() {}
    
    // Mocks para propiedades
    set fillStyle(v) {} 
    set strokeStyle(v) {} 
    set lineWidth(v) {}
    set lineCap(v) {} 
    set lineJoin(v) {} 
    set globalAlpha(v) {} 
    set font(v) {}

    // Mocks para Gradientes (Devuelven un objeto dummy que acepta addColorStop)
    createLinearGradient() {
        return { addColorStop: () => {} };
    }

    createRadialGradient() {
        return { addColorStop: () => {} };
    }
}