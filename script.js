gsap.registerPlugin(ScrollTrigger);

const q = (s, root = document) => root.querySelector(s);
const qa = (s, root = document) => [...root.querySelectorAll(s)];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

/* ----------------------------------------------------------
   Smooth scroll (Lenis) driven by the GSAP ticker
---------------------------------------------------------- */
let lenis = null;
if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
}

qa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return e.preventDefault();
        const target = q(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.6 });
        else target.scrollIntoView();
    });
});

/* ----------------------------------------------------------
   Text splitting helpers
---------------------------------------------------------- */
function splitWords(el, masked = true) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    return words.map((word, i) => {
        const inner = document.createElement("span");
        inner.textContent = word;
        if (masked) {
            const outer = document.createElement("span");
            outer.className = "w";
            inner.className = "wi";
            outer.appendChild(inner);
            el.appendChild(outer);
        } else {
            inner.className = "sw";
            el.appendChild(inner);
        }
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
        return inner;
    });
}

const introWords = splitWords(q(".hero-intro"));
const aboutWords = splitWords(q("[data-scrub-words]"), false);

/* ----------------------------------------------------------
   Preloader → hero intro
---------------------------------------------------------- */
function heroIntro() {
    const tl = gsap.timeline();
    tl.from(".hero-title .line > span", { yPercent: 115, duration: 1.5, stagger: 0.1, ease: "expo.out" })
      .from(introWords, { yPercent: 115, duration: 1.2, stagger: 0.012, ease: "expo.out" }, 0.1)
      .from(".nav > *", { yPercent: -150, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out" }, 0.2)
      .from(".fade-in", { y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out" }, 0.45)
      .from(".video-wrap", { yPercent: 25, opacity: 0, duration: 1.5, ease: "expo.out" }, 0.25)
      .from(".blob", { opacity: 0, duration: 2, stagger: 0.15, ease: "power2.out" }, 0.3);
    return tl;
}

function finishLoading() {
    document.body.classList.remove("is-loading");
    q(".loader").style.display = "none";
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
}

(function runLoader() {
    const words = qa(".loader-words h1");
    const countEl = q(".loader .count");
    const counter = { v: 0 };
    gsap.set(words, { y: 0, yPercent: 110 });

    if (reduceMotion) {
        gsap.timeline()
            .to(".loader", { opacity: 0, duration: 0.4, delay: 0.2 })
            .add(heroIntro().progress(1))
            .add(finishLoading);
        return;
    }

    const tl = gsap.timeline();
    tl.to(counter, {
        v: 100,
        duration: 3,
        ease: "power3.inOut",
        onUpdate: () => (countEl.textContent = Math.round(counter.v)),
    }, 0);

    words.forEach((w, i) => {
        const at = 0.15 + i * 0.95;
        tl.to(w, { yPercent: 0, duration: 0.7, ease: "expo.out" }, at)
          .to(w, { yPercent: -110, duration: 0.55, ease: "expo.in" }, at + 0.75);
    });

    tl.to(".loader-count, .loader-meta", { opacity: 0, duration: 0.4 }, "-=0.2")
      .to(".loader", { clipPath: "ellipse(150% 0% at 50% 0%)", duration: 1.3, ease: "expo.inOut" })
      .add(heroIntro(), "-=0.65")
      .add(finishLoading, "-=1.2");
})();

/* ----------------------------------------------------------
   Custom cursor
---------------------------------------------------------- */
const cursor = q(".cursor");
const cursorLabel = q(".cursor-label");

if (canHover) {
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
        cx(e.clientX);
        cy(e.clientY);
        cursor.classList.add("is-visible");
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));

    document.addEventListener("mouseover", (e) => {
        const labelled = e.target.closest("[data-cursor]");
        const link = e.target.closest("a, button, .svc");
        cursor.classList.toggle("is-label", !!labelled);
        cursor.classList.toggle("is-hover", !labelled && !!link);
        if (labelled) cursorLabel.textContent = labelled.dataset.cursor;
    });
}

/* ----------------------------------------------------------
   Magnetic elements
---------------------------------------------------------- */
if (canHover) {
    qa(".magnetic").forEach((el) => {
        const strength = parseFloat(el.dataset.strength || 0.3);
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
        el.addEventListener("mousemove", (e) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - r.left - r.width / 2) * strength);
            yTo((e.clientY - r.top - r.height / 2) * strength);
        });
        el.addEventListener("mouseleave", () => {
            gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)", overwrite: true });
        });
    });
}

