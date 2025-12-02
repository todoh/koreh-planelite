/**
 * CONTEXTO SVG ROBUSTO (Z -> Traducción Vectorial Precisa)
 * Emula el comportamiento de Canvas 2D usando una pila de estados plana.
 * Corrige problemas de transformaciones acumuladas y propiedades perdidas.
 */

export class SVGContext {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.elements = [];
        this.currentPath = '';
        
        // Estado inicial (Copia plana del contexto)
        this.state = {
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            globalAlpha: 1,
            transform: '', // Acumulador de strings de transformación
            font: '10px sans-serif'
        };
        
        // Pila para save/restore
        this.stack = [];
    }

    // --- GESTIÓN DE ESTADO ---
    save() {
        // Guardamos una COPIA del estado actual
        this.stack.push({ ...this.state });
    }

    restore() {
        if (this.stack.length > 0) {
            // Restauramos el estado anterior (incluyendo la transformación limpia)
            this.state = this.stack.pop();
        }
    }

    // --- TRANSFORMACIONES ---
    translate(x, y) {
        if (x === 0 && y === 0) return;
        this.state.transform += ` translate(${this.f(x)}, ${this.f(y)})`;
    }

    rotate(angle) {
        if (angle === 0) return;
        const deg = angle * 180 / Math.PI;
        this.state.transform += ` rotate(${this.f(deg)})`;
    }

    scale(x, y) {
        if (x === 1 && y === 1) return;
        this.state.transform += ` scale(${this.f(x)}, ${this.f(y)})`;
    }

    // --- RUTAS (PATHS) ---
    beginPath() {
        this.currentPath = '';
    }

    moveTo(x, y) {
        this.currentPath += `M ${this.f(x)} ${this.f(y)} `;
    }

    lineTo(x, y) {
        this.currentPath += `L ${this.f(x)} ${this.f(y)} `;
    }

    quadraticCurveTo(cpx, cpy, x, y) {
        this.currentPath += `Q ${this.f(cpx)} ${this.f(cpy)} ${this.f(x)} ${this.f(y)} `;
    }

    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.currentPath += `C ${this.f(cp1x)} ${this.f(cp1y)} ${this.f(cp2x)} ${this.f(cp2y)} ${this.f(x)} ${this.f(y)} `;
    }

    rect(x, y, w, h) {
        // Rectángulo como sub-path
        this.currentPath += `M ${this.f(x)} ${this.f(y)} h ${this.f(w)} v ${this.f(h)} h ${this.f(-w)} Z `;
    }

    closePath() {
        this.currentPath += 'Z ';
    }

    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // Si es un círculo completo (o casi)
        if (Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.001) {
            this.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
            return;
        }

        const startX = x + Math.cos(startAngle) * radius;
        const startY = y + Math.sin(startAngle) * radius;
        const endX = x + Math.cos(endAngle) * radius;
        const endY = y + Math.sin(endAngle) * radius;
        
        const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        const sweep = anticlockwise ? 0 : 1;
        
        if (this.currentPath === '') this.moveTo(startX, startY);
        else this.currentPath += `L ${this.f(startX)} ${this.f(startY)} `;

        this.currentPath += `A ${this.f(radius)} ${this.f(radius)} 0 ${largeArc} ${sweep} ${this.f(endX)} ${this.f(endY)} `;
    }

    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
        // Implementación manual de elipse usando curvas Bezier cúbicas para soportar rotación
        // Aproximación Kappa
        const k = 0.5522848;
        const ox = radiusX * k;
        const oy = radiusY * k;

        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);

        // Función auxiliar para rotar y trasladar puntos
        const tx = (px, py) => x + px * cosR - py * sinR;
        const ty = (px, py) => y + px * sinR + py * cosR;

        // Puntos de control (Norte, Este, Sur, Oeste relativos al centro rotado)
        // P1 (Este)
        const p1x = tx(radiusX, 0), p1y = ty(radiusX, 0);
        // C1 (Este hacia Sur)
        const c1x = tx(radiusX, oy), c1y = ty(radiusX, oy);
        // C2 (Sur hacia Este)
        const c2x = tx(ox, radiusY), c2y = ty(ox, radiusY);
        // P2 (Sur)
        const p2x = tx(0, radiusY), p2y = ty(0, radiusY);
        // C3 (Sur hacia Oeste)
        const c3x = tx(-ox, radiusY), c3y = ty(-ox, radiusY);
        // C4 (Oeste hacia Sur)
        const c4x = tx(-radiusX, oy), c4y = ty(-radiusX, oy);
        // P3 (Oeste)
        const p3x = tx(-radiusX, 0), p3y = ty(-radiusX, 0);
        // C5 (Oeste hacia Norte)
        const c5x = tx(-radiusX, -oy), c5y = ty(-radiusX, -oy);
        // C6 (Norte hacia Oeste)
        const c6x = tx(-ox, -radiusY), c6y = ty(-ox, -radiusY);
        // P4 (Norte)
        const p4x = tx(0, -radiusY), p4y = ty(0, -radiusY);
        // C7 (Norte hacia Este)
        const c7x = tx(ox, -radiusY), c7y = ty(ox, -radiusY);
        // C8 (Este hacia Norte)
        const c8x = tx(radiusX, -oy), c8y = ty(radiusX, -oy);

        // Dibujar (asumiendo elipse completa por simplicidad en tu caso de uso)
        this.moveTo(p1x, p1y);
        this.bezierCurveTo(c1x, c1y, c2x, c2y, p2x, p2y);
        this.bezierCurveTo(c3x, c3y, c4x, c4y, p3x, p3y);
        this.bezierCurveTo(c5x, c5y, c6x, c6y, p4x, p4y);
        this.bezierCurveTo(c7x, c7y, c8x, c8y, p1x, p1y);
    }

    // --- DIBUJO ---
    fill() {
        if (!this.currentPath) return;
        // Aplicamos el transform actual DIRECTAMENTE al elemento path
        this.elements.push(`<path d="${this.currentPath}" fill="${this.state.fillStyle}" stroke="none" transform="${this.state.transform}" opacity="${this.state.globalAlpha}" />`);
    }

    stroke() {
        if (!this.currentPath) return;
        this.elements.push(`<path d="${this.currentPath}" fill="none" stroke="${this.state.strokeStyle}" stroke-width="${this.state.lineWidth}" stroke-linecap="${this.state.lineCap}" stroke-linejoin="${this.state.lineJoin}" transform="${this.state.transform}" opacity="${this.state.globalAlpha}" />`);
    }

    // --- GETTERS/SETTERS (Propiedades de Canvas) ---
    set fillStyle(v) { this.state.fillStyle = v; }
    get fillStyle() { return this.state.fillStyle; }
    
    set strokeStyle(v) { this.state.strokeStyle = v; }
    get strokeStyle() { return this.state.strokeStyle; }
    
    set lineWidth(v) { this.state.lineWidth = v; }
    get lineWidth() { return this.state.lineWidth; }
    
    set globalAlpha(v) { this.state.globalAlpha = v; }
    get globalAlpha() { return this.state.globalAlpha; }
    
    set lineCap(v) { this.state.lineCap = v; }
    set lineJoin(v) { this.state.lineJoin = v; }

    // Ignorar métodos de pixel que no aplican a vector
    clearRect() {} 

    // --- SALIDA ---
    getSerializedSvg() {
        return `
<svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#000000"/>
    ${this.elements.join('\n')}
</svg>`.trim();
    }

    f(num) { return Number(num).toFixed(2); }
}