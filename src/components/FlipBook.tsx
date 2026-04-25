import React, { useRef, useEffect, useCallback } from 'react';
import { Animal } from '../types/animal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point { x: number; y: number; }

interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

interface DragState {
  active: boolean;
  fromRight: boolean;
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

interface AnimState {
  active: boolean;
  completing: boolean;
  reverting: boolean;
  fromRight: boolean;
  progress: number;
  startIndex: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 300;
const H = 400;
const ANIM_SPEED = 0.045;
const SNAP_THRESHOLD = 0.35;

// ─── Pure geometry helpers (module-level, no closure issues) ─────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isOnFlapSide(p: Point, a: Point, b: Point, fromRight: boolean): boolean {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  return fromRight ? cross > 0 : cross < 0;
}

function lineSegIntersect(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x, ry = b.y - a.y;
  const sx = d.x - c.x, sy = d.y - c.y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denom;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denom;
  if (u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: a.x + t * rx, y: a.y + t * ry };
}

function intersectLineRect(a: Point, b: Point, x: number, y: number, w: number, h: number): Point[] {
  const edges: [Point, Point][] = [
    [{ x, y },         { x: x + w, y }        ],
    [{ x: x + w, y },  { x: x + w, y: y + h } ],
    [{ x: x + w, y: y + h }, { x, y: y + h }  ],
    [{ x, y: y + h },  { x, y }               ],
  ];
  const result: Point[] = [];
  for (const [p, q] of edges) {
    const pt = lineSegIntersect(a, b, p, q);
    if (pt) {
      // deduplicate nearly identical points
      if (!result.some(r => Math.abs(r.x - pt.x) < 0.5 && Math.abs(r.y - pt.y) < 0.5)) {
        result.push(pt);
      }
    }
  }
  return result;
}

// Apply a reflection transform across the line through A and B to a 2D context
function applyReflectionTransform(ctx: CanvasRenderingContext2D, a: Point, b: Point): void {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const cos2 = (dx * dx - dy * dy) / len2;
  const sin2 = (2 * dx * dy) / len2;
  // Reflection matrix across line through origin, then translate back
  ctx.transform(
    cos2,  sin2,
    sin2, -cos2,
    a.x * (1 - cos2) - a.y * sin2,
    a.y * (1 + cos2) - a.x * sin2,
  );
}

function buildFlapPath(
  ctx: CanvasRenderingContext2D,
  foldA: Point, foldB: Point,
  fromRight: boolean,
): void {
  const pts = intersectLineRect(foldA, foldB, 0, 0, W, H);
  if (pts.length < 2) { ctx.rect(0, 0, W, H); return; }

  const allCorners: Point[] = [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H },
  ];

  ctx.moveTo(pts[0].x, pts[0].y);
  for (const c of allCorners) {
    if (isOnFlapSide(c, foldA, foldB, fromRight)) ctx.lineTo(c.x, c.y);
  }
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.closePath();
}

function buildStayPath(
  ctx: CanvasRenderingContext2D,
  foldA: Point, foldB: Point,
  fromRight: boolean,
): void {
  const pts = intersectLineRect(foldA, foldB, 0, 0, W, H);
  if (pts.length < 2) { ctx.rect(0, 0, W, H); return; }

  const allCorners: Point[] = [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H },
  ];

  ctx.moveTo(pts[0].x, pts[0].y);
  for (const c of allCorners) {
    if (!isOnFlapSide(c, foldA, foldB, fromRight)) ctx.lineTo(c.x, c.y);
  }
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.closePath();
}

// ─── Page renderer ───────────────────────────────────────────────────────────

type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function rrect(ctx: AnyCtx, x: number, y: number, w: number, h: number, r: number,
  tl = true, tr = true, br = true, bl = true): void {
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

function pill(ctx: AnyCtx, x: number, y: number, w: number, h: number): void {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.closePath();
}

function wrapText(ctx: AnyCtx, text: string, cx: number, y: number, maxW: number, lineH: number): void {
  const words = text.split(' ');
  let line = '';
  let row = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, y + row * lineH);
      line = word; row++;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, y + row * lineH);
}

