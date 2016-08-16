// Keep a ball and goal detection.
export const keep_ball = (APP) => {
  return new WHS.Loop(() => {
    if (!APP.thrown) APP.keepBall();

    const BLpos = APP.ball.position;
    const BSpos = APP.basket.position

    if (BLpos.distanceTo(BSpos) < APP.basketGoalDiff
      && Math.abs(BLpos.y - BSpos.y + APP.basketYDeep()) < APP.basketYGoalDiff() 
      && !APP.goal) APP.onGoal(BLpos, BSpos);
  });
}