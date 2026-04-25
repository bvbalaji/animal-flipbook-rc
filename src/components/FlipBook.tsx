import React, { useRef, useEffect, useCallback } from 'react';
import { Animal } from '../types/animal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pt { x: number; y: number; }
interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

// ─── Book dimensions ──────────────────────────────────────────────────────────
const PW = 320; // page width
const PH = 420; // page height

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist  = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** Intersect two LINE SEGMENTS, returns null if they don't cross */
function segSeg(p1: Pt, p2: Pt, p3: Pt, p4: Pt): Pt | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

// ─── Render a page onto an OffscreenCanvas ────────────────────────────────────
type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function rr(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.arcTo(x+w, y,   x+w, y+r,   r);
  ctx.lineTo(x + w, y + h-r); ctx.arcTo(x+w, y+h, x+w-r,y+h, r);
  ctx.lineTo(x + r, y + h);   ctx.arcTo(x,   y+h, x,   y+h-r, r);
  ctx.lineTo(x, y + r);       ctx.arcTo(x,   y,   x+r, y,     r);
  ctx.closePath();
}

function wrap(ctx: Ctx2D, txt: string, cx: number, y: number, maxW: number, lh: number) {
  const words = txt.split(' '); let line = ''; let row = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, y + row * lh); line = w; row++;
    } else line = test;
  }
  if (line) ctx.fillText(line, cx, y + row * lh);
}

function makePage(animal: Animal, idx: number, total: number, dpr: number): OffscreenCanvas {
  const oc  = new OffscreenCanvas(PW * dpr, PH * dpr);
  const ctx = oc.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const wild = animal.type === 'wild';

  // ── Background
  const bg = ctx.createLinearGradient(0, 0, PW, PH);
  bg.addColorStop(0, '#fef9f0'); bg.addColorStop(1, '#faecd8');
  ctx.fillStyle = bg; rr(ctx, 0, 0, PW, PH, 14); ctx.fill();

  // ── Ruled lines
  ctx.strokeStyle = 'rgba(160,120,60,0.13)'; ctx.lineWidth = 1;
  for (let y = 42; y < PH - 18; y += 34) {
    ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(PW - 10, y); ctx.stroke();
  }

  // ── Spine
  const sg = ctx.createLinearGradient(0, 0, 26, 0);
  sg.addColorStop(0, '#7a5420'); sg.addColorStop(0.35, '#c08030');
  sg.addColorStop(0.65, '#a86e28'); sg.addColorStop(1, '#7a5420');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(0, 14); ctx.arcTo(0, 0, 14, 0, 14);
  ctx.lineTo(26, 0); ctx.lineTo(26, PH); ctx.lineTo(0, PH);
  ctx.arcTo(0, PH, 0, PH - 14, 14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,190,80,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(9, 12); ctx.lineTo(9, PH - 12); ctx.stroke();

  // ── Badge
  const bW = 118, bH = 23, bX = (PW - bW) / 2, bY = 15;
  const bb = ctx.createLinearGradient(bX, bY, bX, bY + bH);
  if (wild) { bb.addColorStop(0, '#86efac'); bb.addColorStop(1, '#22c55e'); }
  else      { bb.addColorStop(0, '#fde68a'); bb.addColorStop(1, '#f59e0b'); }
  ctx.fillStyle = bb;
  ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, bH / 2); ctx.fill();
  ctx.fillStyle = wild ? '#14532d' : '#78350f';
  ctx.font = '700 10px "Nunito",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(wild ? '🌿  WILD ANIMAL' : '🏠  DOMESTIC', PW / 2, bY + bH / 2);

  // ── Emoji
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.font = `${Math.floor(PW * 0.24)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.emoji, PW / 2, PH * 0.42);
  ctx.restore();

  // ── Name
  ctx.fillStyle = '#2d1a04';
  ctx.font = `400 ${Math.floor(PW * 0.092)}px "Fredoka One",cursive`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(animal.name, PW / 2, PH * 0.525);

  // ── Description
  ctx.fillStyle = '#7a5220';
  ctx.font = `600 ${Math.floor(PW * 0.042)}px "Nunito",sans-serif`;
  wrap(ctx, animal.desc, PW / 2, PH * 0.592, PW - 54, 17);

  // ── Fun-fact box
  const fX = 28, fY = PH * 0.73, fW = PW - 56, fH = PH * 0.165;
  const fb = ctx.createLinearGradient(fX, fY, fX, fY + fH);
  fb.addColorStop(0, 'rgba(255,246,196,0.94)'); fb.addColorStop(1, 'rgba(255,232,140,0.88)');
  ctx.fillStyle = fb; ctx.strokeStyle = '#c89820';
  ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.roundRect(fX, fY, fW, fH, 10); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#92400e';
  ctx.font = `800 ${Math.floor(PW * 0.04)}px "Nunito",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Fun fact:', PW / 2, fY + 16);
  ctx.fillStyle = '#5c3308';
  ctx.font = `600 ${Math.floor(PW * 0.037)}px "Nunito",sans-serif`;
  wrap(ctx, animal.fact, PW / 2, fY + 33, fW - 16, 15);

  // ── Page number
  ctx.fillStyle = '#b8945a';
  ctx.font = '700 11px "Nunito",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${idx + 1} / ${total}`, PW / 2, PH - 8);

  // ── Border
  ctx.strokeStyle = '#d0a060'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  rr(ctx, 0.75, 0.75, PW - 1.5, PH - 1.5, 14); ctx.stroke();

  return oc;
}

