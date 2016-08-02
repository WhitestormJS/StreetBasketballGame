const levelData = [
  {
    level: 1,
    basketY: 20,
    basketDistance: 80,
    basketColor: 0xff0000,

    force: {
      y: 6.2,
      z: -2,
      m: 2400,
      xk: 1
    }
  },
  {
    level: 2,
    basketY: 25,
    basketDistance: 100,
    basketColor: 0x0000ff,

    force: {
      z: -3
    }
  },
  {
    level: 3,
    basketY: 30,
    basketDistance: 120,
    basketColor: 0x00ff00,

    force: {
      z: -4
    }
  },
  {
    level: 4,
    basketY: 25,
    basketDistance: 150,
    basketColor: 0xffff00,

    force: {
      z: -5
    }
  }
];

export {
  levelData as default
};