function renderPage(animal: Animal, index: number, total: number, dpr: number): OffscreenCanvas {
  const oc = new OffscreenCanvas(W * dpr, H * dpr);
  const ctx = oc.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const wild = animal.type === 'wild';

  // Background
  ctx.fillStyle = '#fdf6ec';
  rrect(ctx, 0, 0, W, H, 14); ctx.fill();

  // Notebook lines
  ctx.strokeStyle = 'rgba(200,169,110,0.20)';
  ctx.lineWidth = 1;
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Spine
  const sg = ctx.createLinearGradient(0, 0, 22, 0);
  sg.addColorStop(0,   '#a07840');
  sg.addColorStop(0.4, '#d4a060');
  sg.addColorStop(0.8, '#b88040');
  sg.addColorStop(1,   '#a07840');
  ctx.fillStyle = sg;
  rrect(ctx, 0, 0, 22, H, 4, true, false, false, true); ctx.fill();

  // Badge
  const bW = 110, bH = 22, bX = (W - bW) / 2, bY = 18;
  ctx.fillStyle = wild ? '#bbf7d0' : '#fde68a';
  pill(ctx, bX, bY, bW, bH); ctx.fill();
  ctx.fillStyle = wild ? '#065f46' : '#92400e';
  ctx.font = 'bold 10px "Nunito", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(wild ? '🌿 WILD' : '🏠 DOMESTIC', W / 2, bY + bH / 2);

  // Emoji
  ctx.font = `${Math.floor(W * 0.27)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.emoji, W / 2, H * 0.42);

  // Name
  ctx.fillStyle = '#3d2d0f';
  ctx.font = `400 ${Math.floor(W * 0.096)}px "Fredoka One", cursive`;
  ctx.fillText(animal.name, W / 2, H * 0.52);

  // Description
  ctx.fillStyle = '#7c5c2a';
  ctx.font = `600 ${Math.floor(W * 0.046)}px "Nunito", sans-serif`;
  wrapText(ctx, animal.desc, W / 2, H * 0.59, W - 48, 18);

  // Fun fact box
  const fX = 24, fY = H * 0.72, fW = W - 48, fH = H * 0.17;
  ctx.fillStyle = 'rgba(255,245,200,0.75)';
  ctx.strokeStyle = '#e0c06a'; ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  rrect(ctx, fX, fY, fW, fH, 10); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#b45309';
  ctx.font = `800 ${Math.floor(W * 0.043)}px "Nunito", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Fun fact:', W / 2, fY + 16);
  ctx.fillStyle = '#6b4c1e';
  ctx.font = `600 ${Math.floor(W * 0.04)}px "Nunito", sans-serif`;
  wrapText(ctx, animal.fact, W / 2, fY + 32, fW - 16, 16);

  // Page number
  ctx.fillStyle = '#b8945a';
  ctx.font = '700 11px "Nunito", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${index + 1} / ${total}`, W / 2, H - 10);

  // Border
  ctx.strokeStyle = '#ddc898'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  rrect(ctx, 0, 0, W, H, 14); ctx.stroke();

  return oc;
}

// ─── FlipBook component ───────────────────────────────────────────────────────

