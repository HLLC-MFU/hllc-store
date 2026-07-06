(function () {
  const DATA_CODEWORDS = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232];
  const ECC_CODEWORDS = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30];
  const BLOCKS = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2];
  const FORMAT_L_MASK_0 = 0x77c4;

  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 255;
  }

  function reedSolomonGenerator(degree) {
    const result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        result[j] = gfMul(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return result;
  }

  function reedSolomonRemainder(data, degree) {
    const generator = reedSolomonGenerator(degree);
    const result = new Array(degree).fill(0);
    for (const b of data) {
      const factor = b ^ result.shift();
      result.push(0);
      for (let i = 0; i < degree; i++) result[i] ^= gfMul(generator[i], factor);
    }
    return result;
  }

  function appendBits(bits, value, length) {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  }

  function selectVersion(bytes) {
    for (let v = 1; v < DATA_CODEWORDS.length; v++) {
      const ccBits = v < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= DATA_CODEWORDS[v] * 8) return v;
    }
    throw new Error("URL is too long for the built-in QR generator");
  }

  function makeCodewords(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const version = selectVersion(bytes);
    const capacityBits = DATA_CODEWORDS[version] * 8;
    const bits = [];
    appendBits(bits, 0x4, 4);
    appendBits(bits, bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((b) => appendBits(bits, b, 8));
    appendBits(bits, 0, Math.min(4, capacityBits - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      data.push(b);
    }
    for (let pad = 0xec; data.length < DATA_CODEWORDS[version]; pad ^= 0xec ^ 0x11) data.push(pad);

    const blocks = BLOCKS[version];
    const blockLen = DATA_CODEWORDS[version] / blocks;
    const eccLen = ECC_CODEWORDS[version];
    const dataBlocks = [];
    const eccBlocks = [];
    for (let i = 0; i < blocks; i++) {
      const block = data.slice(i * blockLen, (i + 1) * blockLen);
      dataBlocks.push(block);
      eccBlocks.push(reedSolomonRemainder(block, eccLen));
    }
    const result = [];
    for (let i = 0; i < blockLen; i++) dataBlocks.forEach((b) => result.push(b[i]));
    for (let i = 0; i < eccLen; i++) eccBlocks.forEach((b) => result.push(b[i]));
    return { version, codewords: result };
  }

  function makeMatrix(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  }

  function setFunction(matrix, reserved, x, y, dark) {
    if (x < 0 || y < 0 || y >= matrix.length || x >= matrix.length) return;
    matrix[y][x] = dark;
    reserved[y][x] = true;
  }

  function drawFinder(matrix, reserved, x, y) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        setFunction(matrix, reserved, xx, yy, dark);
      }
    }
  }

  function drawAlignment(matrix, reserved, cx, cy) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        setFunction(matrix, reserved, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  function alignmentPositions(version) {
    if (version === 1) return [];
    const count = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
    const result = [6];
    for (let pos = 17 + version * 4; result.length < count; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  function drawFunctionPatterns(matrix, reserved, version) {
    const size = matrix.length;
    drawFinder(matrix, reserved, 0, 0);
    drawFinder(matrix, reserved, size - 7, 0);
    drawFinder(matrix, reserved, 0, size - 7);
    for (let i = 8; i < size - 8; i++) {
      setFunction(matrix, reserved, i, 6, i % 2 === 0);
      setFunction(matrix, reserved, 6, i, i % 2 === 0);
    }
    const positions = alignmentPositions(version);
    positions.forEach((x) => {
      positions.forEach((y) => {
        if ((x === 6 && y === 6) || (x === 6 && y === size - 7) || (x === size - 7 && y === 6)) return;
        drawAlignment(matrix, reserved, x, y);
      });
    });
    setFunction(matrix, reserved, 8, size - 8, true);
    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }
    }
    for (let i = 0; i < 8; i++) {
      reserved[size - 1 - i][8] = true;
      reserved[8][size - 1 - i] = true;
    }
  }

  function drawFormat(matrix) {
    const size = matrix.length;
    const bits = FORMAT_L_MASK_0;
    for (let i = 0; i <= 5; i++) matrix[8][i] = ((bits >>> i) & 1) !== 0;
    matrix[8][7] = ((bits >>> 6) & 1) !== 0;
    matrix[8][8] = ((bits >>> 7) & 1) !== 0;
    matrix[7][8] = ((bits >>> 8) & 1) !== 0;
    for (let i = 9; i < 15; i++) matrix[14 - i][8] = ((bits >>> i) & 1) !== 0;
    for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = ((bits >>> i) & 1) !== 0;
    for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = ((bits >>> i) & 1) !== 0;
  }

  function drawData(matrix, reserved, codewords) {
    const size = matrix.length;
    const bits = [];
    codewords.forEach((b) => appendBits(bits, b, 8));
    let bitIndex = 0;
    let upward = true;
    for (let x = size - 1; x >= 1; x -= 2) {
      if (x === 6) x--;
      for (let yy = 0; yy < size; yy++) {
        const y = upward ? size - 1 - yy : yy;
        for (let dx = 0; dx < 2; dx++) {
          const xx = x - dx;
          if (reserved[y][xx]) continue;
          const raw = bitIndex < bits.length ? bits[bitIndex++] === 1 : false;
          const masked = raw !== ((xx + y) % 2 === 0);
          matrix[y][xx] = masked;
        }
      }
      upward = !upward;
    }
  }

  function renderSvg(matrix) {
    const size = matrix.length;
    const quiet = 4;
    let path = "";
    matrix.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
      });
    });
    const view = size + quiet * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" shape-rendering="crispEdges"><rect width="${view}" height="${view}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  }

  window.CardBottleQR = {
    toSvg(text) {
      const { version, codewords } = makeCodewords(text);
      const size = version * 4 + 17;
      const matrix = makeMatrix(size);
      const reserved = makeMatrix(size).map((row) => row.map(() => false));
      drawFunctionPatterns(matrix, reserved, version);
      drawData(matrix, reserved, codewords);
      drawFormat(matrix);
      return renderSvg(matrix);
    }
  };
})();
