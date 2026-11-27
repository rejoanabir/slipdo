'use client';

import React, { useMemo } from 'react';

// Standard Galois Field 256 and Generator Polynomial Tables
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let gfVal = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = gfVal;
  EXP[i + 255] = gfVal;
  LOG[gfVal] = i;
  gfVal = (gfVal << 1) ^ (gfVal & 128 ? 0x11d : 0);
}

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Version table for Level M (Error Correction Medium ~15%)
interface QrVersion {
  ver: number;
  size: number;
  dataCap: number;
  ecPerBlock: number;
  blocks: number;
  totalData: number;
  align: number[];
}

const QR_VERSIONS: QrVersion[] = [
  { ver: 1, size: 21, dataCap: 14, ecPerBlock: 10, blocks: 1, totalData: 16, align: [] },
  { ver: 2, size: 25, dataCap: 26, ecPerBlock: 16, blocks: 1, totalData: 28, align: [6, 18] },
  { ver: 3, size: 29, dataCap: 42, ecPerBlock: 26, blocks: 1, totalData: 44, align: [6, 22] },
  { ver: 4, size: 33, dataCap: 62, ecPerBlock: 18, blocks: 2, totalData: 64, align: [6, 26] },
  { ver: 5, size: 37, dataCap: 84, ecPerBlock: 24, blocks: 2, totalData: 86, align: [6, 30] },
  { ver: 6, size: 41, dataCap: 106, ecPerBlock: 16, blocks: 4, totalData: 108, align: [6, 34] },
];

function encodeQrMatrix(text: string): { matrix: number[][]; size: number } {
  // Convert UTF-8
  const utf8: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      utf8.push(code);
    } else if (code < 2048) {
      utf8.push(192 | (code >> 6), 128 | (code & 63));
    } else {
      utf8.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
    }
  }

  let verInfo: QrVersion = QR_VERSIONS[0];
  for (let v = 0; v < QR_VERSIONS.length; v++) {
    if (utf8.length <= QR_VERSIONS[v].dataCap) {
      verInfo = QR_VERSIONS[v];
      break;
    }
    verInfo = QR_VERSIONS[v];
  }

  // Bit buffer: Byte mode (0100) + 8-bit character count + data
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(utf8.length, 8);
  for (let i = 0; i < utf8.length; i++) {
    pushBits(utf8[i], 8);
  }

  const maxDataBits = verInfo.totalData * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte stream
  const dataBytes = new Uint8Array(verInfo.totalData);
  for (let i = 0; i < verInfo.totalData; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // Reed-Solomon Generator Polynomial
  const ecLen = verInfo.ecPerBlock;
  let genPoly = [1];
  for (let i = 0; i < ecLen; i++) {
    const nextPoly = new Array(genPoly.length + 1).fill(0);
    const root = EXP[i];
    for (let j = 0; j < genPoly.length; j++) {
      nextPoly[j] ^= gmul(genPoly[j], root);
      nextPoly[j + 1] ^= genPoly[j];
    }
    genPoly = nextPoly;
  }

  // Divide data into blocks and generate ECC
  const blocks = verInfo.blocks;
  const dataPerBlock = Math.floor(verInfo.totalData / blocks);
  const allEcBlocks: Uint8Array[] = [];
  const allDataBlocks: Uint8Array[] = [];

  for (let b = 0; b < blocks; b++) {
    const blockData = dataBytes.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    allDataBlocks.push(blockData);

    const msg = new Uint8Array(blockData.length + ecLen);
    msg.set(blockData);

    for (let i = 0; i < blockData.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        for (let j = 0; j < genPoly.length; j++) {
          msg[i + j] ^= gmul(genPoly[j], coef);
        }
      }
    }
    allEcBlocks.push(msg.slice(blockData.length));
  }

  // Interleave data and EC bytes
  const finalCodewords: number[] = [];
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(allDataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(allEcBlocks[b][i]);
    }
  }

  // Matrix generation
  const size = verInfo.size;
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));

  // Function to place 7x7 finder pattern + separator
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isDark = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            matrix[nr][nc] = isDark ? 1 : 0;
          } else {
            matrix[nr][nc] = 0;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns for Version >= 2
  if (verInfo.align.length > 0) {
    const coords = verInfo.align;
    for (const r of coords) {
      for (const c of coords) {
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isDark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            matrix[r + dr][c + dc] = isDark ? 1 : 0;
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Dark module
  matrix[4 * verInfo.ver + 9][8] = 1;

  // Reserve format bits
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
  }

  // Place data modules (2-col zigzag)
  let row = size - 1;
  let dir = -1;
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (matrix[row][curCol] === -1) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const byteIndex = Math.floor(bitIdx / 8);
            const bitOffset = 7 - (bitIdx % 8);
            bit = (finalCodewords[byteIndex] >> bitOffset) & 1;
            bitIdx++;
          }
          // Mask 0: (row + col) % 2 === 0
          const mask = (row + curCol) % 2 === 0 ? 1 : 0;
          matrix[row][curCol] = bit ^ mask;
        }
      }
      row += dir;
      if (row < 0 || row >= size) {
        dir = -dir;
        row += dir;
        break;
      }
    }
  }

  // Standard Format Info: Level M (00) + Mask 0 (000) => BCH format code
  const formatStr = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  for (let i = 0; i < 6; i++) matrix[8][i] = formatStr[i];
  matrix[8][7] = formatStr[6];
  matrix[8][8] = formatStr[7];
  matrix[7][8] = formatStr[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatStr[i];

  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatStr[i];
  for (let i = 7; i < 15; i++) matrix[8][size - 15 + i] = formatStr[i];

  return { matrix, size };
}

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  fillColor?: string;
  quietZone?: number;
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 110,
  className = '',
  fillColor = '#0f172a',
  quietZone = 2,
}) => {
  const { matrix, size: matrixSize } = useMemo(() => {
    try {
      return encodeQrMatrix(value);
    } catch {
      return { matrix: [[1]], size: 1 };
    }
  }, [value]);

  const totalGrid = matrixSize + quietZone * 2;
  const cellSize = size / totalGrid;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={(c + quietZone) * cellSize}
              y={(r + quietZone) * cellSize}
              width={cellSize + 0.05}
              height={cellSize + 0.05}
              fill={fillColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};
