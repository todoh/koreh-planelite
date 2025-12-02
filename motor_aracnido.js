/**
 * MOTOR ARÁCNIDO AVANZADO V3 (Z -> Profundidad Correcta)
 * - Corrección de perspectiva: El cuerpo ahora cubre el nacimiento de las patas (Vista Dorsal).
 * - Sombras de contacto para "pegar" el arácnido al suelo.
 * - Orientación frontal mantenida.
 */

// IMPORTAR DESDE UTILS.JS
import { seededRandomRange } from './utils.js';

export const ArachnidEngine = {
    
    render: (ctx, width, height, time, seed, config) => {
        const { legCount, colorBody, hasStinger } = config;
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);

        // 1. ORIENTACIÓN: Rotamos 180° para que miren al frente (abajo de la pantalla)
      //  ctx.rotate(Math.PI);

        // K -> Ki (Respiración)
        const breathe = Math.sin(time * 0.002) * 0.015 + 1;
        ctx.scale(breathe, breathe);

        // Paleta de Colores
        const hue = seededRandomRange(colorBody[0], colorBody[1]);
        const sat = 40; const lit = 25;
        
        const colors = {
            base: `hsl(${hue}, ${sat}%, ${lit}%)`,
            dark: `hsl(${hue}, ${sat}%, ${lit - 18}%)`, // Más oscuro para contraste
            highlight: `hsl(${hue}, ${sat}%, ${lit + 25}%)`,
            joint: `hsl(${hue}, ${sat - 10}%, ${lit + 8}%)`,
            eye: hasStinger ? '#111' : '#c00', 
            venom: hasStinger ? '#d80' : '#d00',
            shadow: 'rgba(0,0,0,0.4)'
        };

        // --- GESTIÓN DE CAPAS (Z) CORREGIDA PARA VISTA SUPERIOR ---
        // Orden: Sombras -> Patas -> Apéndices -> Cuerpo -> Cola

        // CAPA 0: SOMBRA DEL CUERPO (Para pegarlo al suelo)
        ctx.save();
        ctx.translate(0, -5); // La sombra cae un poco "atrás" visualmente
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.filter = 'blur(10px)';
        ctx.beginPath();
        ctx.ellipse(0, 0, config.bodySize * 1.5, config.bodySize * 2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.filter = 'none';
        ctx.restore();

        // CAPA 1: PATAS (Dibujadas PRIMERO para que salgan de DEBAJO del cuerpo)
        for (let i = 0; i < legCount; i++) {
            const isRight = i % 2 === 0;
            const sideDir = isRight ? 1 : -1;
            const pairIndex = Math.floor(i / 2);
            ArachnidParts.drawLeg(ctx, time, seed + i, i, pairIndex, sideDir, config, colors);
        }

        // CAPA 2: PEDIPALPOS / PINZAS (Intermedio)
        if (hasStinger) {
            ArachnidParts.drawScorpionClaws(ctx, time, seed, config, colors);
        } else {
            ArachnidParts.drawSpiderPedipalps(ctx, time, seed, config, colors);
        }

        // CAPA 3: CUERPO (Dibuja SOBRE las patas para ocultar las inserciones)
        // Abdomen (Opisthosoma)
        ArachnidParts.drawAbdomen(ctx, time, seed, config, colors);
        
        // Cefalotórax (Prosoma) - Este es el escudo principal
        ArachnidParts.drawCephalothorax(ctx, time, seed, config, colors);

        // CAPA 4: COLA (Solo Escorpiones - Debe estar ARRIBA de todo)
        if (hasStinger) {
            ArachnidParts.drawScorpionTail(ctx, time, seed, config, colors);
        }

        ctx.restore();
    }
};

/**
 * SUB-MOTOR DE PARTES ANATÓMICAS
 */
