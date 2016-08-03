export default {
  _click(APP) {
    window.addEventListener('click', APP.throwBall);
    window.addEventListener('click', () => {
      const el = APP.world.getRenderer().domElement;
      
      if (!el.fullscreenElement && APP.isMobile) {
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        if (el.mozRequestFullscreen) el.mozRequestFullscreen();
        if (el.msRequestFullscreen) el.msRequestFullscreen();
        if (el.requestFullscreen) el.requestFullscreen();
      }
    });
  },

  _move(APP) {
    ['mousemove', 'touchmove'].forEach((e) => {
      window.addEventListener(e, APP.updateCoords);
    });
  },

  _keypress(APP) {
    window.addEventListener('keypress', APP.checkKeys);
  },

  _resize(APP) {
    APP.cursor.xCenter = window.innerWidth / 2;
    APP.cursor.yCenter = window.innerHeight / 2;

    window.addEventListener('resize', () => {
      const style = document.querySelector('.whs canvas').style;

      style.width = '100%';
      style.height = '100%';
    });
  }
};