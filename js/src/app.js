const APP = {
  /* === APP: config === */
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

  /* === APP: variables === */
  isMobile: navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/),

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
        fixedTimeStep: APP.isMobile ? 1 / 300 : false
      },

      gravity: {
        y: -200
      }
    });

    APP.camera = APP.world.getCamera();
    APP.ProgressLoader = new ProgressLoader(APP.isMobile ? 12 : 14);

    APP.createScene(); // 1
    APP.addLights(); // 2
    APP.addBasket(); // 3
    APP.addBall(); // 4

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
    /* BASKET OBJECT */
    APP.basket = new WHS.Torus({
      geometry: {
        buffer: true,
        radius: APP.getBasketRadius(),
        tube: APP.basketTubeRadius,
        radialSegments: 16,
        tubularSegments: APP.isMobile ? 8 : 16
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
  }
}

basket.require({ url: 'bower_components/whitestorm/build/whitestorm.js' }).then(() => {
  APP.init();
});