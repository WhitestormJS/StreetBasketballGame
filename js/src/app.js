import levelData from './levelData';
import TexUtils from './utils/textures';
import EVENTS from './events';
import {checkForLevel, loop_raycaster, keep_ball} from './loops';

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
  levelMenuTriggered: false,
  animComplete: true, // To prevent problems with transitions.
  levelPlanes: [],
  indicatorStatus: false,
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

  /* === APP: Menu data === */
  menu: {
    timeClock: null,
    time: 0,
    accuracy: 0,
    attempts: 0,
    markText: "",

    enabled: false
  },

  /* === APP: init === */

  init() {
    APP.world = new WHS.World({
      autoresize: "window",
      softbody: true,

      rendering: {
        background: {
          color: APP.bgColor
        },

        renderer: {
          antialias: true
        }
      },

      fog: {
        type: 'regular',
        hex: 0xffffff
      },

      camera: {
        fov: 45,
        position: {
          z: 50,
          y: APP.basketY
        }
      },

      physics: {
        fixedTimeStep: APP.isMobile ? 1 / 35 : false
      },

      gravity: {
        y: -200
      }
    });

    APP.raycaster = new THREE.Raycaster();
    APP.camera = APP.world.camera;
    APP.ProgressLoader = new ProgressLoader(APP.isMobile ? 12 : 14);

    APP.createScene(); // 1
    APP.addLights(); // 2
    APP.addBasket(); // 3
    APP.addBall(); // 4
    APP.initEvents(); // 5
    APP.initMenu(); // 6
    console.log(1234);


    APP.keep_ball = keep_ball(APP);
    APP.world.addLoop(APP.keep_ball);
    APP.keep_ball.start();

    APP.camera.lookAt(new THREE.Vector3(0, APP.basketY, 0));
    APP.world.start(); // Ready.

    APP.ProgressLoader.on('step', () => {
      const hh = APP.ProgressLoader.getPercent();

      TweenLite.to(document.querySelector('#loader0'), 2, {
        css: {
          height: (100 - hh) + '%'
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
    });
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

      position: {
        y: -20,
        z: 120
      },

      rotation: {
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

      position: {
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

      position: {
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

      position: {
        y: APP.basketY,
        z: APP.getBasketZ()
      },

      physics: {
        type: 'concave'
      },

      rotation: {
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

      position: {
        y: APP.basketY - 8,
        z: APP.getBasketZ()
      }
    });

    APP.net.addTo(APP.world).then(() => {
      APP.net.native.frustumCulled = false;

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

  initMenu() {
    const ratio = APP.camera.native.getFilmWidth() / APP.camera.native.getFilmHeight();


    if (!APP.isMobile) {
      APP.text = new WHS.Text({
        geometry: {
          text: "Street Basketball",
          parameters: {
            size: 10,
            font: "fonts/1.js",
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
          map: WHS.texture('textures/text.jpg', {repeat: {x: 0.005, y: 0.005}})
        },

        position: {
          y: 120,
          z: -40
        },

        rotation: {
          x: -Math.PI / 3
        }
      });

      APP.text.addTo(APP.world).then(() => {
        APP.text.native.geometry.computeBoundingBox();
        APP.text.position.x = -0.5 * (APP.text.native.geometry.boundingBox.max.x - APP.text.native.geometry.boundingBox.min.x);
        APP.ProgressLoader.step();
        // APP.text.hide();
      });
    }

    APP.menuDataPlane = new WHS.Plane({
      geometry: {
        width: ratio < 0.7 ? 150 : 200,
        height: ratio < 0.7 ? 75 : 100
      },

      material: {
        kind: 'phong',
        transparent: true,
        opacity: 0,
        fog: false,
        shininess: 900,
        reflectivity: 0.5,
        map: TexUtils.generateMenuTexture(APP.menu)
      },

      physics: false,

      rotation: {
        x: -Math.PI / 2
      },

      position: {
        y: -19.5,
        z: -20
      }
    });

    APP.menuDataPlane.addTo(APP.world).then(() => {APP.ProgressLoader.step()});

    APP.selectLevelHelper = new WHS.Plane({
      geometry: {
        width: 50,
        height: 50
      },

      material: {
        kind: 'basic',
        transparent: true,
        fog: false,
        map: WHS.texture('textures/select-level.png')
      },

      physics: false,

      rotation: {
        x: -Math.PI / 2
      },

      position: {
        y: -19.5,
        z: 90
      }
    });

    APP.selectLevelHelper.addTo(APP.world);

    if (!APP.isMobile) {
      APP.MenuLight = new WHS.SpotLight({
        light: {
          distance: 100,
          intensity: 3
        },

        shadowmap: {
          cast: false
        },

        position: {
          y: 200,
          z: -30
        }
      });

      APP.MenuLight.target.position.set(0, 120, -40);
      APP.world.scene.add(APP.MenuLight.target);
    }

    APP.LevelLight1 = new WHS.SpotLight({
      light: {
        distance: 800,
        intensity: 0,
        angle: Math.PI / 7
      },

      shadowmap: {
        cast: false
      },

      position: {
        y: 10,
        x: 500,
        z: 100
      }
    });

    APP.LevelLight1.target.position.set(-200, 0, 500);
    APP.world.scene.add(APP.LevelLight1.target);

    APP.LevelLight2 = APP.LevelLight1.clone();
    APP.LevelLight2.position.x = -500;
    APP.LevelLight2.target.position.x = 200;
    APP.world.scene.add(APP.LevelLight2.target);

    // APP.MenuLight.hide();

    if (!APP.isMobile) APP.MenuLight.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
    APP.LevelLight1.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
    APP.LevelLight2.addTo(APP.world).then(() => {APP.ProgressLoader.step()});
    
    APP.loop_raycaster = loop_raycaster(APP);
    APP.world.addLoop(APP.loop_raycaster);
  },

  initLevelMenu() {
    APP.menu.enabled = true;
    const ratio = APP.camera.native.getFilmWidth() / APP.camera.native.getFilmHeight();

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

      position: {
        y: -19,
        x: levelXoffset
      },

      rotation: {
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

          newLevelPlane.m_({
            map: TexUtils.generateLevelTexture(levelData[i])
          });

          newLevelPlane.native.data = levelData[i];

          newLevelPlane.addTo(APP.world);
          APP.levelPlanes.push(newLevelPlane.native);
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

      rotation: {
        x: Math.PI / 2,
        z: Math.PI / 2
      }
    });

    APP.liProgress.addTo(APP.levelIndicator);
    APP.liProgress.data_arc = 0;

    APP.checkForLevel = checkForLevel(APP);

    APP.world.addLoop(APP.checkForLevel);
    APP.checkForLevel.start();
  },

  /* === APP: Events === */

  initEvents() {
    EVENTS._move(APP);
    EVENTS._click(APP);
    EVENTS._keypress(APP);
    EVENTS._resize(APP);

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

  onLevelStart() {
    APP.menu.timeClock = new THREE.Clock();
    APP.menu.timeClock.getElapsedTime();
  },

  onGoal(ballp, basketp) {
    const distance = new THREE.Vector2(ballp.x, ballp.z)
      .distanceTo(new THREE.Vector2(basketp.x, basketp.z));

    APP.menu.time = APP.menu.timeClock.getElapsedTime();
    APP.menu.accuracy = (1 - distance / 2) * 100;

    if (APP.helpersActive) {
      document.querySelector('.helpers').className += ' deactivated';
      APP.helpersActive = false;
    }

    APP.goal = true;
    setTimeout(() => APP.goal = false, APP.goalDuration);

    APP.goToMenu();
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
    APP.ball.setAngularVelocity(new THREE.Vector3(0, 0, 0));
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
    if (APP.selectLevelHelper) APP.selectLevelHelper.hide();
    if (APP.checkForLevel) APP.checkForLevel.stop();

    const cameraDest = APP.camera.clone();
    cameraDest.position.set(0, APP.basketY, 50);
    cameraDest.lookAt(new THREE.Vector3(0, APP.basketY, 0));

    const rotationDest = cameraDest.rotation;
    TweenLite.to(APP.world.scene.fog, 0.5, {far: 400, onComplete: () => {
      APP.loop_raycaster.stop();
      APP.controlsEnabled = true;
      APP.keep_ball.start();
      APP.thrown = false;
      APP.ball.setAngularVelocity(new THREE.Vector3(0, 0, 0));
    }});

    TweenLite.to(APP.world.scene.fog, 1.5, {delay: 1.5, far: 1000, ease: Power3.easeOut});
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

    APP.backboard.native.material.map = WHS.texture('textures/backboard/' + levelData.level + '/backboard.jpg'),
    APP.backboard.native.material.normalMap =  WHS.texture('textures/backboard/' + levelData.level + '/backboard_normal.jpg'),
    APP.backboard.native.material.displacementMap = WHS.texture('textures/backboard/' + levelData.level + '/backboard_displacement.jpg')

    APP.basketY = levelData.basketY;
    APP.basketDistance = levelData.basketDistance;
    APP.basketColor = levelData.basketColor;

    APP.basket.position.y = APP.basketY;
    APP.basket.position.z = APP.getBasketZ();
    APP.net.native.geometry.translate(0, APP.basketY - tempBY, APP.getBasketZ() - tempBZ);
    APP.backboard.position.y = APP.basketY + 10;
    APP.backboard.position.z = APP.getBasketZ() - APP.getBasketRadius();
    APP.wall.position.z = -APP.basketDistance;

    APP.basket.M_color = APP.basketColor;
  },

  /* Func: 2 Section. MENU */

  goToMenu() {
    // Stop picking ball.
    APP.keep_ball.stop();
    APP.controlsEnabled = false; // Disable moving.

    let mark = 0, markText = "";

    // Detect mark depending on existing stats.
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

    // FadeIn effect for 
    APP.menuDataPlane.native.material.map = TexUtils.generateMenuTexture(APP.menu);
    APP.menuDataPlane.show();
    APP.selectLevelHelper.show();

    if (APP.isMobile) {
      APP.menuDataPlane.native.material.opacity = 0.7;
    } else {
      APP.menuDataPlane.native.material.opacity = 0;
      TweenLite.to(APP.menuDataPlane.native.material, 3, {opacity: 0.7, ease: Power2.easeInOut});
    }

    // Tween camera position and rotation to go upper and look at basket position.
    const cameraDest = APP.camera.clone();
    cameraDest.position.y = 300;
    cameraDest.lookAt(new THREE.Vector3(0, APP.basketY, 0));

    TweenLite.to(APP.camera.position, 3, {y: 300, ease: Power2.easeInOut});

    TweenLite.to(APP.camera.rotation, 3, {
      x: cameraDest.rotation.x, 
      y: cameraDest.rotation.y, 
      z: cameraDest.rotation.z, 
      ease: Power2.easeInOut,
      onComplete: () => {
        APP.loop_raycaster.start();
      }
    });
  },

  /* Func: 3 Section. LEVELMENU */

  triggerLevelMenu() {
    // Enable for checking in loop.
    APP.levelMenuTriggered = true;

    // Prevent checking in loop before animation complete.
    APP.animComplete = false;

    // Draw level grid. Start checking for selecting level.
    if (!APP.menu.enabled) APP.initLevelMenu();
    if (APP.checkForLevel) APP.checkForLevel.start();

    // Go to LevelMenu.
    TweenLite.to(APP.camera.position, 1, {z: 350, ease: Power2.easeIn});

    if (APP.isMobile) {
      APP.LevelLight1.native.intensity = 10;
      APP.LevelLight2.native.intensity = 10;
    } else {
      // Reset lights.
      APP.LevelLight1.native.intensity = 0;
      APP.LevelLight2.native.intensity = 0;

      // Tween turning on lights.
      TweenLite.to(APP.LevelLight1.native, 0.5, {intensity: 10, ease: Power2.easeIn, delay: 1});
      TweenLite.to(APP.LevelLight2.native, 0.5, {intensity: 10, ease: Power2.easeIn, delay: 1.5, onComplete: () => {
        APP.animComplete = true;
      }});
    }
  }
}

basket.require({ url: 'bower_components/whs/build/whitestorm.js' }).then(() => {
  APP.init();
});