// ─── Curl state ───────────────────────────────────────────────────────────────
interface DragSt { on: boolean; right: boolean; ox: number; oy: number; cx: number; cy: number; }
interface AnimSt { on: boolean; done: boolean; right: boolean; t: number; from: number; }

// ─── Main component ───────────────────────────────────────────────────────────
const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  const cvs   = useRef<HTMLCanvasElement>(null);
  const cache  = useRef<Map<number, OffscreenCanvas>>(new Map());
  const raf    = useRef(0);
  const ciRef  = useRef(currentIndex); ciRef.current = currentIndex;
  const lstRef = useRef(animals);      lstRef.current = animals;
  const cbRef  = useRef(onPageChange); cbRef.current  = onPageChange;
  const dpr    = useRef(typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1);

  const drag = useRef<DragSt>({ on:false, right:false, ox:0, oy:0, cx:0, cy:0 });
  const anim = useRef<AnimSt>({ on:false, done:false, right:false, t:0, from:0 });

  useEffect(() => { cache.current.clear(); }, [animals]);

  const page = useCallback((i: number): OffscreenCanvas | null => {
    const lst = lstRef.current;
    if (i < 0 || i >= lst.length) return null;
    if (!cache.current.has(i))
      cache.current.set(i, makePage(lst[i], i, lst.length, dpr.current));
    return cache.current.get(i)!;
  }, []);

  // ─── The curl draw ────────────────────────────────────────────────────────
  //
  //  Algorithm (classic page-peel — used in iBooks, Comixology, etc.)
  //  ─────────────────────────────────────────────────────────────────
  //  1. Decide the "drag tip": the fingertip / corner of the page being peeled.
  //  2. The fold line is the perpendicular bisector of (original corner → tip).
  //  3. Split the page polygon with the fold line → "still" half + "flap" half.
  //  4. Draw the still half normally (clipped).
  //  5. Draw the flap: reflect the *source image* coordinates across the fold
  //     line so the front-of-page texture appears mirrored, then darken it.
  //  6. Draw a white crease highlight along the fold line.
  //
  const draw = useCallback(() => {
    const canvas = cvs.current; if (!canvas) return;
    const ctx    = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(dpr.current, dpr.current);

    const ci = ciRef.current;
    const d  = drag.current;
    const a  = anim.current;

    const isFlipping = d.on || a.on;
    const right      = d.on ? d.right : a.right;

    // Pages involved
    const frontIdx = a.on ? a.from : ci;
    const backIdx  = right ? frontIdx + 1 : frontIdx - 1;
    const frontPg  = page(frontIdx);
    const backPg   = page(clamp(backIdx, 0, lstRef.current.length - 1));

    // ── Static state: draw front page with subtle stack shadow ──────────────
    if (!isFlipping) {
      // Peek at next page behind as a stack
      const peekPg = page(clamp(ci + 1, 0, lstRef.current.length - 1));
      if (peekPg && ci < lstRef.current.length - 1) {
        ctx.save(); ctx.globalAlpha = 0.55;
        ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 4;
        ctx.drawImage(peekPg, 4, 4, PW, PH);
        ctx.restore();
      }
      if (frontPg) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 22; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7;
        ctx.drawImage(frontPg, 0, 0, PW, PH);
        ctx.restore();
      }
      ctx.restore(); return;
    }

    // ── Compute progress ────────────────────────────────────────────────────
    let prog: number;
    let tipY: number;
    if (d.on) {
      const moved = right ? d.ox - d.cx : d.cx - d.ox;
      prog = clamp(moved / PW, 0, 1);
      tipY = d.cy;
    } else {
      prog = a.t;
      tipY = PH / 2;
    }

    // ── Fold geometry ───────────────────────────────────────────────────────
    //  Original corner (the one being peeled)
    const ox = right ? PW : 0;
    const oy = tipY < PH / 2 ? 0 : PH;

    //  Current tip position: interpolates from the original corner toward the opposite side
    //  We add a natural arc: the tip lags slightly behind a straight drag (ease).
    const easeProg = prog * prog * (3 - 2 * prog); // smoothstep — feels physical
    const tipX     = right
      ? PW - easeProg * (PW + PW * 0.08) // overshoot slightly past spine
      : easeProg * (PW + PW * 0.08);

    const clampedTipY = clamp(tipY, 12, PH - 12);

    // Fold-line midpoint = midpoint between original corner and current tip
    const fmx = (ox + tipX) / 2;
    const fmy = (oy + clampedTipY) / 2;

    // Fold direction = perpendicular to (corner → tip)
    const dvx = tipX - ox, dvy = clampedTipY - oy;
    const dl  = Math.hypot(dvx, dvy) || 1;
    const fpx = -dvy / dl,  fpy = dvx / dl; // perpendicular unit vector

    // Fold line endpoints (far enough to cross entire page)
    const FAR  = PW * 3;
    const fA: Pt = { x: fmx - fpx * FAR, y: fmy - fpy * FAR };
    const fB: Pt = { x: fmx + fpx * FAR, y: fmy + fpy * FAR };

    // ── Which side of fold line is the flap? ────────────────────────────────
    //  cross product sign of fB-fA × corner-fA
    const cross = (fB.x-fA.x)*(oy-fA.y) - (fB.y-fA.y)*(ox-fA.x);
    const flapSign = Math.sign(cross);
    const onFlap = (p: Pt) =>
      Math.sign((fB.x-fA.x)*(p.y-fA.y) - (fB.y-fA.y)*(p.x-fA.x)) === flapSign;

    // ── Clip page shape ─────────────────────────────────────────────────────
    const pageCorners: Pt[] = [
      {x:0,y:0},{x:PW,y:0},{x:PW,y:PH},{x:0,y:PH}
    ];
    const pageSegs: [Pt,Pt][] = [
      [pageCorners[0],pageCorners[1]], [pageCorners[1],pageCorners[2]],
      [pageCorners[2],pageCorners[3]], [pageCorners[3],pageCorners[0]],
    ];

    // Find the two points where the fold line crosses the page rectangle
    const crossPts: Pt[] = [];
    for (const [s, e] of pageSegs) {
      // Use a very long segment along the fold line to approximate the infinite line
      const pt = segSeg({ x: fmx - fpx*3000, y: fmy - fpy*3000 },
                        { x: fmx + fpx*3000, y: fmy + fpy*3000 }, s, e);
      if (pt && !crossPts.some(q => dist(q, pt) < 1)) crossPts.push(pt);
    }

    // Build the "flap" polygon (corners on the flap side + the two crossing points)
    const flapPts: Pt[] = [];
    for (const c of pageCorners) if (onFlap(c)) flapPts.push(c);
    flapPts.push(...crossPts);
    // Sort by angle around centroid so the polygon is convex & correct
    if (flapPts.length >= 3) {
      const cx2 = flapPts.reduce((s,p) => s+p.x, 0) / flapPts.length;
      const cy2 = flapPts.reduce((s,p) => s+p.y, 0) / flapPts.length;
      flapPts.sort((a,b) => Math.atan2(a.y-cy2,a.x-cx2) - Math.atan2(b.y-cy2,b.x-cx2));
    }

    // Stay polygon = page corners NOT on flap side + crossing points
    const stayPts: Pt[] = [];
    for (const c of pageCorners) if (!onFlap(c)) stayPts.push(c);
    stayPts.push(...crossPts);
    if (stayPts.length >= 3) {
      const cx2 = stayPts.reduce((s,p) => s+p.x, 0) / stayPts.length;
      const cy2 = stayPts.reduce((s,p) => s+p.y, 0) / stayPts.length;
      stayPts.sort((a,b) => Math.atan2(a.y-cy2,a.x-cx2) - Math.atan2(b.y-cy2,b.x-cx2));
    }

    const tracePoly = (pts: Pt[]) => {
      if (pts.length < 2) return;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
    };

    // ── 1. Draw destination page (visible through the flap hole) ───────────
    if (backPg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 16; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
      ctx.drawImage(backPg, 0, 0, PW, PH);
      ctx.restore();
    }

    // ── 2. Draw "still" half (part of front page not yet lifted) ────────────
    if (frontPg && stayPts.length >= 3) {
      ctx.save();
      ctx.beginPath(); tracePoly(stayPts); ctx.clip();
      ctx.drawImage(frontPg, 0, 0, PW, PH);

      // Shadow near crease on the flat part (page bending away from viewer)
      if (crossPts.length === 2) {
        const sg = ctx.createLinearGradient(
          fmx + fpx * 30, fmy + fpy * 30,
          fmx - fpx * 30, fmy - fpy * 30
        );
        sg.addColorStop(0, 'rgba(0,0,0,0)');
        sg.addColorStop(0.6, 'rgba(0,0,0,0)');
        sg.addColorStop(1, 'rgba(0,0,0,0.22)');
        ctx.fillStyle = sg; ctx.fillRect(0, 0, PW, PH);
      }
      ctx.restore();
    }

    // ── 3. Draw flap (front page reflected, showing the back of paper) ──────
    if (frontPg && flapPts.length >= 3) {
      ctx.save();
      ctx.beginPath(); tracePoly(flapPts); ctx.clip();

      // Apply the reflection transform across the fold line
      // This maps source page coordinates so the image appears mirrored
      // Formula: reflection matrix across line through (fA, fB)
      const dx2 = fB.x - fA.x, dy2 = fB.y - fA.y;
      const l2  = dx2*dx2 + dy2*dy2;
      const cos2 =  (dx2*dx2 - dy2*dy2) / l2;
      const sin2 =  (2 * dx2 * dy2)      / l2;
      const tx   =  fA.x*(1 - cos2) - fA.y*sin2;
      const ty   =  fA.y*(1 + cos2) - fA.x*sin2;

      ctx.save();
      ctx.transform(cos2, sin2, sin2, -cos2, tx, ty);
      ctx.globalAlpha = 0.96;
      ctx.drawImage(frontPg, 0, 0, PW, PH);
      ctx.restore(); // ← removes the reflection transform before drawing gradients

      // Paper-back colour wash (the back of paper is warmer, slightly darker)
      ctx.fillStyle = 'rgba(238, 218, 178, 0.55)';
      ctx.fillRect(0, 0, PW, PH);

      // Curl shadow: dark near the crease, lighter toward the free edge
      if (crossPts.length === 2) {
        const curlShad = ctx.createLinearGradient(
          fmx - fpx * 8, fmy - fpy * 8,
          fmx - fpx * (right ? 160 : -160), fmy - fpy * 100
        );
        curlShad.addColorStop(0,   'rgba(0,0,0,0.42)');
        curlShad.addColorStop(0.25,'rgba(0,0,0,0.18)');
        curlShad.addColorStop(0.6, 'rgba(0,0,0,0.06)');
        curlShad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = curlShad; ctx.fillRect(0, 0, PW, PH);
      }

      ctx.restore();
    }

    // ── 4. Crease highlight (light catches the paper fold edge) ─────────────
    if (crossPts.length === 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.82)';
      ctx.lineWidth   = 2;
      ctx.shadowColor = 'rgba(255,235,160,0.7)';
      ctx.shadowBlur  = 5;
      ctx.beginPath();
      ctx.moveTo(crossPts[0].x, crossPts[0].y);
      ctx.lineTo(crossPts[1].x, crossPts[1].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // scale
  }, [page]);

  // ─── Tick ─────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const a  = anim.current;
    const SPEED = 0.06;
    if (a.on) {
      if (a.done) {
        a.t = Math.min(a.t + SPEED * 1.6, 1);
        if (a.t >= 1) {
          const next = clamp(a.right ? a.from + 1 : a.from - 1, 0, lstRef.current.length - 1);
          a.on = false;
          cbRef.current(next);
        }
      } else {
        // revert — snap back faster
        a.t = Math.max(a.t - SPEED * 3.2, 0);
        if (a.t <= 0) a.on = false;
      }
    }
    draw();
    raf.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [tick]);

  // ─── Pointer ───────────────────────────────────────────────────────────────
  const local = (canvas: HTMLCanvasElement, ex: number, ey: number): Pt => {
    const r = canvas.getBoundingClientRect();
    return { x: ((ex - r.left) / r.width) * PW, y: ((ey - r.top) / r.height) * PH };
  };

  const onDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const el = cvs.current; if (!el || anim.current.on) return;
    const p  = local(el, e.clientX, e.clientY);
    const right = p.x > PW / 2;
    const ci    = ciRef.current;
    if (right && ci >= lstRef.current.length - 1) return;
    if (!right && ci <= 0) return;
    drag.current = { on:true, right, ox:p.x, oy:p.y, cx:p.x, cy:p.y };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current.on) return;
    const el = cvs.current; if (!el) return;
    const p  = local(el, e.clientX, e.clientY);
    drag.current.cx = p.x; drag.current.cy = p.y;
  }, []);

  const onUp = useCallback(() => {
    const d = drag.current; if (!d.on) return;
    d.on = false;
    const moved = d.right ? d.ox - d.cx : d.cx - d.ox;
    const prog  = clamp(moved / PW, 0, 1);
    const done  = prog >= 0.38;
    anim.current = { on:true, done, right:d.right, t:prog, from:ciRef.current };
  }, []);

  const d = dpr.current;
  return (
    <canvas
      ref={cvs}
      width={PW * d} height={PH * d}
      style={{ width:PW, height:PH, display:'block', cursor:'grab', touchAction:'none', borderRadius:14 }}
      onPointerDown={onDown} onPointerMove={onMove}
      onPointerUp={onUp}     onPointerCancel={onUp}
      aria-label="Animal flipbook. Drag the right half forward or left half backward to turn pages."
    />
  );
};

export default FlipBook;
