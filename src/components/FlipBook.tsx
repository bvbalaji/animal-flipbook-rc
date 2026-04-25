import React, { useRef, useEffect, useCallback } from 'react';
import { Animal } from '../types/animal';

interface Point { x: number; y: number; }
interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

const W = 320;
const H = 420;
const SNAP = 0.40;
const SPEED = 0.055;

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// Reflect point P across line A→B
function reflect(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  return { x: 2 * (a.x + t * dx) - p.x, y: 2 * (a.y + t * dy) - p.y };
}

// Intersect infinite line A→B with segment C→D
function lineSegIntersect(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x, ry = b.y - a.y;
  const sx = d.x - c.x, sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
  if (u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: a.x + t * rx, y: a.y + t * ry };
}

// Clip a rectangle [0,0,W,H] by the fold line, returning the polygon on the "flap" side
function flapPolygon(fA: Point, fB: Point, fromRight: boolean): Point[] {
  const rectSegs: [Point, Point][] = [
    [{x:0,y:0}, {x:W,y:0}],
    [{x:W,y:0}, {x:W,y:H}],
    [{x:W,y:H}, {x:0,y:H}],
    [{x:0,y:H}, {x:0,y:0}],
  ];
  const corners: Point[] = [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}];

  // sign check: which side of line A→B
  const side = (p: Point) => (fB.x-fA.x)*(p.y-fA.y) - (fB.y-fA.y)*(p.x-fA.x);
  const flapSign = fromRight ? 1 : -1;

  const poly: Point[] = [];
  // Sutherland-Hodgman style: walk all 4 rect edges, gather flap-side corners + intersections
  const pts: Point[] = [];
  for (const seg of rectSegs) {
    const pt = lineSegIntersect(fA, fB, seg[0], seg[1]);
    if (pt) pts.push(pt);
  }
  for (const c of corners) {
    if (Math.sign(side(c)) === flapSign) poly.push(c);
  }
  poly.push(...pts);

  // Sort polygon by angle around centroid
  if (poly.length < 3) return poly;
  const cx = poly.reduce((s,p)=>s+p.x,0)/poly.length;
  const cy = poly.reduce((s,p)=>s+p.y,0)/poly.length;
  poly.sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));
  return poly;
}

// ─── Page renderer ────────────────────────────────────────────────────────────

type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function rrect(ctx: AnyCtx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y, x+w,y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h, x+w-r,y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h, x,y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x,y, x+r,y, r);
  ctx.closePath();
}

function wrapText(ctx: AnyCtx, text: string, cx: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ');
  let line = '';
  let row = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, y + row * lineH); line = w; row++;
    } else line = test;
  }
  if (line) ctx.fillText(line, cx, y + row * lineH);
}