/* ----------------------------------------------------------
   Nav: hide on scroll down, show on scroll up
---------------------------------------------------------- */
const navTween = gsap.to(".nav", { yPercent: -120, duration: 0.5, ease: "power3.inOut", paused: true });
ScrollTrigger.create({
    start: 200,
    end: "max",
    onUpdate: (self) => (self.direction === 1 ? navTween.play() : navTween.reverse()),
    onLeaveBack: () => navTween.reverse(),
});

/* ----------------------------------------------------------
   Hero scroll: video expands to full-bleed, title drifts
---------------------------------------------------------- */
gsap.fromTo(".video-wrap", { clipPath: "inset(0% 6% 0% 6% round 2vw)" }, {
    clipPath: "inset(0% 0% 0% 0% round 0vw)",
    ease: "none",
    scrollTrigger: { trigger: ".video-wrap", start: "top 85%", end: "top 5%", scrub: true },
});
gsap.to(".video-wrap video", {
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: ".video-wrap", start: "top bottom", end: "bottom top", scrub: true },
});
gsap.to(".hero-title", {
    yPercent: -25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "40% top", scrub: true },
});

const videoWrap = q(".video-wrap");
const video = q(".video-wrap video");
videoWrap.dataset.cursor = "Sound on";
videoWrap.addEventListener("click", () => {
    video.muted = !video.muted;
    videoWrap.dataset.cursor = video.muted ? "Sound on" : "Mute";
    cursorLabel.textContent = videoWrap.dataset.cursor;
});

/* ----------------------------------------------------------
   Marquee: direction + speed follow the scroll
---------------------------------------------------------- */
(function marquee() {
    const track = q(".marquee-track");
    const skewTo = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3" });
    let x = 0;
    let dir = -1;
    let boost = 0;

    ScrollTrigger.create({
        onUpdate: (self) => {
            dir = self.direction === 1 ? -1 : 1;
            const v = self.getVelocity();
            boost = Math.min(Math.abs(v) / 900, 1.2);
            skewTo(gsap.utils.clamp(-12, 12, v / -250));
        },
    });

    gsap.ticker.add(() => {
        x += dir * (0.035 + boost);
        boost *= 0.92;
        if (x <= -50) x += 50;
        if (x > 0) x -= 50;
        gsap.set(track, { xPercent: x });
        if (boost < 0.01) skewTo(0);
    });
})();

/* ----------------------------------------------------------
   About: word-by-word scrubbed reveal
---------------------------------------------------------- */
gsap.fromTo(aboutWords, { opacity: 0.12 }, {
    opacity: 1,
    stagger: 0.1,
    ease: "none",
    scrollTrigger: { trigger: "[data-scrub-words]", start: "top 80%", end: "bottom 45%", scrub: true },
});

qa("[data-reveal]").forEach((el) => {
    gsap.from(el, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
    });
});

qa("[data-parallax]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -12 }, {
        yPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
});

/* Masked line reveals for section headings */
qa(".big-head, .cta-title").forEach((h) => {
    gsap.from(h.querySelectorAll(".line > span"), {
        yPercent: 115,
        duration: 1.3,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { trigger: h, start: "top 85%" },
    });
});

