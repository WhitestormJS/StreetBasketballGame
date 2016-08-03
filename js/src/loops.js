export const checkForLevel = (APP) => {
  return new WHS.Loop(() => {
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
}

export const loop_raycaster = (APP) => {
  return new WHS.Loop(() => {
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
}

// Pick ball and detect goal.
export const pick_ball = (APP) => {
  return new WHS.Loop(() => {
    if (!APP.thrown) APP.pickBall();

    const BLpos = APP.ball.position;
    const BSpos = APP.basket.position

    if (BLpos.distanceTo(BSpos) < APP.basketGoalDiff
      && Math.abs(BLpos.y - BSpos.y) < APP.basketYGoalDiff 
      && !APP.goal) APP.onGoal(BLpos, BSpos);
  });
}