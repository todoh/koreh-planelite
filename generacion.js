/**
 * SISTEMA DE GENERACIÓN (F -> Forma y G -> Granularidad)
 * Centraliza los algoritmos de dibujo procedural.
 */

// CORRECCIÓN: Añadido toCartesian a los imports
import { setSeed, seededRandomRange, toCartesian } from './utils.js';

// Importamos los motores existentes
import { VertebrateEngine } from './motor_vertebrados.js';
import { AquaticEngine } from './motor_acuatico.js';
import { ArachnidEngine } from './motor_aracnido.js';
import { WingedEngine } from './motor_alado.js';

// IMPORTAMOS LOS NUEVOS MOTORES ESPECÍFICOS (F -> Formas Únicas)
import { SimianEngine } from './motor_simios.js';
import { CanineEngine } from './motor_caninos.js';
import { FelineEngine } from './motor_felinos.js';

export const Generators = {
    // 1. VERTEBRADOS GENÉRICOS (Perfil)
    vertebrate: (ctx, width, height, time = 0, seed, config) => {
        setSeed(seed * 1000);
        if (time === 0) ctx.clearRect(0, 0, width, height);
        VertebrateEngine.render(ctx, width, height, time, seed, config);
    },

    // --- NUEVAS CATEGORÍAS (VISTA FRONTAL / DE PIE) ---
    // Usan sus propios motores de lógica (K -> Camino Propio)
    simian: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        SimianEngine.render(ctx, w, h, t, s, c);
    },
    canine: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        CanineEngine.render(ctx, w, h, t, s, c);
    },
    feline: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        FelineEngine.render(ctx, w, h, t, s, c);
    },
    // --------------------------------------------------

    // 2. ACUÁTICOS
    cephalopod: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        AquaticEngine.render(ctx, w, h, t, s, 'cephalopod', c);
    },
    fish: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        AquaticEngine.render(ctx, w, h, t, s, 'fish', c);
    },
    aquatic_mammal: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        AquaticEngine.render(ctx, w, h, t, s, 'aquatic_mammal', c);
    },

    // 3. ARÁCNIDOS
    arachnid: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        ArachnidEngine.render(ctx, w, h, t, s, c);
    },

    // 4. ALADOS
    butterfly: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        WingedEngine.render(ctx, w, h, t, s, 'butterfly', c);
    },
    bird: (ctx, w, h, t, s, c) => {
        setSeed(s * 1000); if (t === 0) ctx.clearRect(0,0,w,h);
        WingedEngine.render(ctx, w, h, t, s, 'bird', c);
    },

    // 5. FLORA Y FAUNA SIMPLE
    tree: (ctx, width, height, time = 0, seed, config) => {
        setSeed(seed * 1000);
        if (time === 0) ctx.clearRect(0, 0, width, height);

        const { colorBranch, colorLeaf, branchAngle, lengthDecay, widthDecay, gravity, leafShape, startLengthFactor } = config;
        const startLength = height * startLengthFactor;
        const initialWidth = width * 0.02;
        
        const drawBranch = (x, y, len, angle, wid, depth, branchSeed) => {
            setSeed(branchSeed);

            ctx.beginPath();
            ctx.save();
            
            const windForce = Math.sin(time * 0.002 + depth * 0.5) * 0.015 * depth; 
            const finalAngle = angle + windForce;
            const hue = seededRandomRange(colorBranch[0], colorBranch[1]);
            
            ctx.strokeStyle = `hsl(${hue}, ${40 + depth * 5}%, ${30 + depth * 5}%)`;
            ctx.lineWidth = wid;
            ctx.lineCap = 'round';
            
            ctx.translate(x, y);
            ctx.rotate(finalAngle);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -len);
            ctx.stroke();

            if (len < 10 || depth > 10) {
                const leafHue = seededRandomRange(colorLeaf[0], colorLeaf[1]);
                ctx.fillStyle = `hsla(${leafHue}, 70%, 50%, 0.7)`;
                ctx.rotate(Math.sin(time * 0.005) * 0.1);

                if (leafShape === 'flower') {
                    ctx.beginPath(); ctx.arc(0, -len, seededRandomRange(3, 6), 0, Math.PI * 2); ctx.fill();
                } else if (leafShape === 'line') {
                    ctx.strokeStyle = `hsla(${leafHue}, 60%, 40%, 0.6)`; 
                    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, seededRandomRange(10, 20)); ctx.stroke();
                } else {
                    ctx.beginPath(); ctx.ellipse(0, -len, 4, 8, 0, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
                return;
            }

            const angleVar = seededRandomRange(branchAngle.min, branchAngle.max);
            const currentGravity = gravity * depth * 0.1;

            drawBranch(0, -len, len * lengthDecay, -angleVar + currentGravity, wid * widthDecay, depth + 1, branchSeed * 1.5 + 1);
            drawBranch(0, -len, len * lengthDecay, angleVar + currentGravity, wid * widthDecay, depth + 1, branchSeed * 1.5 + 2);
            
            if ((Math.sin(branchSeed) * 0.5 + 0.5) > 0.7) {
                 drawBranch(0, -len * 0.7, len * 0.6, seededRandomRange(-0.2, 0.2) + currentGravity, wid * 0.6, depth + 1, branchSeed * 1.5 + 3);
            }
            ctx.restore();
        };

        drawBranch(width / 2, height, startLength, 0, initialWidth, 0, seed * 1000);
    },

    flower: (ctx, width, height, time = 0, seed, config) => {
        setSeed(seed * 1000);
        if (time === 0) ctx.clearRect(0, 0, width, height);
        
        const { petalCount, spread, colorPetal, colorCenter, petalShape, petalWidth, centerRatio } = config;
        const centerX = width / 2;
        const centerY = height / 2;
        const goldenAngle = 137.5 * (Math.PI / 180);
        const breathing = Math.sin(time * 0.001) * 0.05 + 1;
        const rotationAnim = Math.sin(time * 0.0005) * 0.1;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(breathing, breathing); 
        ctx.rotate(rotationAnim);        
        ctx.translate(-centerX, -centerY);

        for (let i = 0; i < petalCount; i++) {
            const angle = i * goldenAngle;
            const radius = spread * Math.sqrt(i);
            const { x, y } = toCartesian(radius, angle);
            
            ctx.save();
            ctx.translate(centerX + x, centerY + y);
            ctx.rotate(angle);
            
            const size = (i / petalCount) * seededRandomRange(8, 12) + 4;
            const isCenter = i < petalCount * centerRatio;
            const hue = isCenter ? seededRandomRange(colorCenter[0], colorCenter[1]) : seededRandomRange(colorPetal[0], colorPetal[1]);
            
            ctx.fillStyle = `hsl(${hue}, ${isCenter ? 50 : 80}%, ${isCenter ? 40 : 60}%)`;
            ctx.beginPath();
            
            if (isCenter) {
                ctx.arc(0, 0, size * 0.5, 0, Math.PI*2);
            } else {
                if (petalShape === 'pointed') {
                    ctx.ellipse(size, 0, size * 1.5, size * petalWidth * 0.5, 0, 0, Math.PI*2);
                } else if (petalShape === 'thin') {
                   ctx.moveTo(0,0); ctx.lineTo(size * 3, 0); ctx.lineWidth = size * 0.3; ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
                } else {
                    ctx.arc(size, 0, size, 0, Math.PI*2);
                }
            }
            if (!isCenter || petalShape !== 'thin') ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    },

    animal: (ctx, width, height, time = 0, seed, config) => {
        setSeed(seed * 1000);
        if (time === 0) ctx.clearRect(0, 0, width, height);
        
        const { segments, baseSize, colorBody, legs, legLength, speed, waveAmplitude, headType } = config;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const wave = Math.sin(time * speed + i * 0.5) * waveAmplitude; 
            const posX = centerX + wave;
            const totalLength = segments * baseSize * 0.9;
            const startY = centerY - (totalLength / 2);
            const posY = startY + (i * baseSize * 0.9);
            const segmentRadius = baseSize * Math.sin(t * Math.PI) + (baseSize * 0.4);

            if (legs && i > 0 && i < segments - 1) {
                ctx.strokeStyle = `hsl(${colorBody[0]}, 30%, 70%)`;
                ctx.lineWidth = 2;
                const legMove = Math.sin(time * (speed * 2) + i) * (legLength * 0.3);
                ctx.beginPath();
                ctx.moveTo(posX, posY);
                ctx.quadraticCurveTo(posX - legLength, posY - 10 + legMove, posX - (legLength * 1.5), posY + 20);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(posX, posY);
                ctx.quadraticCurveTo(posX + legLength, posY - 10 - legMove, posX + (legLength * 1.5), posY + 20);
                ctx.stroke();
            }

            const hue = seededRandomRange(colorBody[0], colorBody[1]);
            ctx.fillStyle = `hsl(${hue}, 70%, ${50 + Math.sin(time * speed + i) * 10}%)`;
            
            ctx.beginPath();
            ctx.ellipse(posX, posY, segmentRadius, segmentRadius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            if (i === 0) {
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (headType === 'antenna') {
                   ctx.moveTo(posX - 5, posY); ctx.quadraticCurveTo(posX - 20, posY - 30, posX - 30 + Math.sin(time*0.01)*10, posY - 50);
                   ctx.moveTo(posX + 5, posY); ctx.quadraticCurveTo(posX + 20, posY - 30, posX + 30 + Math.sin(time*0.01)*10, posY - 50);
                } else if (headType === 'pincers') {
                   ctx.lineWidth = 4; ctx.moveTo(posX - 5, posY); ctx.lineTo(posX - 20, posY - 30);
                   ctx.moveTo(posX + 5, posY); ctx.lineTo(posX + 20, posY - 30);
                }
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(posX - segmentRadius*0.5, posY - 5, 4, 0, Math.PI*2);
                ctx.arc(posX + segmentRadius*0.5, posY - 5, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
};