function renderPage(animal: Animal, index: number, total: number, dpr: number): OffscreenCanvas {
  const oc = new OffscreenCanvas(W * dpr, H * dpr);
  const ctx = oc.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const wild = animal.type === 'wild';

  // Page background with subtle warm gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fef9f0'); bg.addColorStop(1, '#fdf0dc');
  ctx.fillStyle = bg; rrect(ctx, 0, 0, W, H, 14); ctx.fill();

  // Notebook lines
  ctx.strokeStyle = 'rgba(180,140,80,0.15)'; ctx.lineWidth = 1;
  for (let y = 44; y < H - 20; y += 36) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(W - 10, y); ctx.stroke();
  }

  // Spine
  const sg = ctx.createLinearGradient(0, 0, 24, 0);
  sg.addColorStop(0,'#8a6428'); sg.addColorStop(0.3,'#c8903c');
  sg.addColorStop(0.7,'#b07830'); sg.addColorStop(1,'#8a6428');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(0,14); ctx.arcTo(0,0,14,0,14);
  ctx.lineTo(24,0); ctx.lineTo(24,H); ctx.lineTo(0,H);
  ctx.arcTo(0,H,14,H,14); ctx.closePath(); ctx.fill();

  // Spine highlight
  ctx.strokeStyle = 'rgba(255,200,100,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8,10); ctx.lineTo(8,H-10); ctx.stroke();

  // Badge
  const bW = 120, bH = 24, bX = (W-bW)/2, bY = 16;
  const badgeBg = ctx.createLinearGradient(bX, bY, bX, bY+bH);
  if (wild) { badgeBg.addColorStop(0,'#86efac'); badgeBg.addColorStop(1,'#4ade80'); }
  else       { badgeBg.addColorStop(0,'#fde68a'); badgeBg.addColorStop(1,'#fbbf24'); }
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(bX, bY, bW, bH, bH/2); ctx.fill();
  ctx.fillStyle = wild ? '#14532d' : '#78350f';
  ctx.font = `700 10px "Nunito",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(wild ? '🌿  WILD ANIMAL' : '🏠  DOMESTIC', W/2, bY + bH/2);

  // Emoji with soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.font = `${Math.floor(W*0.25)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.emoji, W/2, H*0.43);
  ctx.restore();

  // Name
  ctx.fillStyle = '#2d1a05';
  ctx.font = `400 ${Math.floor(W*0.094)}px "Fredoka One",cursive`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.name, W/2, H*0.53);

  // Description
  ctx.fillStyle = '#7c5422';
  ctx.font = `600 ${Math.floor(W*0.044)}px "Nunito",sans-serif`;
  wrapText(ctx, animal.desc, W/2, H*0.595, W-52, 17);

  // Fun fact box
  const fX=28, fY=H*0.73, fW=W-56, fH=H*0.165;
  const fBg = ctx.createLinearGradient(fX, fY, fX, fY+fH);
  fBg.addColorStop(0,'rgba(255,248,200,0.9)'); fBg.addColorStop(1,'rgba(255,236,160,0.85)');
  ctx.fillStyle = fBg;
  ctx.strokeStyle = '#d4a830'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.roundRect(fX, fY, fW, fH, 10); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#92400e';
  ctx.font = `800 ${Math.floor(W*0.041)}px "Nunito",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Fun fact:', W/2, fY+17);
  ctx.fillStyle = '#5c3308';
  ctx.font = `600 ${Math.floor(W*0.038)}px "Nunito",sans-serif`;
  wrapText(ctx, animal.fact, W/2, fY+34, fW-14, 15);

  // Page number
  ctx.fillStyle = '#b8945a';
  ctx.font = '700 11px "Nunito",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${index+1} / ${total}`, W/2, H-8);

  // Outer border
  ctx.strokeStyle = '#d4a96a'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  rrect(ctx, 0.75, 0.75, W-1.5, H-1.5, 14); ctx.stroke();

  return oc;
}

// ─── FlipBook ─────────────────────────────────────────────────────────────────

interface DragState { active:boolean; fromRight:boolean; startX:number; startY:number; curX:number; curY:number; }
interface AnimState { active:boolean; completing:boolean; fromRight:boolean; progress:number; startIndex:number; }