const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const pageCache   = useRef<Map<number, OffscreenCanvas>>(new Map());
  const rafRef      = useRef<number>(0);
  const ciRef       = useRef<number>(currentIndex);
  ciRef.current = currentIndex;

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;
  const dprRef = useRef(dpr);
  dprRef.current = dpr;

  const animalsRef = useRef(animals);
  animalsRef.current = animals;

  const drag = useRef<DragState>({
    active: false, fromRight: false,
    startX: 0, startY: 0, curX: 0, curY: 0,
  });

  const anim = useRef<AnimState>({
    active: false, completing: false, reverting: false,
    fromRight: false, progress: 0, startIndex: 0,
  });

  // Invalidate cache when animal list changes
  useEffect(() => { pageCache.current.clear(); }, [animals]);

  const getPage = useCallback((idx: number): OffscreenCanvas | null => {
    const list = animalsRef.current;
    if (idx < 0 || idx >= list.length) return null;
    if (!pageCache.current.has(idx)) {
      pageCache.current.set(idx, renderPage(list[idx], idx, list.length, dprRef.current));
    }
    return pageCache.current.get(idx)!;
  }, []);

  // ── Main render ────────────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dprRef.current, dprRef.current);

    const ci  = ciRef.current;
    const a   = anim.current;
    const d   = drag.current;
    const isActive = d.active || a.active;

    // Determine which page index is visually "on top" right now
    const frontIdx = a.active ? a.startIndex : ci;
    // The page behind/underneath (destination)
    const destIdx  = a.active
      ? (a.fromRight ? a.startIndex + 1 : a.startIndex - 1)
      : ci;

    // ── Draw destination page underneath ─────────────────────────────────
    const destPage = getPage(destIdx !== frontIdx ? destIdx : (ci > 0 ? ci - 1 : ci + 1));
    if (destPage && isActive) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.14)';
      ctx.shadowBlur = 14; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
      ctx.drawImage(destPage, 0, 0, W, H);
      ctx.restore();
    }

    // ── Compute fold progress ─────────────────────────────────────────────
    let progress = 0;
    let fromRight = true;

    if (d.active) {
      fromRight = d.fromRight;
      const dist = fromRight ? d.startX - d.curX : d.curX - d.startX;
      progress = clamp(dist / W, 0, 1);
    } else if (a.active) {
      fromRight = a.fromRight;
      progress = a.progress;
    }

    const frontPage = getPage(frontIdx);

    if (!isActive) {
      // Static — draw front page flat
      if (frontPage) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.16)';
        ctx.shadowBlur = 18; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
        ctx.drawImage(frontPage, 0, 0, W, H);
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    // ── Fold-crease geometry ──────────────────────────────────────────────
    // Drag tip position
    const tipX = fromRight ? W * (1 - progress) : W * progress;
    const tipY = clamp(d.active ? d.curY : H / 2, 0, H);

    // The corner being peeled
    const cornerX = fromRight ? W : 0;
    const cornerY = tipY < H / 2 ? 0 : H;

    // Fold-crease midpoint = midpoint of corner→tip
    const foldMidX = (tipX + cornerX) / 2;
    const foldMidY = (tipY + cornerY) / 2;

    // Crease direction = perpendicular to corner→tip vector
    const vecX = tipX - cornerX;
    const vecY = tipY - cornerY;
    const vecLen = Math.sqrt(vecX * vecX + vecY * vecY) || 1;
    const nx = -vecY / vecLen;  // perpendicular
    const ny =  vecX / vecLen;

    const BIG = W * 3;
    const foldA: Point = { x: foldMidX - nx * BIG, y: foldMidY - ny * BIG };
    const foldB: Point = { x: foldMidX + nx * BIG, y: foldMidY + ny * BIG };

    // ── Draw the staying half (still flat on the table) ───────────────────
    if (frontPage) {
      ctx.save();
      ctx.beginPath();
      buildStayPath(ctx, foldA, foldB, fromRight);
      ctx.clip();

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.16)';
      ctx.shadowBlur = 14;
      ctx.drawImage(frontPage, 0, 0, W, H);
      ctx.restore();

      // Shadow cast by the lifted flap onto the flat part
      const shadGrad = ctx.createLinearGradient(
        foldMidX - nx * 50, foldMidY - ny * 50,
        foldMidX + nx * 2,  foldMidY + ny * 2
      );
      shadGrad.addColorStop(0,   'rgba(0,0,0,0)');
      shadGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
      shadGrad.addColorStop(1,   'rgba(0,0,0,0.25)');
      ctx.fillStyle = shadGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.restore();
    }

    // ── Draw the lifted flap (reflected across crease) ────────────────────
    if (frontPage) {
      ctx.save();
      ctx.beginPath();
      buildFlapPath(ctx, foldA, foldB, fromRight);
      ctx.clip();

      // Reflect the canvas context across the fold crease so the
      // page image appears mirrored — simulating the back of the page
      ctx.save();
      applyReflectionTransform(ctx, foldA, foldB);
      ctx.globalAlpha = 0.93;
      ctx.drawImage(frontPage, 0, 0, W, H);
      ctx.restore();

      // Darken the underside of the flap (it's in shadow)
      const flapDark = ctx.createLinearGradient(
        foldMidX + nx * 2,  foldMidY + ny * 2,
        foldMidX - nx * 80, foldMidY - ny * 80
      );
      flapDark.addColorStop(0,   'rgba(0,0,0,0.30)');
      flapDark.addColorStop(0.5, 'rgba(0,0,0,0.12)');
      flapDark.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = flapDark;
      ctx.fillRect(0, 0, W, H);

      ctx.restore();
    }

    // ── Fold-crease highlight (paper edge catching light) ─────────────────
    ctx.save();
    const creasePts = intersectLineRect(foldA, foldB, 0, 0, W, H);
    if (creasePts.length === 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(creasePts[0].x, creasePts[0].y);
      ctx.lineTo(creasePts[1].x, creasePts[1].y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // outer scale
  }, [getPage]);

  // ── Animation tick ─────────────────────────────────────────────────────────
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const tick = useCallback(() => {
    const a = anim.current;

    if (a.active) {
      if (a.completing) {
        a.progress = Math.min(a.progress + ANIM_SPEED * 1.6, 1);
        if (a.progress >= 1) {
          const next = a.fromRight ? a.startIndex + 1 : a.startIndex - 1;
          a.active = false;
          onPageChangeRef.current(clamp(next, 0, animalsRef.current.length - 1));
        }
      } else {
        // reverting
        a.progress = Math.max(a.progress - ANIM_SPEED * 2.5, 0);
        if (a.progress <= 0) a.active = false;
      }
    }

    drawFrame();
    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Pointer helpers ────────────────────────────────────────────────────────
  const toLocal = (canvas: HTMLCanvasElement, clientX: number, clientY: number): Point => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width)  * W,
      y: ((clientY - r.top)  / r.height) * H,
    };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || anim.current.active) return;
    const pos = toLocal(canvas, e.clientX, e.clientY);
    const fromRight = pos.x > W / 2;
    const ci = ciRef.current;
    if (fromRight && ci >= animalsRef.current.length - 1) return;
    if (!fromRight && ci <= 0) return;

    drag.current = {
      active: true, fromRight,
      startX: pos.x, startY: pos.y,
      curX: pos.x,   curY: pos.y,
    };
    canvas.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = toLocal(canvas, e.clientX, e.clientY);
    drag.current.curX = pos.x;
    drag.current.curY = pos.y;
  }, []);

  const onPointerUp = useCallback(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    const dist = d.fromRight ? d.startX - d.curX : d.curX - d.startX;
    const progress = clamp(dist / W, 0, 1);
    const completing = progress >= SNAP_THRESHOLD;

    anim.current = {
      active: true,
      completing,
      reverting: !completing,
      fromRight: d.fromRight,
      startIndex: ciRef.current,
      progress,
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W * dpr}
      height={H * dpr}
      style={{ width: W, height: H, display: 'block', cursor: 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Animal flipbook — drag right half forward or left half backward to turn pages"
    />
  );
};

export default FlipBook;
