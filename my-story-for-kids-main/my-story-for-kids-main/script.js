document.addEventListener('DOMContentLoaded', () => {
    /* ============================================
       Background removal (black / checkerboard PNG)
       ============================================ */
    const removeImageBackground = async (imgEl) => {
        if (!imgEl) return;

        if (!imgEl.complete || imgEl.naturalWidth === 0) {
            await new Promise((resolve, reject) => {
                imgEl.addEventListener('load', resolve, { once: true });
                imgEl.addEventListener('error', reject, { once: true });
            });
        }

        const w = imgEl.naturalWidth;
        const h = imgEl.naturalHeight;
        if (!w || !h) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(imgEl, 0, 0);

        const imageData = ctx.getImageData(0, 0, w, h);
        const { data } = imageData;

        const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

        const edgeStep = Math.max(2, Math.floor(Math.min(w, h) / 180));
        let edgeLumSum = 0;
        let edgeCount = 0;

        const sampleEdge = (x, y) => {
            const i = (y * w + x) * 4;
            if (data[i + 3] < 240) return;
            edgeLumSum += lum(data[i], data[i + 1], data[i + 2]);
            edgeCount++;
        };

        for (let x = 0; x < w; x += edgeStep) {
            sampleEdge(x, 1);
            sampleEdge(x, h - 2);
        }
        for (let y = 0; y < h; y += edgeStep) {
            sampleEdge(1, y);
            sampleEdge(w - 2, y);
        }

        const avgEdgeLum = edgeCount ? edgeLumSum / edgeCount : 255;
        const isDarkBackground = avgEdgeLum < 90;

        const step = Math.max(2, Math.floor(Math.min(w, h) / 220));
        const gw = Math.ceil(w / step);
        const gh = Math.ceil(h / step);
        const isBg = new Uint8Array(gw * gh);
        const visited = new Uint8Array(gw * gh);

        const markBgCell = (gx, gy) => {
            const x = Math.min(w - 1, gx * step);
            const y = Math.min(h - 1, gy * step);
            const i = (y * w + x) * 4;
            if (data[i + 3] < 240) return;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const L = lum(r, g, b);

            if (isDarkBackground) {
                if (L <= 70) isBg[gy * gw + gx] = 1;
            } else {
                const dr = r - 255;
                const dg = g - 255;
                const db = b - 255;
                const dLight = Math.sqrt(dr * dr + dg * dg + db * db);
                const dr2 = r - 232;
                const dg2 = g - 232;
                const db2 = b - 232;
                const dGray = Math.sqrt(dr2 * dr2 + dg2 * dg2 + db2 * db2);
                if (Math.min(dLight, dGray) <= 48) isBg[gy * gw + gx] = 1;
            }
        };

        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) markBgCell(gx, gy);
        }

        const qx = [];
        const qy = [];
        const push = (gx, gy) => {
            const idx = gy * gw + gx;
            if (visited[idx] || !isBg[idx]) return;
            visited[idx] = 1;
            qx.push(gx);
            qy.push(gy);
        };

        for (let gx = 0; gx < gw; gx++) {
            push(gx, 0);
            push(gx, gh - 1);
        }
        for (let gy = 0; gy < gh; gy++) {
            push(0, gy);
            push(gw - 1, gy);
        }

        while (qx.length) {
            const gx = qx.pop();
            const gy = qy.pop();
            if (gx > 0) push(gx - 1, gy);
            if (gx + 1 < gw) push(gx + 1, gy);
            if (gy > 0) push(gx, gy - 1);
            if (gy + 1 < gh) push(gx, gy + 1);
        }

        for (let y = 0; y < h; y++) {
            const gy = Math.min(gh - 1, Math.floor(y / step));
            for (let x = 0; x < w; x++) {
                const gx = Math.min(gw - 1, Math.floor(x / step));
                if (!visited[gy * gw + gx]) continue;

                const i = (y * w + x) * 4;
                if (data[i + 3] < 240) continue;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const L = lum(r, g, b);

                if (isDarkBackground) {
                    if (L <= 85) {
                        const alpha = L <= 45 ? 0 : Math.round(((L - 45) / 40) * 255);
                        data[i + 3] = Math.min(data[i + 3], alpha);
                    }
                } else {
                    const dr = r - 255;
                    const dg = g - 255;
                    const db = b - 255;
                    const dLight = Math.sqrt(dr * dr + dg * dg + db * db);
                    const dr2 = r - 232;
                    const dg2 = g - 232;
                    const db2 = b - 232;
                    const dGray = Math.sqrt(dr2 * dr2 + dg2 * dg2 + db2 * db2);
                    if (Math.min(dLight, dGray) <= 58) data[i + 3] = 0;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        imgEl.src = canvas.toDataURL('image/png');
        imgEl.classList.add('is-ready');
    };

    const readingKidsEl = document.getElementById('readingKids');
    if (readingKidsEl) readingKidsEl.classList.add('is-ready');
    removeImageBackground(readingKidsEl).catch(() => {});

    /* ============================================
       Mobile Menu Toggle
       ============================================ */
    const menuToggle = document.getElementById('menuToggle');
    const navClose = document.getElementById('navClose');
    const nav = document.getElementById('nav');

    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    const openMenu = () => {
        nav.classList.add('active');
        overlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', openMenu);
    navClose.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeMenu();
        });
    });

    /* ============================================
       Active Nav Link on Scroll
       ============================================ */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-list a');

    const setActiveLink = () => {
        const scrollPos = window.scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < bottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', setActiveLink);

    /* ============================================
       Smooth Scroll for Anchors
       ============================================ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    /* ============================================
       Cart Counter
       ============================================ */
    let cartCount = 0;
    const cartCountEl = document.querySelector('.cart-count');

    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            cartCount++;
            cartCountEl.textContent = cartCount;
            cartCountEl.style.transform = 'scale(1.4)';
            setTimeout(() => {
                cartCountEl.style.transform = 'scale(1)';
            }, 200);
        });
    });

    /* ============================================
       Header Shadow on Scroll
       ============================================ */
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    /* ============================================
       Reveal on Scroll
       ============================================ */
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        },
        { threshold: 0.15 }
    );

    document.querySelectorAll('.book-card, .testimonial-card, .feature, .about-content > *, .about-image').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    /* ============================================
       Cart count transition
       ============================================ */
    cartCountEl.style.transition = 'transform 0.2s ease';
});