const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cache     = useRef<Map<number, OffscreenCanvas>>(new Map());
  const rafRef    = useRef<number>(0);
  const ciRef     = useRef(currentIndex);     ciRef.current = currentIndex;
  const listRef   = useRef(animals);          listRef.current = animals;
  const cbRef     = useRef(onPageChange);     cbRef.current = onPageChange;
  const dprRef    = useRef(typeof window !== 'undefined' ? Math.min(window.devicePixelRatio||1,2):1);

  const drag = useRef<DragState>({ active:false,fromRight:false,startX:0,startY:0,curX:0,curY:0 });
  const anim = useRef<AnimState>({ active:false,completing:false,fromRight:false,progress:0,startIndex:0 });

  useEffect(() => { cache.current.clear(); }, [animals]);

  const getPage = useCallback((idx: number): OffscreenCanvas | null => {
    const list = listRef.current;
    if (idx < 0 || idx >= list.length) return null;
    if (!cache.current.has(idx))
      cache.current.set(idx, renderPage(list[idx], idx, list.length, dprRef.current));
    return cache.current.get(idx)!;
  }, []);

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(dprRef.current, dprRef.current);

    const ci = ciRef.current;
    const d  = drag.current;
    const a  = anim.current;

    // ── Which pages are involved ────────────────────────────────────────────
    // "current" = the page being peeled away
    // "next"    = the page revealed underneath
    const curIdx  = a.active ? a.startIndex : ci;
    const fromRight = d.active ? d.fromRight : a.fromRight;
    const destIdx = fromRight ? curIdx + 1 : curIdx - 1;

    const curPage  = getPage(curIdx);
    const destPage = getPage(clamp(destIdx, 0, listRef.current.length - 1));

    const isMoving = d.active || a.active;

    if (!isMoving) {
      // ── Static: draw current page flat with stacked shadow ──────────────
      // Draw "next" page peeking behind as stack effect
      const nextPage = getPage(clamp(ci + 1, 0, listRef.current.length - 1));
      if (nextPage && ci < listRef.current.length - 1) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = 6;
        ctx.drawImage(nextPage, 3, 3, W, H);
        ctx.restore();
      }
      if (curPage) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.20)';
        ctx.shadowBlur = 20; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
        ctx.drawImage(curPage, 0, 0, W, H);
        ctx.restore();
      }
      ctx.restore(); return;
    }

    // ── Compute fold geometry ───────────────────────────────────────────────
    let progress: number;
    if (d.active) {
      const dist = fromRight ? d.startX - d.curX : d.curX - d.startX;
      progress = clamp(dist / W, 0, 1);
    } else {
      progress = a.progress;
    }

    // The "tip" is the corner of the page being dragged.
    // We animate it from the far edge inward as progress goes 0→1.
    // When fromRight: tip starts at (W, dragY) and moves left.
    // When fromLeft:  tip starts at (0, dragY) and moves right.
    const tipY  = clamp(d.active ? d.curY : H / 2, 20, H - 20);
    const tipX  = fromRight
      ? lerp(W, -W * 0.1, progress)   // sweeps left past the spine
      : lerp(0, W * 1.1, progress);   // sweeps right past the edge

    // Corner being peeled (top-right or top-left depending on dragY)
    const cornerX = fromRight ? W : 0;
    const cornerY = tipY < H / 2 ? 0 : H;

    // The fold crease is the perpendicular bisector of corner→tip
    const midX = (cornerX + tipX) / 2;
    const midY = (cornerY + tipY) / 2;
    const vx   = tipX - cornerX;
    const vy   = tipY - cornerY;
    const vLen = Math.sqrt(vx*vx + vy*vy) || 1;
    // Perpendicular to v is (-vy, vx) normalized
    const px = -vy / vLen;
    const py =  vx / vLen;

    const REACH = W * 2.5;
    const foldA: Point = { x: midX - px * REACH, y: midY - py * REACH };
    const foldB: Point = { x: midX + px * REACH, y: midY + py * REACH };

    // ── 1. Draw destination page underneath ─────────────────────────────────
    if (destPage) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
      ctx.drawImage(destPage, 0, 0, W, H);
      ctx.restore();
    }

    // ── 2. Clip to page bounds ──────────────────────────────────────────────
    ctx.save();
    rrect(ctx, 0, 0, W, H, 14); ctx.clip();

    // ── 3. Draw the STAYING portion (flat part not yet peeled) ──────────────
    if (curPage) {
      const stayPoly = flapPolygon(foldA, foldB, !fromRight); // opposite side
      if (stayPoly.length >= 3) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(stayPoly[0].x, stayPoly[0].y);
        for (let i = 1; i < stayPoly.length; i++) ctx.lineTo(stayPoly[i].x, stayPoly[i].y);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(curPage, 0, 0, W, H);

        // Shadow on staying half near the crease (page bending away from you)
        const stayShad = ctx.createLinearGradient(
          midX + px * 30, midY + py * 30,
          midX - px * 30, midY - py * 30
        );
        stayShad.addColorStop(0, 'rgba(0,0,0,0)');
        stayShad.addColorStop(0.5, 'rgba(0,0,0,0)');
        stayShad.addColorStop(1, 'rgba(0,0,0,0.18)');
        ctx.fillStyle = stayShad; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }

    // ── 4. Draw the FLAP (the lifted portion, reflected to show back face) ──
    const flapPoly = flapPolygon(foldA, foldB, fromRight);
    if (flapPoly.length >= 3) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(flapPoly[0].x, flapPoly[0].y);
      for (let i = 1; i < flapPoly.length; i++) ctx.lineTo(flapPoly[i].x, flapPoly[i].y);
      ctx.closePath(); ctx.clip();

      // Reflect canvas across fold crease so front-page content appears mirrored
      // (this simulates looking at the back of a page)
      const dx = foldB.x - foldA.x, dy = foldB.y - foldA.y;
      const len2 = dx*dx + dy*dy;
      const cos2 = (dx*dx - dy*dy) / len2;
      const sin2 = 2*dx*dy / len2;
      ctx.transform(
        cos2,  sin2,
        sin2, -cos2,
        foldA.x*(1-cos2) - foldA.y*sin2,
        foldA.y*(1+cos2) - foldA.x*sin2,
      );

      // Draw back of page (slightly cream-colored, like paper underside)
      ctx.fillStyle = '#f5e8c8';
      ctx.fillRect(0, 0, W, H);

      // Faint mirror of page content showing through (translucent)
      if (curPage) { ctx.globalAlpha = 0.08; ctx.drawImage(curPage, 0, 0, W, H); ctx.globalAlpha = 1; }

      // Reset transform for the shadow gradient
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);

      // Darken the flap (it's lifted away from the light source)
      const flapShad = ctx.createLinearGradient(
        midX - px*5, midY - py*5,
        midX - px * (fromRight ? 140 : -140), midY - py*80
      );
      flapShad.addColorStop(0,   'rgba(0,0,0,0.38)');
      flapShad.addColorStop(0.3, 'rgba(0,0,0,0.18)');
      flapShad.addColorStop(1,   'rgba(0,0,0,0.04)');
      ctx.fillStyle = flapShad; ctx.fillRect(0, 0, W, H);

      ctx.restore();
    }

    // ── 5. Crease highlight (bright paper edge) ─────────────────────────────
    // Find intersection of fold line with page rect
    const rectSegs: [Point,Point][] = [
      [{x:0,y:0},{x:W,y:0}], [{x:W,y:0},{x:W,y:H}],
      [{x:W,y:H},{x:0,y:H}], [{x:0,y:H},{x:0,y:0}],
    ];
    const cPts: Point[] = [];
    for (const [p,q] of rectSegs) {
      const pt = lineSegIntersect(foldA, foldB, p, q);
      if (pt && !cPts.some(r => Math.abs(r.x-pt.x)<1 && Math.abs(r.y-pt.y)<1)) cPts.push(pt);
    }
    if (cPts.length === 2) {
      ctx.save();
      // Crease glow
      const cGrad = ctx.createLinearGradient(
        cPts[0].x - px*8, cPts[0].y - py*8,
        cPts[0].x + px*8, cPts[0].y + py*8,
      );
      cGrad.addColorStop(0,   'rgba(255,255,255,0)');
      cGrad.addColorStop(0.45,'rgba(255,255,255,0.85)');
      cGrad.addColorStop(0.55,'rgba(255,255,255,0.85)');
      cGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(255,240,180,0.8)'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(cPts[0].x, cPts[0].y); ctx.lineTo(cPts[1].x, cPts[1].y); ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // page clip
    ctx.restore(); // scale
  }, [getPage]);

  // ── Tick ────────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const a = anim.current;
    if (a.active) {
      if (a.completing) {
        a.progress = Math.min(a.progress + SPEED * 1.8, 1);
        if (a.progress >= 1) {
          const next = clamp(
            a.fromRight ? a.startIndex + 1 : a.startIndex - 1,
            0, listRef.current.length - 1
          );
          a.active = false;
          cbRef.current(next);
        }
      } else {
        a.progress = Math.max(a.progress - SPEED * 3, 0);
        if (a.progress <= 0) a.active = false;
      }
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Pointer events ───────────────────────────────────────────────────────────
  const toLocal = (canvas: HTMLCanvasElement, cx: number, cy: number): Point => {
    const r = canvas.getBoundingClientRect();
    return { x: ((cx-r.left)/r.width)*W, y: ((cy-r.top)/r.height)*H };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || anim.current.active) return;
    const pos = toLocal(canvas, e.clientX, e.clientY);
    const fromRight = pos.x > W / 2;
    const ci = ciRef.current;
    if (fromRight && ci >= listRef.current.length - 1) return;
    if (!fromRight && ci <= 0) return;
    drag.current = { active:true, fromRight, startX:pos.x, startY:pos.y, curX:pos.x, curY:pos.y };
    canvas.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current.active) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const pos = toLocal(canvas, e.clientX, e.clientY);
    drag.current.curX = pos.x; drag.current.curY = pos.y;
  }, []);

  const onPointerUp = useCallback(() => {
    const d = drag.current; if (!d.active) return;
    d.active = false;
    const dist = d.fromRight ? d.startX - d.curX : d.curX - d.startX;
    const progress = clamp(dist / W, 0, 1);
    const completing = progress >= SNAP;
    anim.current = {
      active:true, completing, fromRight:d.fromRight,
      progress, startIndex: ciRef.current,
    };
  }, []);

  const dpr = dprRef.current;
  return (
    <canvas
      ref={canvasRef}
      width={W * dpr} height={H * dpr}
      style={{ width:W, height:H, display:'block', cursor:'grab', touchAction:'none', borderRadius:14 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Animal flipbook — drag right side forward or left side backward"
    />
  );
};

export default FlipBook;
