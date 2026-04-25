import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Animal } from '../types/animal';

interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

interface Point { x: number; y: number; }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Reflect point P across the line defined by A→B
function reflectPoint(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  return { x: 2 * (a.x + t * dx) - p.x, y: 2 * (a.y + t * dy) - p.y };
}

// ─── Render a single page into an OffscreenCanvas ────────────────────────────

function renderPageToCanvas(
  animal: Animal,
  index: number,
  total: number,
  W: number,
  H: number,
  dpr: number
): OffscreenCanvas {
  const oc = new OffscreenCanvas(W * dpr, H * dpr);
  const ctx = oc.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const isWild = animal.type === 'wild';

  // Background
  ctx.fillStyle = '#fdf6ec';
  ctx.beginPath();
  roundedRect(ctx, 0, 0, W, H, 14);
  ctx.fill();

  // Notebook lines
  ctx.strokeStyle = 'rgba(200,169,110,0.20)';
  ctx.lineWidth = 1;
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Spine
  const spineGrad = ctx.createLinearGradient(0, 0, 22, 0);
  spineGrad.addColorStop(0,   '#a07840');
  spineGrad.addColorStop(0.4, '#d4a060');
  spineGrad.addColorStop(0.8, '#b88040');
  spineGrad.addColorStop(1,   '#a07840');
  ctx.fillStyle = spineGrad;
  ctx.beginPath();
  roundedRect(ctx, 0, 0, 22, H, 4, true, false, false, true);
  ctx.fill();

  // Category badge
  ctx.fillStyle = isWild ? '#bbf7d0' : '#fde68a';
  const badgeW = 110, badgeH = 22, badgeX = (W - badgeW) / 2, badgeY = 18;
  roundedPill(ctx, badgeX, badgeY, badgeW, badgeH);
  ctx.fill();
  ctx.fillStyle = isWild ? '#065f46' : '#92400e';
  ctx.font = 'bold 10px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isWild ? '🌿 WILD' : '🏠 DOMESTIC', W / 2, badgeY + badgeH / 2);

  // Emoji (large)
  ctx.font = `${Math.floor(W * 0.27)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.emoji, W / 2, H * 0.42);

  // Name
  ctx.fillStyle = '#3d2d0f';
  ctx.font = `400 ${Math.floor(W * 0.096)}px "Fredoka One", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.name, W / 2, H * 0.52);

  // Description (word-wrapped)
  ctx.fillStyle = '#7c5c2a';
  ctx.font = `600 ${Math.floor(W * 0.046)}px "Nunito", sans-serif`;
  wrapText(ctx, animal.desc, W / 2, H * 0.59, W - 48, 18);

  // Fun fact box
  const fboxX = 24, fboxY = H * 0.72, fboxW = W - 48, fboxH = H * 0.17;
  ctx.fillStyle = 'rgba(255,245,200,0.75)';
  ctx.strokeStyle = '#e0c06a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  roundedRect(ctx, fboxX, fboxY, fboxW, fboxH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#b45309';
  ctx.font = `800 ${Math.floor(W * 0.043)}px "Nunito", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Fun fact:', W / 2, fboxY + 16);
  ctx.fillStyle = '#6b4c1e';
  ctx.font = `600 ${Math.floor(W * 0.04)}px "Nunito", sans-serif`;
  wrapText(ctx, animal.fact, W / 2, fboxY + 32, fboxW - 16, 16);

  // Page number
  ctx.fillStyle = '#b8945a';
  ctx.font = `700 11px "Nunito", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${index + 1} / ${total}`, W / 2, H - 10);

  // Border
  ctx.strokeStyle = '#ddc898';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  roundedRect(ctx, 0, 0, W, H, 14);
  ctx.stroke();

  return oc;
}

// ─── Canvas drawing helpers ──────────────────────────────────────────────────

function roundedRect(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  tl = true, tr = true, br = true, bl = true
) {
  ctx.beginPath();
  ctx.moveTo(x + (tl ? r : 0), y);
  ctx.lineTo(x + w - (tr ? r : 0), y);
  if (tr) ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - (br ? r : 0));
  if (br) ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + (bl ? r : 0), y + h);
  if (bl) ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + (tl ? r : 0));
  if (tl) ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function roundedPill(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  text: string,
  cx: number, y: number, maxW: number, lineH: number
) {
  const words = text.split(' ');
  let line = '';
  let row = 0;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, y + row * lineH);
      line = word; row++;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, y + row * lineH);
}

// ─── The main FlipBook canvas component ─────────────────────────────────────

type DragState = {
  active: boolean;
  fromRight: boolean; // drag started from right edge = turning forward
  startX: number;
  startY: number;
  curX: number;
  curY: number;
};

type AnimState = {
  active: boolean;
  completing: boolean; // snapping to done
  reverting: boolean;  // snapping back
  fromRight: boolean;
  progress: number;    // 0 → 1
  startIndex: number;
};

const ANIM_SPEED = 0.045;
const SNAP_THRESHOLD = 0.35; // if drag > 35% of width → complete the turn

const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageCache = useRef<Map<number, OffscreenCanvas>>(new Map());
  const drag = useRef<DragState>({
    active: false, fromRight: false,
    startX: 0, startY: 0, curX: 0, curY: 0,
  });
  const anim = useRef<AnimState>({
    active: false, completing: false, reverting: false,
    fromRight: false, progress: 0, startIndex: 0,
  });
  const rafRef = useRef<number>(0);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // ── Dimensions ──────────────────────────────────────────────────────────
  const W = 300, H = 400;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // ── Build / cache page bitmaps ───────────────────────────────────────────
  const getPage = useCallback((idx: number): OffscreenCanvas | null => {
    if (idx < 0 || idx >= animals.length) return null;
    if (!pageCache.current.has(idx)) {
      pageCache.current.set(
        idx,
        renderPageToCanvas(animals[idx], idx, animals.length, W, H, dpr)
      );
    }
    return pageCache.current.get(idx)!;
  }, [animals, dpr]);

  // ── Core draw loop ───────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const s = dpr;
    ctx.save();
    ctx.scale(s, s);

    const ci = currentIndexRef.current;
    const a = anim.current;
    const d = drag.current;

    const isDragging = d.active;
    const isAnimating = a.active;

    // Which pages do we need?
    const frontIdx = isAnimating ? a.startIndex : ci;
    const backIdx  = isAnimating
      ? (a.fromRight ? a.startIndex + 1 : a.startIndex - 1)
      : ci;

    const frontPage = getPage(frontIdx);
    const backPage  = getPage(backIdx !== frontIdx ? backIdx : (ci + 1 < animals.length ? ci + 1 : ci - 1));
    const belowPage = getPage(isAnimating ? (a.fromRight ? a.startIndex + 1 : a.startIndex - 1) : ci);

    // ── 1. Draw the page sitting underneath ──────────────────────────────
    if (belowPage) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(belowPage, 0, 0, W, H);
      ctx.restore();
    }

    // ── 2. Compute the fold point ────────────────────────────────────────
    let progress = 0; // 0 = flat, 1 = fully turned
    let fromRight = true;

    if (isDragging) {
      fromRight = d.fromRight;
      const dragDist = fromRight ? d.startX - d.curX : d.curX - d.startX;
      progress = clamp(dragDist / W, 0, 1);
    } else if (isAnimating) {
      fromRight = a.fromRight;
      progress = a.progress;
    }

    if (!isDragging && !isAnimating) {
      // Static — just draw the front page flat
      if (frontPage) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(frontPage, 0, 0, W, H);
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    // ── 3. Page-curl geometry ────────────────────────────────────────────
    // The drag point in book-local coordinates
    let dragX = fromRight
      ? W - progress * W
      : progress * W;
    let dragY = isDragging ? d.curY : H / 2;
    dragY = clamp(dragY, 0, H);

    // The fold crease runs from a point on the top/bottom edge
    // to a point on the right edge, through the "grab" corner.
    // We compute it with the classic page-curl formula:

    // Corner being lifted
    const cornerX = fromRight ? W : 0;
    const cornerY = dragY < H / 2 ? 0 : H;

    // The fold line midpoint is the midpoint between drag and corner
    const foldMidX = (dragX + cornerX) / 2;
    const foldMidY = (dragY + cornerY) / 2;

    // Fold line direction: perpendicular to corner→drag
    const dx = dragX - cornerX;
    const dy = dragY - cornerY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len; // normal = perpendicular

    // The two endpoints of the fold crease (extend across full book)
    const BIG = W * 2;
    const foldA: Point = { x: foldMidX - nx * BIG, y: foldMidY - ny * BIG };
    const foldB: Point = { x: foldMidX + nx * BIG, y: foldMidY + ny * BIG };

    // ── 4. Clip and draw the back face (page turning away) ──────────────
    // The back face is the portion of the page that has "lifted" —
    // clipped to the polygon on the lifted side of the fold line.
    ctx.save();
    ctx.beginPath();
    // Build clip polygon: the lifted flap region
    clipFlapPolygon(ctx, foldA, foldB, dragX, dragY, fromRight, W, H);
    ctx.clip();

    if (frontPage) {
      // Draw mirrored across fold line to simulate the page flipping
      ctx.save();
      // Reflect the canvas across the fold crease
      const angle = Math.atan2(foldB.y - foldA.y, foldB.x - foldA.x);
      ctx.translate(foldMidX, foldMidY);
      ctx.rotate(angle);
      ctx.scale(1, -1); // flip perpendicular to crease
      ctx.rotate(-angle);
      ctx.translate(-foldMidX, -foldMidY);
      // Mirror across the fold
      const refCorner = reflectPoint({ x: cornerX, y: cornerY }, foldA, foldB);
      const refOrig   = reflectPoint({ x: fromRight ? W : 0, y: cornerY < H/2 ? H : 0 }, foldA, foldB);
      const refOrig2  = reflectPoint({ x: fromRight ? 0 : W, y: cornerY < H/2 ? H : 0 }, foldA, foldB);
      // Actually: reflect entire page drawing
      ctx.translate(foldMidX * 2, 0); // simpler reflection: flip around fold
      // Use a direct reflection transform
      ctx.restore();

      // Simpler correct approach: reflect page image across fold line
      ctx.save();
      reflectCtxAcrossLine(ctx, foldA, foldB);

      // Draw the back side with slight darkening (shadow on underside)
      ctx.globalAlpha = 0.92;
      if (frontPage) ctx.drawImage(frontPage, 0, 0, W, H);

      // Underside shadow gradient
      const shadGrad = ctx.createLinearGradient(
        fromRight ? W : 0, 0, fromRight ? W - 60 : 60, 0
      );
      shadGrad.addColorStop(0,   'rgba(0,0,0,0.28)');
      shadGrad.addColorStop(1,   'rgba(0,0,0,0.0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = shadGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    ctx.restore();

    // ── 5. Draw the front face (remaining visible portion) ───────────────
    ctx.save();
    ctx.beginPath();
    clipStayingPolygon(ctx, foldA, foldB, fromRight, W, H);
    ctx.clip();

    if (frontPage) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = fromRight ? -4 : 4;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(frontPage, 0, 0, W, H);
      ctx.restore();
    }

    // Rolling shadow on the staying half near the fold
    const flapShadGrad = ctx.createLinearGradient(
      foldMidX - nx * 40, foldMidY - ny * 40,
      foldMidX + nx * 40, foldMidY + ny * 40
    );
    flapShadGrad.addColorStop(0, 'rgba(0,0,0,0.0)');
    flapShadGrad.addColorStop(0.6, 'rgba(0,0,0,0.0)');
    flapShadGrad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = flapShadGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();

    // ── 6. Fold edge highlight (paper thickness) ─────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Draw the fold crease within page bounds
    const t0 = intersectLineRect(foldA, foldB, 0, 0, W, H);
    if (t0.length === 2) {
      ctx.moveTo(t0[0].x, t0[0].y);
      ctx.lineTo(t0[1].x, t0[1].y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // outer scale
  }, [getPage, animals.length, dpr]);

  // ── Reflect canvas 2D context across a line ──────────────────────────────
  function reflectCtxAcrossLine(
    ctx: CanvasRenderingContext2D,
    a: Point, b: Point
  ) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const cos2 = (dx * dx - dy * dy) / len2;
    const sin2 = 2 * dx * dy / len2;
    ctx.transform(cos2, sin2, sin2, -cos2,
      a.x * (1 - cos2) - a.y * sin2,
      a.x * (-sin2) + a.y * (1 + cos2)
    );
  }

  // ── Clip polygon helpers ─────────────────────────────────────────────────
  function clipFlapPolygon(
    ctx: CanvasRenderingContext2D,
    foldA: Point, foldB: Point,
    _dragX: number, _dragY: number,
    fromRight: boolean, W: number, H: number
  ) {
    // The "flap" is the portion of the page on the side being lifted
    const corners: Point[] = fromRight
      ? [{ x: W, y: 0 }, { x: W, y: H }]
      : [{ x: 0, y: 0 }, { x: 0, y: H }];

    // Intersect fold line with page edges
    const pts = intersectLineRect(foldA, foldB, 0, 0, W, H);

    if (pts.length < 2) return;

    ctx.moveTo(pts[0].x, pts[0].y);
    // Walk the corners on the lifted side
    const allCorners: Point[] = [
      { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }
    ];
    for (const c of allCorners) {
      if (isOnFlapSide(c, foldA, foldB, fromRight)) {
        ctx.lineTo(c.x, c.y);
      }
    }
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.closePath();
  }

  function clipStayingPolygon(
    ctx: CanvasRenderingContext2D,
    foldA: Point, foldB: Point,
    fromRight: boolean, W: number, H: number
  ) {
    const pts = intersectLineRect(foldA, foldB, 0, 0, W, H);
    if (pts.length < 2) {
      ctx.rect(0, 0, W, H);
      return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    const allCorners: Point[] = [
      { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }
    ];
    for (const c of allCorners) {
      if (!isOnFlapSide(c, foldA, foldB, fromRight)) {
        ctx.lineTo(c.x, c.y);
      }
    }
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.closePath();
  }

  function isOnFlapSide(p: Point, a: Point, b: Point, fromRight: boolean): boolean {
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    return fromRight ? cross > 0 : cross < 0;
  }

  // Find where an infinite line (through A and B) intersects rectangle edges
  function intersectLineRect(a: Point, b: Point, x: number, y: number, w: number, h: number): Point[] {
    const edges: [Point, Point][] = [
      [{ x, y }, { x: x + w, y }],
      [{ x: x + w, y }, { x: x + w, y: y + h }],
      [{ x: x + w, y: y + h }, { x, y: y + h }],
      [{ x, y: y + h }, { x, y }],
    ];
    const result: Point[] = [];
    for (const [p, q] of edges) {
      const pt = lineLineIntersect(a, b, p, q);
      if (pt) result.push(pt);
    }
    return result;
  }

  function lineLineIntersect(a: Point, b: Point, c: Point, d: Point): Point | null {
    const r = { x: b.x - a.x, y: b.y - a.y };
    const s = { x: d.x - c.x, y: d.y - c.y };
    const denom = r.x * s.y - r.y * s.x;
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / denom;
    const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / denom;
    if (u < 0 || u > 1) return null; // must be on segment c→d
    return { x: a.x + t * r.x, y: a.y + t * r.y };
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const a = anim.current;
    if (a.active) {
      if (a.completing) {
        a.progress = Math.min(a.progress + ANIM_SPEED * 1.5, 1);
        if (a.progress >= 1) {
          const newIndex = a.fromRight
            ? a.startIndex + 1
            : a.startIndex - 1;
          a.active = false;
          onPageChange(clamp(newIndex, 0, animals.length - 1));
        }
      } else if (a.reverting) {
        a.progress = Math.max(a.progress - ANIM_SPEED * 2, 0);
        if (a.progress <= 0) a.active = false;
      }
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw, onPageChange, animals.length]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Pointer event handlers ────────────────────────────────────────────────
  const getLocalPos = (canvas: HTMLCanvasElement, clientX: number, clientY: number): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || anim.current.active) return;
    const pos = getLocalPos(canvas, e.clientX, e.clientY);
    // Determine drag origin: right half = forward, left half = backward
    const fromRight = pos.x > W / 2;
    // Check bounds for right/left edge zones
    const ci = currentIndexRef.current;
    if (fromRight && ci >= animals.length - 1) return;
    if (!fromRight && ci <= 0) return;

    drag.current = {
      active: true, fromRight,
      startX: pos.x, startY: pos.y,
      curX: pos.x, curY: pos.y,
    };
    canvas.setPointerCapture(e.pointerId);
  }, [animals.length]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drag.current.active) return;
    const pos = getLocalPos(canvas, e.clientX, e.clientY);
    drag.current.curX = pos.x;
    drag.current.curY = pos.y;
  }, []);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    const dragDist = d.fromRight ? d.startX - d.curX : d.curX - d.startX;
    const progress = clamp(dragDist / W, 0, 1);

    anim.current = {
      active: true,
      fromRight: d.fromRight,
      startIndex: currentIndexRef.current,
      progress,
      completing: progress >= SNAP_THRESHOLD,
      reverting: progress < SNAP_THRESHOLD,
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W * dpr}
      height={H * dpr}
      style={{ width: W, height: H, cursor: 'grab', touchAction: 'none', display: 'block' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Animal flipbook — drag left or right edge to turn pages"
    />
  );
};

export default FlipBook;
