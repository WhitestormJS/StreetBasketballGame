const IntToHex = (d, padding) => {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return '#' + hex;
};

export default {
  generateMenuTexture(menu) {
    /* CONFIG */
    const leftPadding = 1700;

    /* CANVAS */
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 1000;
    const context = canvas.getContext('2d');

    context.font = "Bold 100px Richardson";
    context.fillStyle = "#2D3134";
    context.fillText("Time", 0, 150);
    context.fillText(menu.time.toFixed() + 's.', leftPadding, 150);

    context.fillText("Attempts", 0, 300);
    context.fillText(menu.attempts.toFixed(), leftPadding, 300);

    context.fillText("Accuracy", 0, 450);
    context.fillText(menu.accuracy.toFixed(), leftPadding, 450);

    context.font = "Normal 200px FNL";
    context.textAlign = "center";
    context.fillText(menu.markText, 1000, 800);

    const image = document.createElement('img');
    image.src = canvas.toDataURL();

    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    return texture;
  },

  generateLevelTexture(levelData) {
    /* CANVAS */
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const context = canvas.getContext('2d');

    context.fillStyle = "#000";
    context.beginPath();
    context.rect(0, 0, 160, 80);
    context.fill();

    context.fillStyle = "#2D3134";
    context.beginPath();
    context.rect(5, 5, 150, 70);
    context.fill();

    context.fillStyle = "#000";
    context.beginPath();
    context.arc(80, 40, 40, 0, Math.PI * 2, false);
    context.fill();

    context.font = "Bold 60px Richardson";
    context.fillStyle = levelData.basketColor ? IntToHex(levelData.basketColor, 6) : "#2D3134";
    context.textAlign = "center";
    context.fillText("" + levelData.level, 80, 60);

    const image = document.createElement('img');
    image.src = canvas.toDataURL();

    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    return texture;
  },

  generateLevelEmTexture(levelData) {
    /* CANVAS */
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const context = canvas.getContext('2d');

    context.fillStyle = "#aaa";
    context.beginPath();
    context.rect(0, 0, 160, 80);
    context.fill();

    context.fillStyle = "#222";
    context.beginPath();
    context.rect(5, 5, 150, 70);
    context.fill();

    context.font = "Bold 60px Richardson";
    context.fillStyle = "#aaa";
    context.textAlign = "center";
    context.fillText("" + levelData.level, 80, 60);

    const image = document.createElement('img');
    image.src = canvas.toDataURL();

    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    return texture;
  }
};