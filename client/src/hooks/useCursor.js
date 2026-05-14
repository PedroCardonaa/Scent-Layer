import { useEffect } from 'react';

export function useCursor() {
  useEffect(() => {
    const cur = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!cur || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const onOver = (e) => {
      const t = e.target;
      if (t && t.matches && t.matches('a,button,.product-card,.tool-card,.chip,.finder-card,.size-pill,.list-tab,.ext-tab,.tool-tab,.filter-pill,.quiz-option,.sug-item,input,select,textarea')) {
        ring.style.transform = 'translate(-50%,-50%) scale(1.7)';
        ring.style.opacity = '0.35';
      } else {
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.opacity = '0.6';
      }
    };
    const tick = () => {
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    raf = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);
}
