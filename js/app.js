const bgColor = 0xcccccc;

/* BALL */
const ballRadius = 6;

/* BASKET */
const basketColor = 0x333333;
const basketRadius = ballRadius + 2;
const basketTubeRadius = 0.5;
const basketY = 20;
const basketDistance = 80;

/* EVENTS | MOBILE */
const doubleTapTime = 300;

const world = new WHS.World({
  autoresize: true,
  stats: 'fps',

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

  mass: 10,

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

const wall = ground.clone();
wall.rotation.x = 0;
wall.position.y = 80;
wall.position.z = -basketDistance;

const basket = new WHS.Torus({
  geometry: {
    radius: basketRadius,
    tube: basketTubeRadius,
    radialSegments: 32,
    tubularSegments: 32
  },

  shadow: {
    cast: false
  },

  mass: 0,

  material: {
    kind: 'basic',
    color: basketColor
  },

  pos: {
    y: basketY,
    z: basketRadius + basketTubeRadius - basketDistance
  },

  physics: {
    type: 'concave'
  },

  rot: {
    x: Math.PI / 2
  }
})

// const target = new WHS.Group(wall, basket);
// target.position.z = -40;

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
  }
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
var thrown = false, doubletap = false;
var cursor = {x: 0, y: 0};

function _initEvents() {
  ['mousemove', 'touchmove'].forEach((e) => {
    window.addEventListener(e, updateCoords);
  });

  window.addEventListener('click', throwBall);
  window.addEventListener('keypress', checkKeys);

  const loop = new WHS.Loop(() => {
    if (!thrown) pickBall();
  });

  world.addLoop(loop);
  loop.start();
}

function throwBall() {
  if (detectDoubleTap()) {
    const force = 200;
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
  ball.position.set(x, y, -40);
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