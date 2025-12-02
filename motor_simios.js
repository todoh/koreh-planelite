/**
 * MOTOR SIMIOS (F -> Forma / S -> Estructura Pesada)
 * Renderiza primates en vista frontal, enfatizando hombros anchos y brazos largos.
 */
import { seededRandomRange } from './utils.js';

export const SimianEngine = {
    render: (ctx, width, height, time, seed, config) => {
        const { colorSkin, colorDetail, hasFur, scale } = config;
        
        const cx = width / 2;
        const cy = height / 2 + 50; // Bajamos el centro de gravedad
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // K -> Ki (Respiración pesada de gorila)
        const breathe = Math.sin(time * 0.002) * 0.02;
        ctx.scale(1 + breathe, 1 + breathe);

        const hue = seededRandomRange(colorSkin[0], colorSkin[1]);
        const baseColor = `hsl(${hue}, 40%, 30%)`;
        const furColor = `hsl(${hue}, 30%, 20%)`;
        const faceColor = `hsl(${hue}, 45%, 15%)`; // Cara oscura

        // 1. TORSO (Forma de V o Trapecio invertido)
        SimianParts.drawTorso(ctx, config, baseColor, furColor, seed);

        // 2. CABEZA (Hundida en los hombros)
        ctx.save();
        ctx.translate(0, -90); // Posición relativa al centro
        SimianParts.drawHead(ctx, config, faceColor, furColor, seed, time);
        ctx.restore();

        // 3. EXTREMIDADES (Simetría Frontal)
        // Brazos (Colgando largos)
        SimianParts.drawLimbPair(ctx, 'arm', -70, 60, config, baseColor, time, seed, 1.2); 
        // Piernas (Cortas y arqueadas)
        SimianParts.drawLimbPair(ctx, 'leg', 60, 50, config, baseColor, time, seed, 0.8);

        ctx.restore();
    },
};

const SimianParts = {
    drawTorso: (ctx, config, color, furColor, seed) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        // Dibujo trapezoidal masivo
        ctx.moveTo(-45, -80); // Hombro I
        ctx.lineTo(45, -80);  // Hombro D
        ctx.lineTo(30, 60);   // Cadera D
        ctx.lineTo(-30, 60);  // Cadera I
        ctx.closePath();
        ctx.fill();

        // Pectorales marcados (F -> Forma)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(-20, -30, 18, 0, Math.PI*2);
        ctx.arc(20, -30, 18, 0, Math.PI*2);
        ctx.fill();

        // Pelaje en hombros
        if(config.hasFur) SimianParts.drawFurPatch(ctx, 0, -80, 100, furColor);
    },

    drawHead: (ctx, config, skinColor, furColor, seed, time) => {
        // Cráneo alto
        ctx.fillStyle = furColor;
        ctx.beginPath();
        ctx.ellipse(0, -10, 25, 30, 0, 0, Math.PI*2);
        ctx.fill();

        // Rostro (Máscara sin pelo)
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(0, 5, 18, 14, 0, 0, Math.PI*2); // Hocico ancho
        ctx.ellipse(0, -5, 20, 18, 0, Math.PI, 0); // Frente
        ctx.fill();

        // Ojos profundos (B -> Visión)
        const lookX = Math.sin(time * 0.003) * 2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8 + lookX, -5, 2, 0, Math.PI*2);
        ctx.arc(8 + lookX, -5, 2, 0, Math.PI*2);
        ctx.fill();
        
        // Ceño fruncido
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -10); ctx.quadraticCurveTo(0, -5, 15, -10);
        ctx.stroke();
    },

    drawLimbPair: (ctx, type, startY, spanX, config, color, time, seed, lenMult) => {
        const isArm = type === 'arm';
        const length = isArm ? 90 * lenMult : 70 * lenMult;
        const width = isArm ? 20 : 22;

        // Animación suave de balanceo (K -> Camino)
        const sway = Math.sin(time * 0.003) * 0.05;

        for (let dir of [-1, 1]) {
            ctx.save();
            ctx.translate(spanX * dir, startY);
            ctx.rotate(isArm ? sway * dir : 0); // Solo los brazos oscilan al estar parados

            // Extremidad segmentada frontalmente
            ctx.fillStyle = color;
            ctx.beginPath();
            // Parte superior
            ctx.moveTo(-width/2, 0);
            ctx.lineTo(width/2, 0);
            ctx.lineTo(width/3, length/2); // Codo/Rodilla
            ctx.lineTo(-width/3, length/2);
            ctx.fill();

            // Parte inferior
            ctx.translate(0, length/2);
            ctx.rotate(dir * (isArm ? 0.2 : -0.1)); // Ligera curva natural hacia adentro o afuera
            
            ctx.beginPath();
            ctx.moveTo(-width/3, 0);
            ctx.lineTo(width/3, 0);
            ctx.lineTo(width/4, length/2); // Muñeca/Tobillo
            ctx.lineTo(-width/4, length/2);
            ctx.fill();

            // Manos/Pies
            ctx.translate(0, length/2);
            ctx.fillStyle = '#111'; // Extremidades oscuras
            ctx.beginPath();
            ctx.ellipse(0, 10, 10, 12, 0, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();
        }
    },

    drawFurPatch: (ctx, x, y, size, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for(let i=0; i<20; i++) {
            const ang = Math.random() * Math.PI;
            const len = Math.random() * size * 0.4;
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(Math.cos(ang)*len, Math.sin(ang)*len - 10);
            ctx.stroke();
        }
        ctx.restore();
    }
};