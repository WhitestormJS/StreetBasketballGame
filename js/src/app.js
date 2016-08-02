import levelData from './levelData';
import TexUtils from './utils/textures';

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
  goalDuration: 1800, // ms.
  /* EVENTS | MOBILE */
  doubleTapTime: 300,

  /* === APP: variables === */
  thrown: false, 
  doubletap: false, 
  goal: false,
  controlsEnabled: true,
  levelMenuTriggered: false,
  animComplete: true, // To prevent problems with transitions.
  levelPlanes: [],
  indicatorStatus: false,

  cursor: {
    x: 0, 
    y: 0
  },

  force: {
    y: 6.2,
    z: -2,
    m: 2400,
    xk: 1
  },

  /* === APP: Menu data === */
  menu: {
    timeClock: null,
    time: 0,
    accuracy: 0,
    attempts: 0,
    markText: "",

    grid: false
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

    APP.ProgressLoader = new ProgressLoader(14);

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

    APP.backboard.addTo(APP.world).then(() => APP.ProgressLoader.step());

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
    APP.net = new WHS.Cylinder({
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

    APP.net.addTo(APP.world).then(() => {
      APP.net.getNative().frustumCulled = false;

      for (let i = 0; i < 16; i++) {
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
          font: "./fonts/1.js",
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
        map: WHS.texture('./textures/text.jpg', {repeat: {x: 0.005, y: 0.005}})
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

    APP.menuDataPlane = new WHS.Plane({
      geometry: {
        width: 200,
        height: 100
      },

      material: {
        kind: 'phong',
        transparent: true,
        opacity: 0,
        fog: false,
        shininess: 900,
        reflectivity: 0.5
      },

      physics: false,

      rot: {
        x: -Math.PI / 2
      },

      pos: {
        y: -19.5,
        z: -20
      }
    });

    APP.menuDataPlane.addTo(APP.world).then(() => {APP.ProgressLoader.step()});

    APP.MenuLight = new WHS.SpotLight({
      light: {
        distance: 100,
        intensity: 3
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

    APP.LevelLight1 = new WHS.SpotLight({
      light: {
        distance: 800,
        intensity: 0,
        angle: Math.PI / 7
      },

      shadowmap: {
        cast: false
      },

      pos: {
        y: 10,
        x: 500,
        z: 100
      },

      target: {
        z: 500,
        x: -200
      }
    });

    APP.LevelLight2 = APP.LevelLight1.clone();
    APP.LevelLight2.position.x = -500;
    APP.LevelLight2.target.x = 200;

    // APP.MenuLight.hide();

    APP.MenuLight.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
    APP.LevelLight1.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
    APP.LevelLight2.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
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
    APP.cursor.x = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    APP.cursor.y = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
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
    APP.goToMenu();
  },

  /* === APP: functions === */

  throwBall() {
    if (!APP.detectDoubleTap() && APP.controlsEnabled) {
      const force = 2400;
      const vector = {
        x: APP.force.xk * (APP.cursor.x - window.innerWidth / 2), 
        y: APP.force.y * APP.force.m,
        z: APP.force.z * APP.force.m
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

    let mark = 0,
      markText = "";

    if (APP.menu.time.toFixed() < 2
      && APP.menu.attempts.toFixed() == 1
      && APP.menu.accuracy.toFixed() > 60) {
      mark = 3;
      APP.menu.markText = "Excellent";
    } else if (APP.menu.time.toFixed() < 5
      && APP.menu.attempts.toFixed() == 1
      && APP.menu.accuracy.toFixed() > 40) {
      mark = 2;
      APP.menu.markText = "Good";
    } else {
      mark = 1;
      APP.menu.markText = "OK";
    }

    APP.menuDataPlane.show();
    APP.menuDataPlane.M_({map: TexUtils.generateMenuTexture(APP.menu)});

    APP.menuDataPlane.getNative().material.opacity = 0;
    TweenLite.to(APP.menuDataPlane.getNative().material, 3, {opacity: 0.7, ease: Power2.easeInOut});

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

    setTimeout(APP.makeCursorFromBall, 3000);
  },

  makeCursorFromBall() {
    APP.raycaster = new THREE.Raycaster();

    APP.loop_raycaster = APP.loop_raycaster || new WHS.Loop(() => {
      APP.raycaster.setFromCamera(
        new THREE.Vector2(
          (APP.cursor.x / window.innerWidth) * 2 - 1,
          -(APP.cursor.y / window.innerHeight) * 2 + 1
        ),
        APP.camera.getNative()
      );

      const distancePlane = APP.raycaster.ray.distanceToPlane(APP.planeForRaycasting);
      const raycastPoint = APP.raycaster.ray.at(distancePlane);
      if (APP.animComplete && !APP.levelMenuTriggered && APP.ball.position.z > 60) APP.triggerLevelMenu();
      if (APP.animComplete && APP.levelMenuTriggered && APP.ball.position.z < 170) APP.goBackToLevel();

      APP.ball.setLinearVelocity(raycastPoint.sub(APP.ball.position).multiplyScalar(2));
    });

    APP.world.addLoop(APP.loop_raycaster);
    APP.loop_raycaster.start();
  },

  triggerLevelMenu() {
    APP.levelMenuTriggered = true;
    APP.animComplete = false;
    TweenLite.to(APP.camera.position, 1, {z: 350, ease: Power2.easeIn});

    // Reset lights.
    APP.LevelLight1.getNative().intensity = 0;
    APP.LevelLight2.getNative().intensity = 0;

    TweenLite.to(APP.LevelLight1.getNative(), 0.5, {intensity: 10, ease: Power2.easeIn, delay: 1});
    TweenLite.to(APP.LevelLight2.getNative(), 0.5, {intensity: 10, ease: Power2.easeIn, delay: 1.5, onComplete: () => {
      APP.animComplete = true;
    }});

    if (!APP.menu.grid) APP.initLevelGrid();
    if (APP.checkForLevel) APP.checkForLevel.start();
  },

  initLevelGrid() {
    APP.menu.grid = true;
    const ratio = APP.camera.getNative().getFilmWidth() / APP.camera.getNative().getFilmHeight();

    let levelXstartOffset = -225;
    let levelZstartOffset = 200;

    let cols = 4;

    if (ratio < 0.7) {
      cols = 1;
      levelXstartOffset = -90;
    } else if (ratio < 1) {
      cols = 2;
      levelXstartOffset = -135
    } else if  (ratio < 1.3) {
      cols = 3;
      levelXstartOffset = -180;
    } else {
      cols = 4;
      levelXstartOffset = -225;
    }

    let rows = Math.ceil(levelData.length / cols);

    let levelXoffset = levelXstartOffset;
    let levelZoffset = levelZstartOffset;

    const levelPlane = new WHS.Plane({
      geometry: {
        height: 40,
        width: 80
      },

      physics: false,

      material: {
        kind: 'phong'
      },

      pos: {
        y: -19,
        x: levelXoffset
      },

      rot: {
        x: -Math.PI / 2
      }
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        console.log(i);

        if (levelData[i]) {
          const newLevelPlane = levelPlane.clone();
          levelXoffset += 90;

          newLevelPlane.position.z = levelZoffset;
          newLevelPlane.position.x = levelXoffset;

          newLevelPlane.M_({
            map: TexUtils.generateLevelTexture(levelData[i])
          });

          newLevelPlane.getNative().data = levelData[i];

          newLevelPlane.addTo(APP.world);
          APP.levelPlanes.push(newLevelPlane.getNative());
        }
      }

      levelZoffset += 60;
      levelXoffset = levelXstartOffset;
    }

    APP.levelIndicator = new WHS.Sphere({
      geometry: {
        radius: 1,
        widthSegments: 16,
        heightSegments: 16
      },

      physics: false,

      material: {
        kind: 'basic',
        color: 0xffffff
      }
    });

    APP.levelIndicator.hide();
    APP.levelIndicator.addTo(APP.world);

    APP.liProgress = new WHS.Torus({
      geometry: {
        radius: 3,
        tube: 0.5,
        radialSegments: 16,
        tubularSegments: 16,
        arc: 0
      },

      physics: false,

      material: {
        kind: 'basic',
        color: 0xffffff
      },

      rot: {
        x: Math.PI / 2,
        z: Math.PI / 2
      }
    });

    APP.liProgress.addTo(APP.levelIndicator);
    APP.liProgress.data_arc = 0;

    let indicatorTransition = null;

    APP.checkForLevel = new WHS.Loop(() => {
      const normVec = APP.ball.position.clone().sub(APP.camera.position.clone()).normalize();
      const raycaster = new THREE.Raycaster(APP.camera.position, normVec, true, 1000);
      const activeObjects = raycaster.intersectObjects(APP.levelPlanes);

      const indDistance = APP.camera.position.distanceTo(APP.ball.position) - 8;
      const indPos = raycaster.ray.at(indDistance);

      APP.levelIndicator.position.copy(indPos);

      if (!APP.indicatorStatus && activeObjects.length >= 1) {
        APP.indicatorStatus = true;
        APP.levelIndicator.show();
        indicatorTransition = new TweenLite.to(APP.liProgress, 1.5, 
          {
            data_arc: Math.PI * 2, ease: Power2.easeOut, 
            onUpdate: () => {
              APP.liProgress.G_({arc: APP.liProgress.data_arc});
            },
            onComplete: () => {
              APP.changeLevel(activeObjects[0].object.data);
              APP.goBackToLevel();
            }
          }
        );
      } else if (activeObjects.length === 0) {
        APP.indicatorStatus = false;
        APP.levelIndicator.hide();
        
        if (APP.liProgress.data_arc !== 0) {
          indicatorTransition.kill();
          APP.liProgress.data_arc = 0;
          APP.liProgress.G_({arc: 0.1});
        }
      }
    });

    APP.world.addLoop(APP.checkForLevel);
    APP.checkForLevel.start();
  },

  goBackToLevel() {
    APP.levelMenuTriggered = false;
    APP.animComplete = false;

    APP.menu.timeClock = new THREE.Clock();
    APP.menu.time = 0;
    APP.menu.attempts = 0;
    APP.menu.accuracy = 0;
    APP.menu.timeClock.getElapsedTime();

    if (APP.menuDataPlane) APP.menuDataPlane.hide();
    if (APP.checkForLevel) APP.checkForLevel.stop();

    const cameraDest = APP.camera.clone();
    cameraDest.position.set(0, APP.basketY, 50);
    cameraDest.lookAt(new THREE.Vector3(0, APP.basketY, 0));

    const rotationDest = cameraDest.rotation;
    TweenLite.to(APP.world.getScene().fog, 0.5, {far: 400, onComplete: () => {
      APP.loop_raycaster.stop();
      APP.controlsEnabled = true;
      APP.thrown = false;
      APP.ball.setAngularVelocity(new THREE.Vector3(0, 0, 0));
    }});

    TweenLite.to(APP.world.getScene().fog, 1.5, {delay: 1.5, far: 1000, ease: Power3.easeOut});
    TweenLite.to(APP.camera.rotation, 2, {delay: 0.5, x: rotationDest.x, y: rotationDest.y, z: rotationDest.z, ease: Power3.easeOut});
    TweenLite.to(APP.camera.position, 2, {delay: 0.5, z: 50, y: APP.basketY, ease: Power3.easeOut, onComplete: () => {
      APP.animComplete = true;
    }});
  },

  changeLevel(levelData) {
    const tempBY = APP.basketY;
    const tempBZ = APP.getBasketZ();

    if (levelData.force.y) APP.force.y = levelData.force.y;
    if (levelData.force.z) APP.force.z = levelData.force.z;
    if (levelData.force.m) APP.force.m = levelData.force.m;
    if (levelData.force.xk) APP.force.xk = levelData.force.xk;

    APP.basketY = levelData.basketY;
    APP.basketDistance = levelData.basketDistance;
    APP.basketColor = levelData.basketColor;

    APP.basket.position.y = APP.basketY;
    APP.basket.position.z = APP.getBasketZ();
    APP.net.getNative().geometry.translate(0, APP.basketY - tempBY, APP.getBasketZ() - tempBZ);
    APP.backboard.position.y = APP.basketY + 10;
    APP.backboard.position.z = APP.getBasketZ() - APP.getBasketRadius();
    APP.wall.position.z = -APP.basketDistance;

    APP.basket.M_color = APP.basketColor;
  }
}

APP.init();