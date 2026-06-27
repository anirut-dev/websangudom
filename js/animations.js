// ===== Animation Engine =====

// ---- 1. Scroll Reveal ----
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("revealed");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

function initReveal() {
  document.querySelectorAll(
    ".product-card, .badge, .branch-info-card, .branch-map, .contact-card, .section-header, .content-section h2, .content-section p"
  ).forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
    revealObserver.observe(el);
  });
}

// ---- 2. Hero text reveal sequence ----
function initHeroSequence() {
  const items = document.querySelectorAll(".hero-text .hero-label, .hero-text h1, .hero-text p, .hero-text .btn, .hero-badges .badge");
  items.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition = "opacity .7s ease, transform .7s ease";
    el.style.transitionDelay = `${i * 140 + 200}ms`;
    setTimeout(() => {
      el.style.opacity = "";
      el.style.transform = "";
    }, 50);
  });
}

// ---- 3. Particle canvas ----
function initParticles() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  hero.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const GOLD = "rgba(200,162,74,";
  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -(Math.random() * 0.35 + 0.08),
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.005,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = GOLD + Math.max(0, Math.min(1, p.a)) + ")";
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      p.a += p.da;
      if (p.a <= 0 || p.a >= 1) p.da *= -1;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ---- 4. Ripple on buttons ----
function initRipple() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-primary, .cat-btn, .branch-tab");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background:rgba(200,162,74,.25);
      transform:scale(0); animation:ripple .55s ease-out forwards;
    `;
    if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// ---- 5. Gold cursor trail ----
function initCursorTrail() {
  const dots = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const d = document.createElement("div");
    d.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999; border-radius:50%;
      width:${6 - i * 0.5}px; height:${6 - i * 0.5}px;
      background:rgba(200,162,74,${0.55 - i * 0.06});
      transform:translate(-50%,-50%);
      transition:left ${i * 30 + 30}ms ease, top ${i * 30 + 30}ms ease;
      mix-blend-mode:screen;
    `;
    document.body.appendChild(d);
    dots.push(d);
  }
  let mx = 0, my = 0;
  document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
  function update() {
    dots.forEach(d => { d.style.left = mx + "px"; d.style.top = my + "px"; });
    requestAnimationFrame(update);
  }
  update();
}

// ---- 6. Magnetic hover on nav links ----
function initMagneticNav() {
  document.querySelectorAll(".main-nav a").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.25;
      const y = (e.clientY - r.top  - r.height / 2) * 0.25;
      el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform .4s ease";
      el.style.transform = "";
      setTimeout(() => el.style.transition = "", 400);
    });
  });
}

// ---- 7. Number counter for stats (ถ้ามี) ----
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 30);
}
document.querySelectorAll("[data-count]").forEach(el => {
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) animateCount(el);
  }).observe(el);
});

// ---- 8. Logo shimmer on hover ----
function initLogoShimmer() {
  const logo = document.querySelector(".logo-emblem");
  if (!logo) return;
  setInterval(() => {
    logo.classList.add("shimmer-pulse");
    setTimeout(() => logo.classList.remove("shimmer-pulse"), 1000);
  }, 3000);
}

// ---- Init all ----
// รันทันทีโดยไม่รอ DOMContentLoaded เพราะ script อยู่ท้าย body แล้ว
initParticles();
initHeroSequence();
initRipple();
initCursorTrail();
initMagneticNav();
initLogoShimmer();

// Reveal ต้องรอการ์ดสินค้า (โหลดจาก Firebase) ใช้ MutationObserver
const productGrid = document.getElementById("productGrid");
if (productGrid) {
  const mo = new MutationObserver(() => {
    initReveal();
  });
  mo.observe(productGrid, { childList: true });
}
// reveal elements ที่มีอยู่แล้วตั้งแต่แรก
initReveal();
