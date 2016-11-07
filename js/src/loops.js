export const checkForLevel = (APP) => {
  const levelPlanes = APP.levelPlanes;
  const raycaster = APP.raycaster;
  const levelIndicator = APP.levelIndicator;
  const liProgress = APP.liProgress;
  let levelToGo = null;

  const indicatorTransition = new TweenLite.to(APP.liProgress, 1.5, 
    {
      data_arc: Math.PI * 2, ease: Power2.easeOut, 
      onUpdate: () => {
        APP.liProgress.g_({arc: APP.liProgress.data_arc});
      },
      onComplete: () => {
        APP.changeLevel(levelToGo);
        APP.goBackToLevel();
      }
    }
  );

  indicatorTransition.kill();

  return new WHS.Loop(() => {
    const cPos = APP.camera.position;
    const bPos = APP.ball.position;

    const normVec = bPos.clone().sub(cPos.clone()).normalize();
    raycaster.set(cPos, normVec);

    const activeObjects = raycaster.intersectObjects(levelPlanes);

    if (activeObjects.length >= 1) levelIndicator.position.copy(raycaster.ray.at(cPos.distanceTo(bPos) - 8));

    if (!APP.indicatorStatus && activeObjects.length >= 1) {
      APP.indicatorStatus = true;
      levelIndicator.show();

      levelToGo = activeObjects[0].object.data;
      indicatorTransition.restart();
    } else if (activeObjects.length === 0) {
      APP.indicatorStatus = false;
      levelIndicator.hide();
      
      if (liProgress.data_arc !== 0) {
        indicatorTransition.kill();

        liProgress.data_arc = 0;
        liProgress.g_({arc: 0.1});
      }
    }
  });
}

export const loop_raycaster = (APP) => {
  const cameraNative = APP.camera.native;
  const raycaster = APP.raycaster;
  const ray = APP.raycaster.ray;
  const plane = APP.planeForRaycasting;

  return new WHS.Loop(() => {
    raycaster.setFromCamera(
      new THREE.Vector2(
        (APP.cursor.x / window.innerWidth) * 2 - 1,
        -(APP.cursor.y / window.innerHeight) * 2 + 1
      ),
      cameraNative
    );

    const bPos = APP.ball.position;
    const raycastPoint = ray.at(ray.distanceToPlane(plane));

    if (!APP.levelMenuTriggered && APP.animComplete && bPos.z > 60) APP.triggerLevelMenu();
    if (APP.levelMenuTriggered && APP.animComplete && bPos.z < 170) APP.goBackToLevel();

    APP.ball.setLinearVelocity(raycastPoint.sub(bPos).multiplyScalar(2));
  });
}

// Pick ball and detect goal.
export const keep_ball = (APP) => {
  return new WHS.Loop(() => {
    if (!APP.thrown) APP.pickBall();

    const BLpos = APP.ball.position;
    const BSpos = APP.basket.position

    if (BLpos.distanceTo(BSpos) < APP.basketGoalDiff
      && Math.abs(BLpos.y - BSpos.y + APP.basketYDeep()) < APP.basketYGoalDiff() 
      && !APP.goal) APP.onGoal(BLpos, BSpos);
  });
}