(function () {
  "use strict";
  var NUM = "5548999189796";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var M = window.Motion || {};
  var animate = M.animate, scroll = M.scroll, inView = M.inView, spring = M.spring;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // CTAs de WhatsApp com mensagem pronta
  $$("[data-wa]").forEach(function (a) {
    a.href = "https://wa.me/" + NUM + "?text=" + encodeURIComponent(a.getAttribute("data-wa"));
    a.target = "_blank"; a.rel = "noopener";
  });

  // barra fixa some sobre o contato
  // (some também no hero, que já tem o botão, e na cena, onde cada serviço traz o seu)
  var sticky = $(".sticky-cta");
  if (sticky && "IntersectionObserver" in window) {
    var vis = {};
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      sticky.classList.toggle("off", !!(vis.inicio || vis.servicos || vis.contato));
    }, { threshold: 0.01, rootMargin: "-20% 0px -20% 0px" });
    ["inicio", "servicos", "contato"].forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  if (reduce || !animate) {
    // sem movimento: ativa o primeiro item e libera tudo
    $$(".svc").forEach(function (s) { s.classList.add("on"); });
    return;
  }

  // ---- entrada do hero (Motion: spring) ----
  var sp = spring ? { type: spring, stiffness: 120, damping: 20 } : { duration: 1 };
  $$(".ln__in").forEach(function (el, i) {
    el.style.transform = "translateY(105%)";
    animate(el, { transform: ["translateY(105%)", "translateY(0%)"] }, Object.assign({ delay: 0.15 + i * 0.12 }, spring ? { type: spring, stiffness: 90, damping: 18 } : { duration: 1 }));
  });
  [".hero .eyebrow", ".hero__lead", ".hero__cta", ".hero__meta"].forEach(function (s, i) {
    var el = $(s); if (!el) return;
    el.style.opacity = 0;
    animate(el, { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] }, { delay: 0.5 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] });
  });
  var heroMirror = $(".mirror--hero");
  if (heroMirror) {
    animate(heroMirror, { opacity: [0, 1], transform: ["translateY(40px) scale(.96)", "translateY(0px) scale(1)"] }, { duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] });
    // brilho do vidro acompanha a rolagem do topo
    scroll(function (p) { heroMirror.style.setProperty("--p", p.toFixed(3)); }, { target: $(".hero"), offset: ["start start", "end start"] });
  }

  // ---- revelações (inView) ----
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        animate(en.target, { opacity: [0, 1], transform: ["translateY(26px)", "translateY(0px)"] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
      });
    }, { threshold: 0.15 });
    $$(".reveal").forEach(function (e) { io.observe(e); });
  } else { $$(".reveal").forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; }); }

  // ---- cena: a passada ----
  var scene = $(".scene"), frames = $$(".frame"), items = $$(".idx li"), svcs = $$(".svc"), brush = $(".brush"), glintHost = $(".mirror--scene");
  var n = frames.length, cur = -1, target = 0, shown = 0, raf = 0;

  function setActive(i) {
    if (i === cur) return; cur = i;
    items.forEach(function (li, k) { li.classList.toggle("on", k === i); });
    svcs.forEach(function (s, k) {
      var on = k === i; s.classList.toggle("on", on);
      if (on) animate(s, { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    });
  }

  function paint(p) {
    var seg = p * (n - 1);
    frames.forEach(function (f, i) {
      if (i === 0) return;
      var t = smooth(clamp(seg - (i - 1), 0, 1));
      var x = t * 135 - 18; // posição da borda diagonal, em %
      f.style.clipPath = t <= 0 ? "polygon(0 0,0 0,0 100%,0 100%)" :
        "polygon(0 0," + x + "% 0," + (x - 18) + "% 100%,0 100%)";
      if (t > 0 && t < 1 && brush) {
        brush.style.opacity = 1;
        brush.style.left = (x - 9) + "%";
      }
    });
    var frac = seg - Math.floor(seg);
    if (brush && (frac < 0.02 || frac > 0.98 || seg <= 0 || seg >= n - 1)) brush.style.opacity = 0;
    setActive(clamp(Math.round(seg), 0, n - 1));
    if (glintHost) glintHost.style.setProperty("--p", p.toFixed(3));
  }

  function loop() {
    // mola leve: o desenho persegue a rolagem
    shown += (target - shown) * 0.14;
    if (Math.abs(target - shown) < 0.0004) shown = target;
    paint(shown);
    raf = shown === target ? 0 : requestAnimationFrame(loop);
  }

  if (scene && scroll) {
    scroll(function (p) { target = clamp(p, 0, 1); if (!raf) raf = requestAnimationFrame(loop); },
      { target: scene, offset: ["start start", "end end"] });
    paint(0);
  }

  // clique no índice leva ao ponto da cena
  items.forEach(function (li, k) {
    li.style.cursor = "pointer"; li.tabIndex = 0;
    var go = function () {
      var top = scene.offsetTop, h = scene.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + h * (k / (n - 1)) + 2, behavior: "smooth" });
    };
    li.addEventListener("click", go);
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  // ---- botões: press e magnetic (ponteiro fino) ----
  $$(".btn, .sticky-cta").forEach(function (b) {
    b.addEventListener("pointerdown", function () { animate(b, { scale: 0.96 }, { duration: 0.12 }); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      b.addEventListener(ev, function () { animate(b, { scale: 1, x: 0, y: 0 }, spring ? { type: spring, stiffness: 300, damping: 18 } : { duration: 0.3 }); });
    });
    if (fine && b.classList.contains("btn--lg")) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18, dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        animate(b, { x: dx, y: dy }, { duration: 0.2 });
      });
    }
  });
})();
