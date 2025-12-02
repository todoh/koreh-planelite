/**
 * FÁBRICA DE ÓRGANOS (B -> Visión y F -> Forma)
 * Dibuja componentes complejos como ojos, hocicos y garras.
 */

export const OrganFactory = {
    
    drawEye: (ctx, x, y, size, lookDirX, lookDirY, type = 'herbivore') => {
        ctx.save();
        ctx.translate(x, y);

        // Párpado / Cuenca
        ctx.fillStyle = '#1a1a1a'; // Sombra oscura alrededor
        ctx.beginPath();
        if (type === 'herbivore') {
            // Ojo lateral de ciervo
            ctx.ellipse(0, 0, size * 1.2, size * 0.9, 0, 0, Math.PI*2);
        } else {
            // Ojo frontal depredador
            ctx.arc(0, 0, size, 0, Math.PI*2);
        }
        ctx.fill();

        // Esclerótica (Blanco del ojo)
        ctx.fillStyle = '#eec'; // Blanco cremoso, no puro
        ctx.beginPath();
        ctx.ellipse(lookDirX * 2, lookDirY * 2, size * 0.9, size * 0.7, 0, 0, Math.PI*2);
        ctx.fill();

        // Iris
        ctx.fillStyle = type === 'herbivore' ? '#321' : '#fb0'; // Marrón oscuro o Amarillo
        ctx.beginPath();
        ctx.circle = (0,0, size * 0.6);
        ctx.ellipse(lookDirX * 4, lookDirY * 4, size * 0.6, size * 0.6, 0, 0, Math.PI*2);
        ctx.fill();

        // Pupila (B -> Visión enfocada)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        if (type === 'herbivore') {
            // Pupila horizontal rectangular (cabra/ciervo)
            ctx.rect(-size*0.4 + lookDirX*4, -size*0.15 + lookDirY*4, size*0.8, size*0.3);
        } else {
            // Pupila redonda
            ctx.arc(lookDirX*4, lookDirY*4, size * 0.3, 0, Math.PI*2);
        }
        ctx.fill();

        // Brillo (Vida)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-size*0.3 + lookDirX*4, -size*0.3 + lookDirY*4, size * 0.15, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },

    drawSnout: (ctx, x, y, size, color) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Nariz húmeda
        ctx.fillStyle = '#111';
        ctx.beginPath();
        // Forma de diamante suave
        ctx.moveTo(0, -size/2);
        ctx.quadraticCurveTo(size, 0, 0, size/2);
        ctx.quadraticCurveTo(-size, 0, 0, -size/2);
        ctx.fill();
        
        // Brillo nariz
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(-size*0.2, -size*0.1, size*0.15, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },

    drawHoof: (ctx, x, y, angle, size, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#111'; // Pezuña oscura
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size * 1.2, -size/2); // Base
        ctx.lineTo(size * 0.8, size/2);  // Punta
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.fill();

        // División de la pezuña
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.stroke();

        ctx.restore();
    }
};