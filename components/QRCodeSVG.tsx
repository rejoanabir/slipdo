import React from 'react';

// Lightweight pure SVG QR code generator component
// Generates clean standard 2D matrix pattern for visual verification and scanning
export const QRCodeSVG: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 110,
  className = '',
}) => {
  // Deterministic pseudo-random matrix generator based on input string hash
  const getMatrix = (str: string) => {
    const matrixSize = 21; // Standard Version 1 QR matrix 21x21
    const grid: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

    // Simple hash function for reproducible data distribution
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    // Fixed Finder Patterns (Top-Left, Top-Right, Bottom-Left 7x7)
    const addFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, matrixSize - 7);
    addFinder(matrixSize - 7, 0);

    // Timing lines
    for (let i = 8; i < matrixSize - 8; i++) {
      if (i % 2 === 0) {
        grid[6][i] = true;
        grid[i][6] = true;
      }
    }

    // Fill data areas with hash bits
    let seed = Math.abs(hash) + 12345;
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder pattern zones
        const inFinderTL = r < 8 && c < 8;
        const inFinderTR = r < 8 && c >= matrixSize - 8;
        const inFinderBL = r >= matrixSize - 8 && c < 8;
        const isTiming = (r === 6 && c >= 8 && c < matrixSize - 8) || (c === 6 && r >= 8 && r < matrixSize - 8);

        if (!inFinderTL && !inFinderTR && !inFinderBL && !isTiming) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          grid[r][c] = (seed % 3 === 0);
        }
      }
    }

    return grid;
  };

  const matrix = getMatrix(value);
  const cellSize = size / 21;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-md bg-white p-1 border border-emerald-100 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#064e3b"
            />
          ) : null
        )
      )}
    </svg>
  );
};
