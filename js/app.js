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
  basketGoalDiff: 2,
  basketYGoalDiff: 0.5,
  goalDuration: 800, // ms.
  /* EVENTS | MOBILE */
  doubleTapTime: 300,

  /* === APP: variables === */
  thrown: false, 
  doubletap: false, 
  goal: false,
  controlsEnabled: true,

  cursor: {
    x: 0, 
    y: 0
  },

  /* === APP: Menu data === */
  menu: {
    timeClock: null,
    time: 0,
    accuracy: 0,
    attempts: 0
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

      // rWidth: 1.2,
      // rHeight: 1.2,

      gravity: {
        y: -200
      }
    });

    APP.camera = APP.world.getCamera();

    APP.ProgressLoader = new ProgressLoader(11);

    APP.createScene();
    APP.addLights();
    APP.addBasket();
    APP.addBall();
    APP.initEvents();
    APP.initMenu();

    APP.camera.lookAt(new THREE.Vector3(0, APP.basketY, 0));
    APP.world.start(); // Ready.

    // APP.world.setControls(WHS.orbitControls());

    APP.ProgressLoader.on('step', () => {
      const hh = 100 + APP.ProgressLoader.getPercent() * 2;

      TweenLite.to(document.querySelector('.preloader'), 2, {
        css: {
          backgroundPositionY: hh + 'px', 
          bottom: hh + 'px'
        }, 
        ease: Power2.easeInOut
      });
    });

    APP.ProgressLoader.on('complete', () => {
      setTimeout(() => {
        document.querySelector('.loader').className += ' loaded';
        setTimeout(() => {
          document.querySelector('.loader').style.display = 'none';
          APP.onLevelStart();
        }, 2000);
      }, 2000);
    })
  },

  createScene() {
    /* GROUND OBJECT */
    const ground = new WHS.Plane({
      geometry: {
        buffer: true,
        width: 1000,
        height: 400
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

    ground.addTo(APP.world).then(() => APP.ProgressLoader.step());

    /* WALL OBJECT */
    const wall = ground.clone();

    wall.position.y = 180;
    wall.position.z = -APP.basketDistance;
    wall.rotation.x = 0;

    wall.addTo(APP.world).then(() => APP.ProgressLoader.step());
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
    const backboard = new WHS.Box({
      geometry: {
        buffer: true,
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
        y: APP.basketY + 10,
        z: APP.getBasketZ() - APP.getBasketRadius()
      }
    });

    backboard.addTo(APP.world).then(() => APP.ProgressLoader.step());

    /* BASKET OBJECT */
    APP.basket = new WHS.Torus({
      geometry: {
        buffer: true,
        radius: APP.getBasketRadius(),
        tube: APP.basketTubeRadius,
        radialSegments: 16,
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

    /* NET OBJECT */
    const net = new WHS.Cylinder({
      geometry: {
        radiusTop: APP.getBasketRadius(),
        radiusBottom: APP.getBasketRadius() - 3,
        height: 15,
        openEnded: true,
        heightSegments: 3,
        radiusSegments: 16
      },

      shadow: {
        cast: false
      },

      physics: {
        pressure: 2000,
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
        y: APP.basketY - 8,
        z: APP.getBasketZ()
      }
    });

    net.addTo(APP.world).then(() => {
      net.getNative().frustumCulled = false;

      for (let i = 0; i < 16; i++) {
        net.appendAnchor(APP.world, APP.basket, i, 0.1, false);
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

    APP.ball.addTo(APP.world).then(() => APP.ProgressLoader.step());
  },

  initMenu() {
    APP.text = new WHS.Text({
      geometry: {
        text: "Street Basketball",
        parameters: {
          size: 10,
          font: "../fonts/1.js",
          height: 4
        }
      },

      shadow: {
        cast: false,
        receive: false
      },

      physics: false,
      mass: 0,

      material: {
        kind: "phong",
        color: 0xffffff,
        map: WHS.texture('../textures/text.jpg', {repeat: {x: 0.005, y: 0.005}})
      },

      pos: {
        y: 120,
        z: -40
      },

      rot: {
        x: -Math.PI / 3
      }
    });

    APP.text.addTo(APP.world).then(() => {
      APP.text.getNative().geometry.computeBoundingBox();
      APP.text.position.x = -0.5 * (APP.text.getNative().geometry.boundingBox.max.x - APP.text.getNative().geometry.boundingBox.min.x);
      APP.ProgressLoader.step();
      // APP.text.hide();
    });

    APP.MenuLight = new WHS.PointLight({
      light: {
        distance: 100,
        intensity: 3,
        angle: Math.PI
      },

      shadowmap: {
        cast: false
      },

      pos: {
        y: 200,
        z: -30
      },

      target: {
        y: 120,
        z: -40
      }
    });

    // APP.MenuLight.hide();

    APP.MenuLight.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
  },

  /* === APP: Events === */

  initEvents() {
    ['mousemove', 'touchmove'].forEach((e) => {
      window.addEventListener(e, APP.updateCoords);
    });

    window.addEventListener('click', APP.throwBall);
    window.addEventListener('keypress', APP.checkKeys);

    window.addEventListener('resize', () => {
      const style = document.querySelector('.whs canvas').style;

      style.width = '100%';
      style.height = '100%';
    });

    const loop = new WHS.Loop(() => {
      if (!APP.thrown) APP.pickBall();
      if (APP.ball.position.distanceTo(APP.basket.position) < APP.basketGoalDiff
        && Math.abs(APP.ball.position.y - APP.basket.position.y) < APP.basketYGoalDiff 
        && !APP.goal) {

        APP.onGoal(APP.ball.position, APP.basket.position);
        
        if (APP.helpersActive) {
          document.querySelector('.helpers').className += ' deactivated';
          APP.helpersActive = false;
        }

        APP.goal = true;
        setTimeout(() => APP.goal = false, APP.goalDuration);
      }
    });

    APP.world.addLoop(loop);
    loop.start();

    APP.ProgressLoader.step();
  },

  updateCoords(e) {
    APP.cursor.x = e.clientX || e.touches[0].clientX;
    APP.cursor.y = e.clientY || e.touches[0].clientY;
  },

  checkKeys(e) {
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

  onLevelStart() {
    APP.menu.timeClock = new THREE.Clock();
    APP.menu.timeClock.getElapsedTime();
  },

  onGoal(ballp, basketp) {
    const distance = new THREE.Vector2(ballp.x, ballp.z)
      .distanceTo(new THREE.Vector2(basketp.x, basketp.z));

    APP.menu.time = APP.menu.timeClock.getElapsedTime();
    APP.menu.accuracy = (1 - distance / 2) * 100;
    console.log(distance);
    console.log(APP.menu.accuracy);
    APP.goToMenu();
  },

  /* === APP: functions === */

  throwBall() {
    if (!APP.detectDoubleTap() && APP.controlsEnabled) {
      const force = 2400;
      const vector = {
        x: APP.cursor.x - window.innerWidth / 2, 
        y: 6.2 * force,
        z: -2 * force
      };

      if (!APP.thrown) {
        APP.ball.applyCentralImpulse(vector);
        APP.thrown = true;
        APP.menu.attempts++;
      }
    }
  },

  pickBall() {
    if (APP.controlsEnabled) {
      const xCenter = window.innerWidth / 2;
      const yCenter = window.innerHeight / 2;
      const intensity = 32;
      const x = (APP.cursor.x - xCenter) / window.innerWidth * intensity;
      const y = - (APP.cursor.y - yCenter) / window.innerHeight * intensity;

      APP.ball.setLinearVelocity(new THREE.Vector3(0, 0, 0)); // Reset gravity affect.
      APP.ball.position.set(x, y, -36);
    }
  },

  goToMenu() {
    APP.controlsEnabled = false; // Disable moving.

    TweenLite.to(APP.camera.position, 3, {y: 300, ease: Power2.easeInOut, onUpdate: () => {
      APP.camera.lookAt(new THREE.Vector3(0, APP.basketY, 0));
    }});

    document.querySelector('.menu').className += ' active';
    document.querySelector('.menu').style.display = 'block';

    let mark = 0,
      markText = "";

    if (APP.menu.time.toFixed() < 2
      && APP.menu.attempts.toFixed() == 1
      && APP.menu.accuracy.toFixed() > 60) {
      mark = 3;
      markText = "Excellent";
    } else if (APP.menu.time.toFixed() < 5
      && APP.menu.attempts.toFixed() == 1
      && APP.menu.accuracy.toFixed() > 40) {
      mark = 2;
      markText = "Good";
    } else {
      mark = 1;
      markText = "OK";
    }

    // Fill data.
    document.querySelector('.menu_time').innerText = APP.menu.time.toFixed() + 's.';
    document.querySelector('.menu_attempts').innerText = APP.menu.attempts.toFixed();
    document.querySelector('.menu_accuracy').innerText = APP.menu.accuracy.toFixed();
    document.querySelector('.menu_mark').innerText = markText;

    const stars = document.querySelectorAll('.stars .star');
    // Stars.
    stars[0].className = 'star';
    if (mark < 2) stars[1].className = 'star inactive';
    else stars[1].className = 'star';
    if (mark < 3) stars[2].className = 'star inactive';
    else stars[2].className = 'star';
  }
}

APP.init();