const ArachnidParts = {
    
    drawLeg: (ctx, time, seed, legIndex, pairIndex, side, config, colors) => {
        const { legSpan, aggressiveness, hasStinger } = config;
        
        const speed = 0.005 * (aggressiveness * 0.5 + 0.5);
        const gaitPhase = (legIndex % 2 === 0 ? 0 : Math.PI); 
        const animTime = time * speed + gaitPhase + seed;

        const swingBase = pairIndex * 0.35; // Ángulo un poco más abierto
        const swingAnim = Math.cos(animTime) * 0.25 * aggressiveness;
        const totalHipAngle = swingBase + swingAnim;

        // Lift logic
        const liftAnim = Math.max(0, Math.sin(animTime - Math.PI/4)) * (0.5 * aggressiveness);
        
        ctx.save();
        ctx.scale(side, 1);

        // Anclaje: Las patas nacen "dentro" del área del cuerpo visualmente
        const anchorX = 4; 
        const anchorY = (pairIndex * 5) - 6; 
        ctx.translate(anchorX, anchorY);

        // Rotación de cadera
        ctx.rotate(totalHipAngle);

        const stoutness = hasStinger ? 1.2 : 1.0;
        const femurLen = legSpan * 0.35;
        const tibiaLen = legSpan * 0.35;
        const tarsusLen = legSpan * 0.3;

        // --- SOMBRA DE PATA INDIVIDUAL (G - Granularidad de contacto) ---
        // Dibujamos una pequeña sombra donde la pata tocaría el suelo
        if (liftAnim < 0.1) { // Solo si está tocando el suelo
            ctx.save();
            // Calculamos posición aproximada de la punta (matemática simplificada visual)
            const tipDist = femurLen + tibiaLen * 0.5 + tarsusLen; 
            ctx.translate(tipDist, 0); 
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 5, 4, 2, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // COXA (Oculta parcialmente por el cuerpo ahora)
        ArachnidParts.drawSegment(ctx, 8, 5*stoutness, 4*stoutness, colors.dark, colors.dark);
        ctx.translate(6, 0);

        // FÉMUR (Sube visualmente = rodilla alta)
        // Ajustamos los ángulos para que parezca que la rodilla sube en Z
        ctx.rotate(-0.8 - liftAnim); 
        ArachnidParts.drawSegment(ctx, femurLen, 5*stoutness, 4*stoutness, colors.base, colors.dark);
        
        // Rodilla (Articulación)
        ctx.fillStyle = colors.joint;
        ctx.beginPath(); ctx.arc(femurLen, 0, 3*stoutness, 0, Math.PI*2); ctx.fill();
        ctx.translate(femurLen, 0);

        // TIBIA (Baja hacia el suelo)
        ctx.rotate(1.8 + liftAnim * 1.5); 
        ArachnidParts.drawSegment(ctx, tibiaLen, 4*stoutness, 3*stoutness, colors.base, colors.dark);
        ctx.translate(tibiaLen, 0);

        // TARSO (Apoya en el suelo)
        ctx.rotate(-0.5); 
        ArachnidParts.drawSegment(ctx, tarsusLen, 2.5*stoutness, 1*stoutness, colors.dark, colors.dark);

        // Pelos sensoriales (M -> Material)
        if (!hasStinger && aggressiveness > 0.1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 0.5;
            for(let j=0; j<6; j++) {
                const hairLen = seededRandomRange(3, 6);
                ctx.beginPath(); ctx.moveTo(j*3, 0); ctx.lineTo(j*3 - 1, hairLen); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(j*3, 0); ctx.lineTo(j*3 - 1, -hairLen); ctx.stroke();
            }
        }
        ctx.restore();
    },

    drawSegment: (ctx, length, widthStart, widthEnd, colorFill, colorBorder) => {
        ctx.beginPath();
        ctx.moveTo(0, -widthStart/2);
        ctx.lineTo(length, -widthEnd/2);
        ctx.lineTo(length, widthEnd/2);
        ctx.lineTo(0, widthStart/2);
        ctx.closePath();
        
        // M -> Material: Gradiente ajustado para simular luz cenital (Top-Down)
        // Al estar rotado el canvas, la luz debe ser consistente
        const grad = ctx.createLinearGradient(0, -widthStart/2, 0, widthStart/2);
        grad.addColorStop(0, 'rgba(0,0,0,0.5)'); // Borde "abajo" visualmente (sombra propia)
        grad.addColorStop(0.3, colorFill); // Color base
        grad.addColorStop(0.5, 'rgba(255,255,255,0.2)'); // Brillo especular "arriba"
        grad.addColorStop(1, colorFill);

        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.strokeStyle = colorBorder; 
        ctx.lineWidth = 1; 
        ctx.stroke();
    },

    drawCephalothorax: (ctx, time, seed, config, colors) => {
        const { bodySize, hasStinger } = config;
        ctx.save();
        ctx.translate(0, -2); 

        // Caparazón principal
        ctx.fillStyle = colors.base;
        
        // Sombreado de volumen (Esfera aplastada)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bodySize);
        grad.addColorStop(0, colors.highlight);
        grad.addColorStop(0.8, colors.base);
        grad.addColorStop(1, colors.dark);
        ctx.fillStyle = grad;

        ctx.beginPath();
        if (hasStinger) {
            ctx.moveTo(-bodySize * 0.7, 8);
            ctx.lineTo(-bodySize * 0.6, -10);
            ctx.quadraticCurveTo(0, -14, bodySize * 0.6, -10);
            ctx.lineTo(bodySize * 0.7, 8);
            ctx.quadraticCurveTo(0, 12, -bodySize * 0.7, 8);
        } else {
            ctx.moveTo(-bodySize * 0.6, 2);
            ctx.bezierCurveTo(-bodySize * 0.8, -8, -bodySize * 0.3, -15, 0, -16);
            ctx.bezierCurveTo(bodySize * 0.3, -15, bodySize * 0.8, -8, bodySize * 0.6, 2);
            ctx.quadraticCurveTo(0, 15, -bodySize * 0.6, 2);
        }
        ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = colors.dark; ctx.stroke();

        // Ojos y Mandíbulas
        const faceY = hasStinger ? 10 : 12;
        
        // QUELÍCEROS (Mandíbulas) - Dibujados DEBAJO del borde frontal para profundidad
        ctx.save();
        ctx.translate(0, faceY - 2); 
        ctx.fillStyle = colors.dark;
        for(let dir of [-1, 1]) {
            ctx.save();
            ctx.scale(dir, 1);
            ctx.translate(2, 0);
            ctx.rotate(-0.1); 
            ctx.beginPath(); ctx.rect(-2, 0, 4, 8); ctx.fill();
            ctx.fillStyle = hasStinger ? '#000' : colors.venom;
            ctx.beginPath(); ctx.moveTo(2, 8); ctx.quadraticCurveTo(0, 14, -3, 10); ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // OJOS (Torreta ocular) - Brillo arriba
        ctx.translate(0, faceY - 6);
        ctx.fillStyle = colors.dark;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI*2); ctx.fill(); 
        
        ctx.fillStyle = colors.eye;
        ctx.beginPath(); ctx.arc(-2, 1, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(2, 1, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-2.5, 0.5, 0.8, 0, Math.PI*2); ctx.fill(); // Reflejo arriba-izq
        ctx.beginPath(); ctx.arc(1.5, 0.5, 0.8, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    drawAbdomen: (ctx, time, seed, config, colors) => {
        const { bodySize, hasStinger, id } = config;
        ctx.save();
        
        if (hasStinger) {
            // ESCORPIÓN
            ctx.translate(0, -12);
            for(let i=0; i<7; i++) {
                const w = bodySize * (1.1 - i*0.08);
                const len = 6;
                ctx.fillStyle = i % 2 === 0 ? colors.base : colors.dark;
                ctx.beginPath();
                ctx.roundRect(-w/2, -i*len, w, len, 2);
                ctx.fill();
                // Sombra entre segmentos
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.rect(-w/2, -i*len + len -1, w, 1); ctx.fill();
            }
        } else {
            // ARAÑA
            ctx.translate(0, -bodySize * 0.5);
            // Gradiente 3D esférico
            const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, bodySize * 1.4);
            grad.addColorStop(0, colors.highlight);
            grad.addColorStop(0.5, colors.base);
            grad.addColorStop(1, 'rgba(0,0,0,0.8)'); // Sombra propia fuerte
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, bodySize * 1.3, bodySize * 1.5, 0, 0, Math.PI*2);
            ctx.fill();

            // Marca Viuda
            if (id && id.includes('widow')) {
                ctx.fillStyle = colors.venom;
                ctx.save(); ctx.translate(0, bodySize*0.5); ctx.scale(1, -1);
                ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(4, 12); ctx.lineTo(0, 6); ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    },

    drawScorpionTail: (ctx, time, seed, config, colors) => {
        const { tailLength, bodySize, aggressiveness } = config;
        ctx.save();
        
        const mesosomaLen = 7 * 6; 
        ctx.translate(0, -12 - mesosomaLen); 

        // Animación orgánica
        const threatPose = aggressiveness * 0.8;
        let angleSum = 0;

        const segments = 5;
        const segLen = tailLength / segments;
        
        for(let i=0; i<segments; i++) {
            const baseCurve = Math.PI * 0.15; 
            const animCurve = (Math.sin(time * 0.004 + i) * 0.05 * threatPose);
            const segAngle = baseCurve + animCurve;
            angleSum += segAngle;

            ctx.rotate(segAngle);
            
            const w = (bodySize * 0.5) * (1 - i*0.15); 
            
            // Gradiente cilíndrico
            const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
            grad.addColorStop(0, colors.dark);
            grad.addColorStop(0.5, colors.base);
            grad.addColorStop(1, colors.dark);
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(-w/2, 0); 
            ctx.lineTo(-w/2*0.9, segLen);
            ctx.lineTo(w/2*0.9, segLen);
            ctx.lineTo(w/2, 0);
            ctx.fill();
            
            ctx.translate(0, segLen);
        }

        // Aguijón
        ctx.rotate(Math.PI * 0.3);
        
        ctx.fillStyle = colors.venom;
        ctx.beginPath();
        ctx.ellipse(0, 6, 7, 9, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Brillo venenoso
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.ellipse(-2, 4, 2, 3, 0.5, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = colors.venom;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.quadraticCurveTo(0, 25, 12, 22); 
        ctx.lineTo(3, 16);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(11, 21, 1.5, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    drawScorpionClaws: (ctx, time, seed, config, colors) => {
        const { bodySize, aggressiveness } = config;
        const stoutness = 1.3;
        
        for(let dir of [-1, 1]) {
            ctx.save();
            ctx.scale(dir, 1);
            ctx.translate(bodySize * 0.8, 8); 
            
            const threatenAnim = Math.sin(time * 0.003) * 0.2 * aggressiveness;

            ctx.rotate(0.8 - threatenAnim);
            ArachnidParts.drawSegment(ctx, 25, 8*stoutness, 6*stoutness, colors.dark, '#000');
            ctx.translate(25, 0);
            
            ctx.rotate(-1.2 + threatenAnim * 0.5);
            ArachnidParts.drawSegment(ctx, 20, 7*stoutness, 9*stoutness, colors.base, '#000');
            ctx.translate(20, 0);

            ctx.rotate(0.4); 
            
            const openAnim = (Math.sin(time * 0.01 + seed) + 1) * 0.3 * aggressiveness;
            
            ctx.fillStyle = colors.base;
            ctx.beginPath(); ctx.ellipse(12, 0, 14*stoutness, 10*stoutness, 0, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = colors.dark;
            ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(40, -3, 45, 2); ctx.lineTo(22, 5); ctx.fill();
            
            ctx.save();
            ctx.translate(22, 6);
            ctx.rotate(openAnim); 
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, 5, 23, -4); ctx.lineTo(0, -2); ctx.fill();
            ctx.restore();

            ctx.restore();
        }
    },

    drawSpiderPedipalps: (ctx, time, seed, config, colors) => {
        for(let dir of [-1, 1]) {
            ctx.save();
            ctx.scale(dir, 1);
            ctx.translate(6, 18); 
            
            const feelAnim = Math.sin(time * 0.008 + dir + seed) * 0.3;
            ctx.rotate(feelAnim); 

            ArachnidParts.drawSegment(ctx, 10, 4, 3, colors.base, colors.dark);
            ctx.translate(10, 0);
            ctx.rotate(-0.5);
            ArachnidParts.drawSegment(ctx, 8, 3, 2, colors.base, colors.dark);
            
            ctx.translate(8,0);
            ctx.fillStyle = colors.dark;
            ctx.beginPath(); ctx.ellipse(0, 0, 3, 4, 0, 0, Math.PI*2); ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
            for(let i=0; i<4; i++) {
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(seededRandomRange(-3,3), seededRandomRange(4,8)); ctx.stroke();
            }

            ctx.restore();
        }
    }
};