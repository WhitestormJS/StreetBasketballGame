const bgColor = 0xcccccc;

/* BALL */
const ballRadius = 6;

/* BASKET */
const basketColor = 0x333333;
const basketRadius = ballRadius + 2;
const basketTubeRadius = 0.5;
const basketY = 20;
const basketDistance = 80;

const world = new WHS.World({
  autoresize: true,

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
  },

  rWidth: 2,
  rHeight: 2
});

const ball = new WHS.Sphere({
  geometry: {
    radius: ballRadius, 
    widthSegments: 32,
    heightSegments: 32
  },

  mass: 10,

  material: {
    kind: 'basic',
    map: WHS.texture('./textures/ball.png')
  },

  physics: {
    restitution: 3
  },

  pos: {
    z: -20
  }
});

const ground = new WHS.Box({
  geometry: {
    width: 250,
    depth: 250
  },

  mass: 0,

  material: {
    kind: 'basic',
    color: bgColor
  },

  pos: {
    y: -20
  }
});

const wall = ground.clone();
wall.rotation.x = Math.PI / 2;
wall.position.z = -basketDistance;

const basket = new WHS.Torus({
  geometry: {
    radius: basketRadius,
    tube: basketTubeRadius,
    radialSegments: 32,
    tubularSegments: 32
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

// world.setControls(WHS.orbitControls());

world.getCamera().lookAt(new THREE.Vector3(0, basketY, 0));

world.start();
_initEvents();

/* PLAY */
var thrown = false;
var cursor = {x: 0, y: 0};

function _initEvents() {
  window.addEventListener('click', throwBall);
  window.addEventListener('mousemove', updateCoords);
  window.addEventListener('keypress', checkKeys);

  const loop = new WHS.Loop(() => {
    if (!thrown) pickBall();
  });

  world.addLoop(loop);
  loop.start();
}

function throwBall() {
  const force = 200;
  const vector = {
    x: cursor.x - window.innerWidth / 2, 
    y: 6.2 * force,
    z: -2 * force
  };

  if (!thrown) ball.applyCentralImpulse(vector);
  thrown = true;
}

function updateCoords(e) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
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