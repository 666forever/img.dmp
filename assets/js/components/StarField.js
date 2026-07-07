// ── js/components/StarField.js ───────────────────────────────────────
// Subtle rotating star field background, canvas-based.
// Runs throttled to ~20fps — human eye can't tell at this opacity.
// Pauses when tab is hidden.

let canvas = null;
let ctx = null;
let animId = null;
let stars = [];
let rotation = 0;
let lastFrameTime = 0;

// Target ~20fps — plenty for a barely-visible ambient effect
const TARGET_FPS = 20;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const CONFIG = {
    count: 80,           // reduced from 120 — imperceptible difference
    minSize: 0.4,
    maxSize: 1.1,
    minOpacity: 0.12,
    maxOpacity: 0.38,
    rotationSpeed: 0.00004,
};

function createStars(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    stars = [];
    for (let i = 0; i < CONFIG.count; i++) {
        const opacity = CONFIG.minOpacity + Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity);
        stars.push({
            x: Math.random() * w - cx,
            y: Math.random() * h - cy,
            size: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
            // Pre-build the fillStyle string — never rebuild it per frame
            fillStyle: `rgba(255,255,255,${opacity.toFixed(2)})`,
        });
    }
}

function draw(time) {
    if (!ctx || !canvas) return;

    // Throttle: skip frames that arrive too soon
    const elapsed = time - lastFrameTime;
    if (elapsed < FRAME_INTERVAL) {
        animId = requestAnimationFrame(draw);
        return;
    }
    lastFrameTime = time - (elapsed % FRAME_INTERVAL);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    rotation += CONFIG.rotationSpeed;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    for (const star of stars) {
        const rx = star.x * cos - star.y * sin;
        const ry = star.x * sin + star.y * cos;
        const sx = cx + rx;
        const sy = cy + ry;

        if (sx < -5 || sx > w + 5 || sy < -5 || sy > h + 5) continue;

        ctx.fillStyle = star.fillStyle; // pre-computed, no string alloc
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    animId = requestAnimationFrame(draw);
}

let resizeTimer = null;
function resize() {
    // Debounce resize — recreating stars is expensive
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        createStars(w, h);
    }, 200);
}

function onVisibility() {
    if (document.hidden) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
    } else {
        if (!animId && canvas) animId = requestAnimationFrame(draw);
    }
}

export function initStarField() {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.id = 'star-field';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 0;
    `;
    document.body.prepend(canvas);

    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    resize();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    animId = requestAnimationFrame(draw);
}

export function destroyStarField() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    stars = [];
    rotation = 0;
}
