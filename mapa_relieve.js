/**
 * MAPA DE RELIEVE Y CLIMA V5 (Gigantismo Continental)
 * - Continentes masivos y montañas reales.
 * - Eliminación de grietas/cañones.
 * - Reducción drástica del nivel del mar.
 */

// --- IMPLEMENTACIÓN RUIDO SIMPLEX EXTENDIDA (2D y 3D) ---
const Simplex = {
    p: new Uint8Array(256),
    perm: new Uint8Array(512),
    grad3: [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],
    
    seed(seed) {
        for(let i=0; i<256; i++) this.p[i] = Math.floor((Math.sin(seed * 100 + i) * 0.5 + 0.5) * 256);
        for(let i=0; i<512; i++) this.perm[i] = this.p[i & 255];
    },

    dot(g, x, y, z = 0) { return g[0]*x + g[1]*y + g[2]*z; },

    // Ruido 2D
    noise(xin, yin) {
        const F2 = 0.5*(Math.sqrt(3.0)-1.0);
        const G2 = (3.0-Math.sqrt(3.0))/6.0;
        let s = (xin+yin)*F2; 
        let i = Math.floor(xin+s); let j = Math.floor(yin+s);
        let t = (i+j)*G2;
        let X0 = i-t; let Y0 = j-t;
        let x0 = xin-X0; let y0 = yin-Y0;
        let i1, j1;
        if(x0>y0) {i1=1; j1=0;} else {i1=0; j1=1;}
        let x1 = x0 - i1 + G2; let y1 = y0 - j1 + G2;
        let x2 = x0 - 1.0 + 2.0 * G2; let y2 = y0 - 1.0 + 2.0 * G2;
        let ii = i & 255; let jj = j & 255;
        
        let gi0 = this.perm[ii+this.perm[jj]] % 12;
        let gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
        let gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
        
        let t0 = 0.5 - x0*x0 - y0*y0;
        let n0 = t0<0 ? 0.0 : Math.pow(t0, 4) * this.dot(this.grad3[gi0], x0, y0);
        let t1 = 0.5 - x1*x1 - y1*y1;
        let n1 = t1<0 ? 0.0 : Math.pow(t1, 4) * this.dot(this.grad3[gi1], x1, y1);
        let t2 = 0.5 - x2*x2 - y2*y2;
        let n2 = t2<0 ? 0.0 : Math.pow(t2, 4) * this.dot(this.grad3[gi2], x2, y2);

        return 70.0 * (n0 + n1 + n2);
    },

    // Ruido 3D
    noise3D(xin, yin, zin) {
        let F3 = 1.0/3.0;
        let s = (xin+yin+zin)*F3;
        let i = Math.floor(xin+s);
        let j = Math.floor(yin+s);
        let k = Math.floor(zin+s);
        let G3 = 1.0/6.0;
        let t = (i+j+k)*G3;
        let X0 = i-t; let Y0 = j-t; let Z0 = k-t;
        let x0 = xin-X0; let y0 = yin-Y0; let z0 = zin-Z0;
        let i1, j1, k1; let i2, j2, k2;
        if(x0>=y0) {
            if(y0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }
        let x1 = x0 - i1 + G3; let y1 = y0 - j1 + G3; let z1 = z0 - k1 + G3;
        let x2 = x0 - i2 + 2.0*G3; let y2 = y0 - j2 + 2.0*G3; let z2 = z0 - k2 + 2.0*G3;
        let x3 = x0 - 1.0 + 3.0*G3; let y3 = y0 - 1.0 + 3.0*G3; let z3 = z0 - 1.0 + 3.0*G3;
        
        let ii = i & 255; let jj = j & 255; let kk = k & 255;
        
        let gi0 = this.perm[ii+this.perm[jj+this.perm[kk]]] % 12;
        let gi1 = this.perm[ii+i1+this.perm[jj+j1+this.perm[kk+k1]]] % 12;
        let gi2 = this.perm[ii+i2+this.perm[jj+j2+this.perm[kk+k2]]] % 12;
        let gi3 = this.perm[ii+1+this.perm[jj+1+this.perm[kk+1]]] % 12;
        
        let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        let n0 = t0<0 ? 0.0 : Math.pow(t0, 4) * this.dot(this.grad3[gi0], x0, y0, z0);
        let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        let n1 = t1<0 ? 0.0 : Math.pow(t1, 4) * this.dot(this.grad3[gi1], x1, y1, z1);
        let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        let n2 = t2<0 ? 0.0 : Math.pow(t2, 4) * this.dot(this.grad3[gi2], x2, y2, z2);
        let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        let n3 = t3<0 ? 0.0 : Math.pow(t3, 4) * this.dot(this.grad3[gi3], x3, y3, z3);
        
        return 32.0 * (n0 + n1 + n2 + n3);
    }
};

export const TerrainHeight = {
    seedVal: 0,

    setSeed(s) {
        this.seedVal = s;
        Simplex.seed(s);
    },

    fbm(x, z, octaves, persistence, lacunarity, scale) {
        let total = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;  
        for(let i=0; i<octaves; i++) {
            total += Simplex.noise(x * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue; 
    },

    ridgedNoise(x, z, octaves, persistence, lacunarity, scale) {
        let total = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;
        for(let i=0; i<octaves; i++) {
            let n = 1.0 - Math.abs(Simplex.noise(x * frequency, z * frequency));
            n = n * n * n; // Picos más afilados
            total += n * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue;
    },

    // --- SUPERFICIE (Heightmap 2D) ---
    get(x, z) {
        // 1. Continentes Extensos
        // Escala reducida a 0.00015 para biomas más grandes
        let continent = this.fbm(x, z, 3, 0.5, 2.0, 0.00015); 
        
        // Offset positivo (+40) para reducir océanos drásticamente
        let h = (continent * 250) + 40; 

        // Suavizado de costas
        if (h < 10 && h > -10) {
            h = h * 0.8; // Playas suaves
        }

        // 2. Montañas Majestuosas
        // Mascara para decidir dónde van las montañas (grandes cordilleras)
        let mountainMask = this.fbm(x + 500, z + 500, 2, 0.5, 2.0, 0.0002);
        
        // Umbral más alto para montañas, pero más altas cuando aparecen
        mountainMask = Math.max(0, (mountainMask - 0.3) * 2.5); 

        if (mountainMask > 0) {
            // Montañas mucho más altas (Multiplicador 450)
            let mountainRidge = this.ridgedNoise(x, z, 6, 0.5, 2.0, 0.001);
            h += (mountainRidge * 450) * mountainMask;
        }

        // 3. Detalle de terreno (Colinas suaves en los bosques)
        let detail = this.fbm(x, z, 3, 0.5, 2.0, 0.01) * 15;
        h += detail;

        // NOTA: Se han eliminado las grietas (ValleyNoise) para evitar partir el suelo.

        return h;
    },

    // --- SUBTERRÁNEO (Volumétrico 3D) ---
    isCave(x, y, z) {
        if (y < -100) return false; 
        
        const caveA = Simplex.noise3D(x * 0.008, y * 0.015, z * 0.008);
        const caveB = Simplex.noise3D(x * 0.008 + 100, y * 0.015 + 100, z * 0.008 + 100);
        
        const tunnelNoise = Math.abs(caveA) + Math.abs(caveB);
        const isTunnel = tunnelNoise < 0.22; 

        const cavernNoise = Simplex.noise3D(x * 0.003, y * 0.005, z * 0.003);
        const isCavern = cavernNoise > 0.6;

        return isTunnel || isCavern;
    },

    // Humedad a gran escala para bosques extensos
    getMoisture(x, z) {
        // Escala reducida a 0.0002 para que los biomas sean enormes
        let m = this.fbm(x + 1230, z - 450, 2, 0.5, 2.0, 0.0002);
        return (m + 1) * 0.5; 
    },
    
    isLava(x, z) {
        // Volcanes muy raros
        let volcanoChance = Simplex.noise(x * 0.0001, z * 0.0001);
        return (volcanoChance > 0.97); 
    }
};