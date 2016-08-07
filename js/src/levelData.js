const levelData = [
  {
    level: 1,
    basketY: 20,
    basketDistance: 80,
    basketColor: 0xff0000,

    force: {
      y: 6,
      z: -2
    }
  },
  {
    level: 2,
    basketY: 25,
    basketDistance: 100,
    basketColor: 0x0000ff,

    force: {
      y: 6.2,
      z: -3
    }
  },
  {
    level: 3,
    basketY: 30,
    basketDistance: 120,
    basketColor: 0x00ff00,

    force: {
      y: 6.2,
      z: -4
    }
  },
  {
    level: 4,
    basketY: 25,
    basketDistance: 150,
    basketColor: 0xffff00,

    force: {
      z: -5,
      y: 6.6
    }
  }
];

export {
  levelData as default
};