/**
 * Topographic contour generator — the site's signature motif.
 *
 * Builds a scalar field = fractal noise (fBm of value noise) with domain
 * warping, extracts iso-contours with marching squares, stitches the segments
 * into continuous polylines, and smooths them into curves. Everything is
 * deterministic (no Math.random / Date.now) so builds stay reproducible.
 *
 * Shared by components/TopoBackground.astro (the live page background) and
 * utils/og.ts (the generated social-share images), parameterised by size so
 * each surface can tune density to its own canvas.
 */

export interface TopoOptions {
  /** Field width in px. */
  width: number;
  /** Field height in px. */
  height: number;
  /** Sampling step in px (smaller = smoother, heavier). */
  cell?: number;
  /** Noise scale (larger = broader patterns). */
  noiseScale?: number;
  /** Domain-warping strength (lower = less erratic). */
  warp?: number;
  /** Noise detail (fewer = rounder, softer curves). */
  octaves?: number;
  /** Number of contour lines (more = tighter lines). */
  levels?: number;
  /** One index ("master") contour every N levels. */
  masterEvery?: number;
}

export interface TopoPath {
  d: string;
  master: boolean;
}

type Pt = [number, number];

export function generateContours(opts: TopoOptions): TopoPath[] {
  const {
    width: W,
    height: H,
    cell: CELL = 17,
    noiseScale: NS = 470,
    warp: WARP = 0.16,
    octaves: OCTAVES = 3,
    levels: LEVELS = 24,
    masterEvery: MASTER_EVERY = 6,
  } = opts;

  // --- deterministic value noise ---
  function hash(x: number, y: number, seed: number): number {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + seed * 1442695040;
    h = (h ^ (h >>> 13)) >>> 0;
    h = (h * 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  const smooth = (t: number) => t * t * (3 - 2 * t);
  function vnoise(x: number, y: number, seed: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;
    const tl = hash(x0, y0, seed);
    const tr = hash(x0 + 1, y0, seed);
    const bl = hash(x0, y0 + 1, seed);
    const br = hash(x0 + 1, y0 + 1, seed);
    const u = smooth(xf);
    const v = smooth(yf);
    return (tl + (tr - tl) * u) * (1 - v) + (bl + (br - bl) * u) * v;
  }
  function fbm(x: number, y: number): number {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < OCTAVES; o++) {
      val += amp * vnoise(x * freq, y * freq, o * 1013 + 7);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / norm;
  }
  // final field: fBm with its domain warped by fBm (organic terrain)
  function field(px: number, py: number): number {
    const nx = px / NS;
    const ny = py / NS;
    const wx = nx + WARP * (fbm(nx + 11.5, ny + 3.2) * 2 - 1);
    const wy = ny + WARP * (fbm(nx + 5.7, ny + 9.1) * 2 - 1);
    return fbm(wx, wy);
  }

  // --- sampling the field over a grid ---
  const cols = Math.floor(W / CELL);
  const rows = Math.floor(H / CELL);
  const grid: number[][] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let r = 0; r <= rows; r++) {
    grid[r] = [];
    for (let c = 0; c <= cols; c++) {
      const val = field(c * CELL, r * CELL);
      grid[r][c] = val;
      if (val < lo) lo = val;
      if (val > hi) hi = val;
    }
  }

  // --- marching squares: segments per level ---
  function lerp(va: number, vb: number, L: number) {
    return (L - va) / (vb - va);
  }
  function contourSegments(L: number): [Pt, Pt][] {
    const segs: [Pt, Pt][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const va = grid[r][c]; // top-left
        const vb = grid[r][c + 1]; // top-right
        const vc = grid[r + 1][c + 1]; // bottom-right
        const vd = grid[r + 1][c]; // bottom-left
        const idx =
          (va > L ? 8 : 0) |
          (vb > L ? 4 : 0) |
          (vc > L ? 2 : 0) |
          (vd > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = c * CELL;
        const y = r * CELL;
        const T: Pt = [x + lerp(va, vb, L) * CELL, y];
        const R: Pt = [x + CELL, y + lerp(vb, vc, L) * CELL];
        const B: Pt = [x + lerp(vd, vc, L) * CELL, y + CELL];
        const Lp: Pt = [x, y + lerp(va, vd, L) * CELL];
        switch (idx) {
          case 1:
            segs.push([Lp, B]);
            break;
          case 2:
            segs.push([B, R]);
            break;
          case 3:
            segs.push([Lp, R]);
            break;
          case 4:
            segs.push([T, R]);
            break;
          case 5:
            segs.push([T, Lp]);
            segs.push([B, R]);
            break;
          case 6:
            segs.push([T, B]);
            break;
          case 7:
            segs.push([T, Lp]);
            break;
          case 8:
            segs.push([T, Lp]);
            break;
          case 9:
            segs.push([T, B]);
            break;
          case 10:
            segs.push([T, R]);
            segs.push([Lp, B]);
            break;
          case 11:
            segs.push([T, R]);
            break;
          case 12:
            segs.push([Lp, R]);
            break;
          case 13:
            segs.push([B, R]);
            break;
          case 14:
            segs.push([Lp, B]);
            break;
        }
      }
    }
    return segs;
  }

  // --- stitch the segments into continuous polylines ---
  const key = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const edgeId = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  function stitch(segs: [Pt, Pt][]): Pt[][] {
    const adj = new Map<string, string[]>();
    const nodes = new Map<string, Pt>();
    for (const [p0, p1] of segs) {
      const k0 = key(p0);
      const k1 = key(p1);
      if (k0 === k1) continue;
      nodes.set(k0, p0);
      nodes.set(k1, p1);
      (adj.get(k0) ?? adj.set(k0, []).get(k0)!).push(k1);
      (adj.get(k1) ?? adj.set(k1, []).get(k1)!).push(k0);
    }
    const used = new Set<string>();
    const lines: Pt[][] = [];
    // start from the free endpoints (degree 1), then the loops
    const starts = [...adj.keys()].sort(
      (a, b) => adj.get(a)!.length - adj.get(b)!.length,
    );
    for (const start of starts) {
      for (const first of adj.get(start)!) {
        if (used.has(edgeId(start, first))) continue;
        const line: Pt[] = [nodes.get(start)!];
        let cur = start;
        let next: string | null = first;
        while (next !== null) {
          used.add(edgeId(cur, next));
          line.push(nodes.get(next)!);
          const prev = cur;
          cur = next;
          next = null;
          for (const n of adj.get(cur)!) {
            if (n !== prev && !used.has(edgeId(cur, n))) {
              next = n;
              break;
            }
          }
          if (cur === start) break;
        }
        if (line.length >= 4) lines.push(line);
      }
    }
    return lines;
  }

  // --- polyline -> smooth curve (quadratics through the midpoints) ---
  function toPath(pts: Pt[]): string {
    const f = (n: number) => Math.round(n).toString();
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
    }
    const last = pts[pts.length - 1];
    d += `L${f(last[0])} ${f(last[1])}`;
    return d;
  }

  const paths: TopoPath[] = [];
  for (let i = 1; i <= LEVELS; i++) {
    const L = lo + ((hi - lo) * i) / (LEVELS + 1);
    const master = i % MASTER_EVERY === 0;
    for (const line of stitch(contourSegments(L))) {
      paths.push({ d: toPath(line), master });
    }
  }
  return paths;
}
