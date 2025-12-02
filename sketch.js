let obras = [];
let cantidadFilas = 5;
let cantidadColumnas = 5;
let separacion = 250; // Distancia entre modelos

function setup() {
  // B -> Visión: Activamos el modo WEBGL para percepción 3D
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Generamos la galería proceduralmente
  let inicioX = -(cantidadColumnas * separacion) / 2 + separacion / 2;
  let inicioZ = -(cantidadFilas * separacion) / 2 + separacion / 2;

  for (let i = 0; i < cantidadColumnas; i++) {
    for (let j = 0; j < cantidadFilas; j++) {
      let x = inicioX + i * separacion;
      let z = inicioZ + j * separacion;
      // Creamos una nueva "Forma" (F) en cada posición
      obras.push(new ModeloProcedural(x, 0, z));
    }
  }
}

function draw() {
  background(30); // Fondo oscuro para resaltar la materia
  
  // K -> Camino: Permite al usuario moverse por el espacio con el mouse
  orbitControl(); 

  // Iluminación
  ambientLight(60); // Luz base
  pointLight(255, 255, 255, 0, -500, 500); // Foco de luz principal
  directionalLight(200, 100, 100, 1, 1, -1); // Luz de acento rojiza

  // Dibujamos el suelo (referencia espacial)
  push();
  rotateX(HALF_PI);
  fill(50);
  noStroke();
  plane(2000, 2000);
  pop();

  // Iteramos sobre cada obra para dibujarla
  for (let obra of obras) {
    obra.actualizar();
    obra.dibujar();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- CLASE DE OBJETO 3D ---
class ModeloProcedural {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    // W -> Variedad: Elegimos un tipo de geometría al azar
    this.tipo = int(random(4)); 
    this.color = color(random(100, 255), random(100, 255), random(200, 255));
    this.tamano = random(50, 80);
    
    // Velocidades de rotación únicas para cada objeto (J -> Juegos)
    this.rotX = random(-0.02, 0.02);
    this.rotY = random(-0.02, 0.02);
    this.angulo = createVector(random(TWO_PI), random(TWO_PI));
    
    // Detalle extra flotante
    this.tieneSatelite = random() > 0.5;
  }

  actualizar() {
    // Animación de rotación constante
    this.angulo.x += this.rotX;
    this.angulo.y += this.rotY;
    
    // Pequeña levitación (oscilación en Y)
    this.pos.y = sin(frameCount * 0.02 + this.pos.x) * 10 - 50; 
  }

  dibujar() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    
    // Aplicamos rotación local
    rotateX(this.angulo.x);
    rotateY(this.angulo.y);

    // Material (M)
    // specularMaterial refleja la luz, ambientMaterial absorbe el color
    noStroke();
    specularMaterial(255); 
    ambientMaterial(this.color);
    shininess(50);

    // Selección de la Forma (F)
    switch (this.tipo) {
      case 0:
        box(this.tamano);
        break;
      case 1:
        sphere(this.tamano / 1.5);
        break;
      case 2:
        torus(this.tamano / 2, this.tamano / 6);
        break;
      case 3:
        cone(this.tamano / 2, this.tamano);
        break;
    }

    // Elemento secundario (Satelite)
    if (this.tieneSatelite) {
      push();
      rotateY(frameCount * 0.05);
      translate(this.tamano, 0, 0);
      emissiveMaterial(255, 200, 100); // Material que brilla
      sphere(10);
      pop();
    }

    pop();
    
    // Base/Pedestal
    push();
    translate(this.pos.x, 50, this.pos.z); // En el suelo
    fill(80);
    box(this.tamano, 10, this.tamano);
    pop();
  }
}