/* ----------------------------------------------------------
   Work list: direction-aware fill + cursor-following preview
---------------------------------------------------------- */
(function workList() {
    const items = qa(".work-item");
    const list = q(".work-list");
    const preview = q(".hover-img");
    const strip = q(".hover-img-strip");

    gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.06,
        ease: "expo.out",
        scrollTrigger: { trigger: list, start: "top 85%" },
    });

    items.forEach((item) => {
        const img = document.createElement("img");
        img.src = item.dataset.image;
        img.alt = "";
        strip.appendChild(img);
    });

    const enterSide = (item, e) => {
        const r = item.getBoundingClientRect();
        return e.clientY - r.top < r.height / 2 ? -101 : 101;
    };

    gsap.set(qa(".overlay", list), { y: 0, yPercent: -101 });

    items.forEach((item, i) => {
        const overlay = q(".overlay", item);
        item.addEventListener("click", (e) => e.preventDefault());
        item.addEventListener("mouseenter", (e) => {
            item.classList.add("is-active");
            gsap.fromTo(overlay, { yPercent: enterSide(item, e) }, { yPercent: 0, duration: 0.55, ease: "power3.out", overwrite: true });
            gsap.to(strip, { yPercent: (-100 / items.length) * i, duration: 0.8, ease: "expo.out", overwrite: true });
        });
        item.addEventListener("mouseleave", (e) => {
            item.classList.remove("is-active");
            gsap.to(overlay, { yPercent: enterSide(item, e), duration: 0.55, ease: "power3.out", overwrite: true });
        });
    });

    if (!canHover) return;

    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
    const px = gsap.quickTo(preview, "x", { duration: 0.8, ease: "power3" });
    const py = gsap.quickTo(preview, "y", { duration: 0.8, ease: "power3" });
    const pr = gsap.quickTo(preview, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    let tilt = 0;

    window.addEventListener("mousemove", (e) => {
        px(e.clientX);
        py(e.clientY);
        tilt = gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8);
        lastX = e.clientX;
    });
    gsap.ticker.add(() => {
        tilt *= 0.9;
        pr(tilt);
    });

    list.addEventListener("mouseenter", () =>
        gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out", overwrite: "auto" }));
    list.addEventListener("mouseleave", () =>
        gsap.to(preview, { scale: 0, autoAlpha: 0, duration: 0.5, ease: "expo.inOut", overwrite: "auto" }));
})();

/* ----------------------------------------------------------
   Services: clip-path image swap
---------------------------------------------------------- */
(function services() {
    const svcs = qa(".svc");
    const imgs = qa(".svc-img");
    let current = 0;
    let z = 1;

    const activate = (i) => {
        if (i === current) return;
        svcs[current].classList.remove("is-active");
        svcs[i].classList.add("is-active");
        const next = imgs[i];
        next.style.zIndex = ++z;
        gsap.fromTo(next,
            { clipPath: "inset(100% 0% 0% 0%)", scale: 1.25 },
            { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.1, ease: "expo.out", overwrite: true });
        current = i;
    };

    svcs.forEach((s, i) => {
        s.addEventListener("mouseenter", () => activate(i));
        s.addEventListener("click", () => activate(i));
    });

    gsap.fromTo(".services-panel", { clipPath: "inset(8% 6% 8% 6% round 40px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)",
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".services", start: "top 75%" },
    });
})();

/* ----------------------------------------------------------
   Horizontal gallery (desktop only)
---------------------------------------------------------- */
const mm = gsap.matchMedia();
mm.add("(min-width: 901px)", () => {
    const track = q(".gallery-track");
    const bar = q(".gallery-progress span");
    const distance = () => track.scrollWidth - window.innerWidth;

    const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
            trigger: ".gallery",
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
        },
    });

    qa(".g-img img").forEach((img) => {
        gsap.fromTo(img, { xPercent: -8 }, {
            xPercent: 8,
            ease: "none",
            scrollTrigger: {
                trigger: img.parentElement,
                containerAnimation: scrollTween,
                start: "left right",
                end: "right left",
                scrub: true,
            },
        });
    });
});

/* ----------------------------------------------------------
   Footer reveal from behind the page
---------------------------------------------------------- */
gsap.fromTo(".footer-inner", { yPercent: -35 }, {
    yPercent: 0,
    ease: "none",
    scrollTrigger: { trigger: ".footer-spacer", start: "top bottom", end: "bottom bottom", scrub: true },
});
gsap.fromTo(".footer-big span", { yPercent: 100 }, {
    yPercent: 0,
    stagger: 0.06,
    ease: "none",
    scrollTrigger: { trigger: ".footer-spacer", start: "top 55%", end: "bottom bottom", scrub: true },
});

const timeEl = q(".local-time");
const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
});
const tick = () => (timeEl.textContent = fmt.format(new Date()) + " CST");
tick();
setInterval(tick, 1000);

window.addEventListener("load", () => ScrollTrigger.refresh());
