import EVENTS from './events';
import {pick_ball} from './loops';

const APP = {
  /* === APP: config === */
  /* GLOABAL */
  helpersActive: true,
  /* APP */
  bgColor: 0xcccccc,
  /* BALL */
  ballRadius: 6,
  /* BASKET */
  basketColor: 0xff0000,
  getBasketRadius: () => APP.ballRadius + 2,
  basketTubeRadius: 0.5,
  basketY: 20,
  basketDistance: 80,
  getBasketZ: () => APP.getBasketRadius() + APP.basketTubeRadius * 2 - APP.basketDistance,
  /* GOAL */
  basketGoalDiff: 2.5,
  basketYGoalDiff: () => APP.isMobile ? 2 : 1,
  basketYDeep: () => APP.isMobile ? 2 : 1,
  goalDuration: 1800, // ms.
  /* EVENTS | MOBILE */
  doubleTapTime: 300,

  /* === APP: variables === */
  thrown: false, 
  doubletap: false, 
  goal: false,
  controlsEnabled: true,
  isMobile: navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/),

  cursor: {
    x: 0, 
    y: 0,
    xCenter: window.innerWidth / 2,
    yCenter: window.innerHeight / 2
  },

  force: {
    y: 6,
    z: -2,
    m: 2400,
    xk: 8
  },

  /* === APP: init === */

  init() {
    APP.world = new WHS.World({
      autoresize: "window",
      softbody: true,

      background: {
        color: APP.bgColor
      },

      fog: {
        type: 'regular',
        hex: 0xffffff
      },

      camera: {
        z: 50,
        y: APP.basketY,
        aspect: 45
      },

      physics: {
        fixedTimeStep: APP.isMobile ? 1 / 35 : false
      },

      gravity: {
        y: -200
      }
    });

    APP.raycaster = new THREE.Raycaster();
    APP.camera = APP.world.getCamera();
    APP.ProgressLoader = new ProgressLoader(APP.isMobile ? 12 : 14);

    APP.createScene(); // 1
    APP.addLights(); // 2
    APP.addBasket(); // 3
    APP.addBall(); // 4
    APP.initEvents(); // 5

    APP.camera.lookAt(new THREE.Vector3(0, APP.basketY, 0));
    APP.world.start(); // Ready.
  },

  createScene() {
    /* GROUND OBJECT */
    APP.ground = new WHS.Plane({
      geometry: {
        buffer: true,
        width: 1000,
        height: 800
      },

      mass: 0,

      material: {
        kind: 'phong',
        color: APP.bgColor
      },

      pos: {
        y: -20,
        z: 120
      },

      rot: {
        x: -Math.PI / 2
      }
    });

    APP.ground.addTo(APP.world).then(() => APP.ProgressLoader.step());

    /* WALL OBJECT */
    APP.wall = APP.ground.clone();

    APP.wall.position.y = 180;
    APP.wall.position.z = -APP.basketDistance;
    APP.wall.rotation.x = 0;
    APP.wall.addTo(APP.world).then(() => APP.ProgressLoader.step());

    APP.planeForRaycasting = new THREE.Plane(new THREE.Vector3(0, 1, 0), -APP.ground.position.y - APP.ballRadius);
  },

  addLights() {
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
    }).addTo(APP.world).then(() => APP.ProgressLoader.step());

    new WHS.AmbientLight({
      light: {
        intensity: 0.3
      }
    }).addTo(APP.world).then(() => APP.ProgressLoader.step());
  },

  addBasket() {
    /* BACKBOARD OBJECT */
    APP.backboard = new WHS.Box({
      geometry: {
        buffer: true,
        width: 41,
        depth: 1,
        height: 28
      },

      mass: 0,

      material: {
        kind: 'standard',
        map: WHS.texture('textures/backboard/1/backboard.jpg'),
        normalMap: WHS.texture('textures/backboard/1/backboard_normal.jpg'),
        displacementMap: WHS.texture('textures/backboard/1/backboard_displacement.jpg'),
        normalScale: new THREE.Vector2(0.3, 0.3),
        metalness: 0,
        roughness: 0.3
      },

      pos: {
        y: APP.basketY + 10,
        z: APP.getBasketZ() - APP.getBasketRadius()
      }
    });

    APP.backboard.addTo(APP.world).then(() => APP.ProgressLoader.step());

    /* BASKET OBJECT */
    APP.basket = new WHS.Torus({
      geometry: {
        buffer: true,
        radius: APP.getBasketRadius(),
        tube: APP.basketTubeRadius,
        radialSegments: APP.isMobile ? 6 : 8,
        tubularSegments: 16
      },

      shadow: {
        cast: false
      },

      mass: 0,

      material: {
        kind: 'standard',
        color: APP.basketColor,
        metalness: 0.8,
        roughness: 0.5,
        emissive: 0xffccff,
        emissiveIntensity: 0.2
      },

      pos: {
        y: APP.basketY,
        z: APP.getBasketZ()
      },

      physics: {
        type: 'concave'
      },

      rot: {
        x: Math.PI / 2
      }
    });

    APP.basket.addTo(APP.world).then(() => APP.ProgressLoader.step());

    const netRadSegments = APP.isMobile ? 8 : 16;

    /* NET OBJECT */
    APP.net = new WHS.Cylinder({
      geometry: {
        radiusTop: APP.getBasketRadius(),
        radiusBottom: APP.getBasketRadius() - 3,
        height: 15,
        openEnded: true,
        heightSegments: APP.isMobile ? 2 : 3,
        radiusSegments: netRadSegments
      },

      shadow: {
        cast: false
      },

      physics: {
        pressure: 2000,
        friction: 0.02,
        margin: 0.5,
        anchorHardness: 0.5,
        viterations: 2,
        piterations: 2,
        diterations: 4,
        citerations: 0
      },

      mass: 30,
      softbody: true,

      material: {
        map: WHS.texture('textures/net4.png', {repeat: {y: 0.7, x: 2}, offset: {y: 0.3}}), // 0.85, 19
        transparent: true,
        opacity: 0.7,
        kind: 'basic',
        side: THREE.DoubleSide,
        depthWrite: false
      },

      pos: {
        y: APP.basketY - 8,
        z: APP.getBasketZ()
      }
    });

    APP.net.addTo(APP.world).then(() => {
      APP.net.getNative().frustumCulled = false;

      for (let i = 0; i < netRadSegments; i++) {
        APP.net.appendAnchor(APP.world, APP.basket, i, 0.8, true);
      }

      APP.ProgressLoader.step();
    });
  },

  addBall() {
    /* BALL OBJECT */
    APP.ball = new WHS.Sphere({
      geometry: {
        buffer: true,
        radius: APP.ballRadius, 
        widthSegments: APP.isMobile ? 16 : 32,
        heightSegments: APP.isMobile ? 16 : 32
      },

      mass: 120,

      material: {
        kind: 'phong',
        map: WHS.texture('textures/ball.png'),
        normalMap: WHS.texture('textures/ball_normal.png'),
        shininess: 20,
        reflectivity: 2,
        normalScale: new THREE.Vector2(0.5, 0.5)
      },

      physics: {
        restitution: 3
      }
    });

    APP.ball.addTo(APP.world).then(() => APP.ProgressLoader.step());
  },

  /* === APP: Events === */

  initEvents() {
    EVENTS._move(APP);
    EVENTS._click(APP);
    EVENTS._keypress(APP);
    EVENTS._resize(APP);

    APP.pick_ball = pick_ball(APP);
    APP.world.addLoop(APP.pick_ball);
    APP.pick_ball.start();

    APP.ProgressLoader.step();
  },

  updateCoords(e) {
    e.preventDefault();

    APP.cursor.x = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    APP.cursor.y = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
  },

  checkKeys(e) {
    e.preventDefault();
    if (e.code === "Space") APP.thrown = false;
  },

  detectDoubleTap() {
    if (!APP.doubletap) { // Wait for second click.
      APP.doubletap = true;

      setTimeout(() => {
        APP.doubletap = false;
      }, APP.doubleTapTime);

      return false;
    } else { // Double tap triggered.
      APP.thrown = false;
      APP.doubletap = true;

      return true;
    }
  },

  /* === APP: functions === */
  /* Func: 1 Section. GAME */

  throwBall(e) {
    e.preventDefault();

    if (!APP.detectDoubleTap() && APP.controlsEnabled && !APP.thrown) {
      const vector = new THREE.Vector3(
        APP.force.xk * (APP.cursor.x - APP.cursor.xCenter), 
        APP.force.y * APP.force.m,
        APP.force.z * APP.force.m
      );

      APP.ball.setLinearVelocity(new THREE.Vector3(0, 0, 0)); // Reset gravity affect.

      APP.ball.applyCentralImpulse(vector);

      vector.multiplyScalar(10 / APP.force.m)
      vector.y = vector.x;
      vector.x = APP.force.y;
      vector.z = 0;

      APP.ball.setAngularVelocity(vector); // Reset gravity affect.
      APP.thrown = true;
      APP.menu.attempts++;
    }
  },

  pickBall() {
    const cursor = APP.cursor;

    const x = (cursor.x - cursor.xCenter) / window.innerWidth * 32;
    const y = - (cursor.y - cursor.yCenter) / window.innerHeight * 32;

    APP.ball.position.set(x, y, -36);
  }
}

basket.require({ url: 'bower_components/whitestorm/build/whitestorm.js' }).then(() => {
  APP.init();
});