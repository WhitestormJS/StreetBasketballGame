/* === GLOABAL === */
let helpersActive = true;

/* === APP === */

const bgColor = 0xcccccc;

/* BALL */
const ballRadius = 6;

/* BASKET */
const basketColor = 0x333333;
const basketRadius = ballRadius + 2;
const basketTubeRadius = 0.5;
const basketY = 20;
const basketDistance = 80;
const basketZ = basketRadius + basketTubeRadius * 2 - basketDistance;

/* GOAL */
const basketGoalDiff = 2;
const basketYGoalDiff = 0.5;
const goalDuration = 800;

/* EVENTS | MOBILE */
const doubleTapTime = 300;

const world = new WHS.World({
  autoresize: true,
  stats: 'fps',
  softbody: true,

  background: {
    color: bgColor
  },

  camera: {
    z: 50,
    y: basketY,
    aspect: 45
  },

  gravity: {
    y: -200
  }
});

const ball = new WHS.Sphere({
  geometry: {
    radius: ballRadius, 
    widthSegments: 32,
    heightSegments: 32
  },

  mass: 120,

  material: {
    kind: 'phong',
    map: WHS.texture('./textures/ball.png'),
    normalMap: WHS.texture('./textures/ball_normal.png'),
    shininess: 20,
    reflectivity: 2,
    normalScale: new THREE.Vector2(0.5, 0.5)
  },

  physics: {
    restitution: 3
  }
});

const ground = new WHS.Plane({
  geometry: {
    width: 250,
    height: 200
  },

  mass: 0,

  material: {
    kind: 'phong',
    color: bgColor
  },

  pos: {
    y: -20,
    z: 20
  },

  rot: {
    x: -Math.PI / 2
  }
});

const wall = new WHS.Plane({
  geometry: {
    width: 250,
    depth: 1,
    height: 200
  },

  mass: 0,

  material: {
    kind: 'phong',
    color: bgColor
  },

  pos: {
    y: 80,
    z: -basketDistance
  }
});

const backboard = new WHS.Box({
  geometry: {
    width: 41,
    depth: 1,
    height: 28
  },

  mass: 0,

  material: {
    kind: 'standard',
    map: WHS.texture('./textures/backboard.jpg'),
    normalMap: WHS.texture('./textures/backboard_normal.png'),
    displacementMap: WHS.texture('./textures/backboard_displacement.png'),
    normalScale: new THREE.Vector2(0.3, 0.3),
    metalness: 0,
    roughness: 0.3
  },

  pos: {
    y: basketY + 10,
    z: basketZ - basketRadius
  }
});

backboard.addTo(world);

const basket = new WHS.Torus({
  geometry: {
    radius: basketRadius,
    tube: basketTubeRadius,
    radialSegments: 16,
    tubularSegments: 16
  },

  shadow: {
    cast: false
  },

  mass: 0,

  material: {
    kind: 'standard',
    color: 0xff0000,
    metalness: 0.8,
    roughness: 0.5,
    emissive: 0xffccff,
    emissiveIntensity: 0.2
  },

  pos: {
    y: basketY,
    z: basketZ
  },

  physics: {
    type: 'concave'
  },

  rot: {
    x: Math.PI / 2
  }
});

const net = new WHS.Cylinder({ // Softbody (blue).
  geometry: {
    radiusTop: basketRadius,
    radiusBottom: basketRadius - 3,
    height: 15,
    openEnded: true,
    heightSegments: 3,
    radiusSegments: 16
  },

  shadow: {
    cast: false
  },

  physics: {
    pressure: 1000,
    friction: 0.02,
    margin: 0.3,
    anchorHardness: 0.4
  },

  mass: 30,
  softbody: true,

  material: {
    map: WHS.texture('./textures/net4.png', {repeat: {y: 0.7, x: 2}, offset: {y: 0.3}}), // 0.85, 19
    transparent: true,
    opacity: 0.7,
    kind: 'basic',
    side: THREE.DoubleSide,
    depthWrite: false
  },

  pos: {
    y: basketY - 20 + basketZ,
    z: -12
  },

  rot: {
    x: -Math.PI / 2
  }
});

net.addTo(world).then(() => {
  net.getNative().frustumCulled = false;

  for (let i = 0; i < 16; i++) {
    net.appendAnchor(world, basket, i, 0.1, false);
  }
});

ball.addTo(world);
ground.addTo(world);
wall.addTo(world);
basket.addTo(world);

new WHS.PointLight({
  light: {
    distance: 100,
    intensity: 1,
    angle: Math.PI
  },

  shadowmap: {
    width: 1024,
    height: 1024,

    left: -50,
    right: 50,
    top: 50,
    bottom: -50,

    far: 80,

    fov: 90,
  },

  pos: {
    y: 60,
    z: -40
  },
}).addTo(world);

new WHS.AmbientLight({
  light: {
    intensity: 0.3
  }
}).addTo(world);

// world.setControls(WHS.orbitControls());

world.getCamera().lookAt(new THREE.Vector3(0, basketY, 0));

world.start();
_initEvents();

/* PLAY */
let thrown = false, doubletap = false, goal = false;
let cursor = {x: 0, y: 0};

function _initEvents() {
  ['mousemove', 'touchmove'].forEach((e) => {
    window.addEventListener(e, updateCoords);
  });

  window.addEventListener('click', throwBall);
  window.addEventListener('keypress', checkKeys);

  const loop = new WHS.Loop(() => {
    if (!thrown) pickBall();
    if (ball.position.distanceTo(basket.position) < basketGoalDiff
      && Math.abs(ball.position.y - basket.position.y) < basketYGoalDiff 
      && !goal) {
      
      if (helpersActive) {
        document.querySelector('.helpers').className += ' deactivated';
        helpersActive = false;
      }

      goal = true;
      setTimeout(() => goal = false, goalDuration);
    }
  });

  world.addLoop(loop);
  loop.start();
}

function throwBall() {
  if (detectDoubleTap()) {
    const force = 2400;
    const vector = {
      x: cursor.x - window.innerWidth / 2, 
      y: 6.2 * force,
      z: -2 * force
    };

    if (!thrown) ball.applyCentralImpulse(vector);
    thrown = true;
  }
}

function updateCoords(e) {
  cursor.x = e.clientX || e.touches[0].clientX;
  cursor.y = e.clientY || e.touches[0].clientY;
}

function checkKeys(e) {
  if (e.code === "Space") thrown = false;
}

function pickBall() {
  const xCenter = window.innerWidth / 2;
  const yCenter = window.innerHeight / 2;
  const intensity = 32;
  const x = (cursor.x - xCenter) / window.innerWidth * intensity;
  const y = - (cursor.y - yCenter) / window.innerHeight * intensity;

  ball.setLinearVelocity(new THREE.Vector3(0, 0, 0)); // Reset gravity affect.
  ball.position.set(x, y, -36);
}

function detectDoubleTap() {
  if (!doubletap) {
    doubletap = true;

    setTimeout(() => {
      doubletap = false;
    }, doubleTapTime);

    return true;
  } else {
    thrown = false;
    doubletap = true;

    return false;
  }
}