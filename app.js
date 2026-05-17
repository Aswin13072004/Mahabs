document.addEventListener('DOMContentLoaded', () => {

    // ── DOM refs ──────────────────────────────────────────────────
    const loginOverlay      = document.getElementById('login-overlay');
    const pinInput          = document.getElementById('pin-input');
    const loginBtn          = document.getElementById('login-btn');
    const loginError        = document.getElementById('login-error');
    const mainContent       = document.getElementById('main-content');
    const galleryGrid       = document.getElementById('gallery-grid');
    const loadMoreTrigger   = document.getElementById('load-more-trigger');
    const lightbox          = document.getElementById('lightbox');
    const lbMedia           = document.getElementById('lb-media');
    const lbClose           = document.getElementById('lb-close');
    const lbPrev            = document.getElementById('lb-prev');
    const lbNext            = document.getElementById('lb-next');
    const lbDownload        = document.getElementById('lb-download');

    // ── State ─────────────────────────────────────────────────────
    const PIN        = '8881';
    const CHUNK      = 20;
    let allMedia     = [];
    let loaded       = 0;
    let lbIndex      = -1;
    const cache      = new Map();   // id → ObjectURL

    // ── Login ─────────────────────────────────────────────────────
    function hideOverlay() {
        loginOverlay.style.opacity        = '0';
        loginOverlay.style.pointerEvents  = 'none';
        setTimeout(() => {
            loginOverlay.style.display    = 'none';
            loginOverlay.style.visibility = 'hidden';
            mainContent.style.display     = 'block';
            document.body.style.overflow  = 'auto';
            init();
        }, 600);
    }

    function tryLogin() {
        if (pinInput.value === PIN) {
            localStorage.setItem('gal_auth', '1');
            hideOverlay();
        } else {
            loginError.style.display = 'block';
            pinInput.value = '';
            pinInput.focus();
        }
    }

    if (localStorage.getItem('gal_auth') === '1') {
        loginOverlay.style.display    = 'none';
        loginOverlay.style.visibility = 'hidden';
        loginOverlay.style.pointerEvents = 'none';
        mainContent.style.display     = 'block';
        document.body.style.overflow  = 'auto';
        init();
    }

    loginBtn.addEventListener('click', tryLogin);
    pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

    // ── Init ──────────────────────────────────────────────────────
    async function init() {
        try {
            const r = await fetch('photos.json');
            allMedia = await r.json();
        } catch { allMedia = []; }

        // Intersection observer for infinite scroll
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) addChunk();
        }, { rootMargin: '600px' });
        obs.observe(loadMoreTrigger);

        addChunk();
    }

    // ── Naming ────────────────────────────────────────────────────
    function name(item) {
        return `Mahabs_20260517_${allMedia.indexOf(item) + 1}${item.ext}`;
    }

    // ── Fetch + cache a blob URL ───────────────────────────────────
    async function getUrl(item) {
        if (cache.has(item.id)) return cache.get(item.id);
        const res  = await fetch(`photos/${item.id}`);
        const blob = await res.blob();
        const mime = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png',  '.webp': 'image/webp',
            '.mp4': 'video/mp4',  '.webm': 'video/webm',
            '.mov': 'video/quicktime'
        }[item.ext] || 'application/octet-stream';
        const url = URL.createObjectURL(new Blob([blob], { type: mime }));
        cache.set(item.id, url);
        return url;
    }

    // ── Render a chunk ────────────────────────────────────────────
    function addChunk() {
        if (loaded >= allMedia.length) return;
        const end = Math.min(loaded + CHUNK, allMedia.length);
        for (let i = loaded; i < end; i++) buildCard(allMedia[i], i);
        loaded = end;
    }

    // ── Build card ────────────────────────────────────────────────
    function buildCard(item, idx) {
        /*
          Structure (all siblings inside .card, position:relative):
            .card
              img or video   ← fills card
              .overlay       ← transparent layer on top
              .ic-expand     ← expand icon (centre)
              .ic-download   ← download icon (top-right)
        */
        const card = document.createElement('div');
        card.className = 'card';

        // Placeholder while loading
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        card.appendChild(placeholder);

        // Overlay (captures hover, lets events bubble)
        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        card.appendChild(overlay);

        // Expand icon
        const expand = document.createElement('div');
        expand.className = 'ic-expand';
        expand.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>`;
        card.appendChild(expand);

        // Download icon
        const dl = document.createElement('div');
        dl.className = 'ic-download';
        dl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>`;
        card.appendChild(dl);

        // Events
        overlay.addEventListener('click', () => openLb(idx));
        expand.addEventListener('click',  () => openLb(idx));
        dl.addEventListener('click', (e) => {
            e.stopPropagation();
            download(item);
        });

        galleryGrid.appendChild(card);

        // Load media async
        getUrl(item).then(url => {
            let el;
            if (item.type === 'video') {
                el = document.createElement('video');
                el.autoplay = true; el.loop = true; el.muted = true; el.playsInline = true;
            } else {
                el = document.createElement('img');
                el.loading = 'lazy';
                el.alt = name(item);
            }
            el.src = url;
            el.className = 'card-media';
            card.insertBefore(el, placeholder);
            placeholder.remove();
        }).catch(() => { placeholder.remove(); });
    }

    // ── Lightbox open/close ───────────────────────────────────────
    function openLb(idx) {
        lbIndex = idx;
        showLb();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLb() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
        lbMedia.innerHTML = '';
    }

    async function showLb() {
        if (lbIndex < 0 || lbIndex >= allMedia.length) return;
        const item = allMedia[lbIndex];
        lbMedia.innerHTML = '<div class="lb-spinner"></div>';
        const url = await getUrl(item);
        lbMedia.innerHTML = '';
        let el;
        if (item.type === 'video') {
            el = document.createElement('video');
            el.controls = true; el.autoplay = true;
        } else {
            el = document.createElement('img');
            el.alt = name(item);
        }
        el.src = url;
        el.className = 'lb-media-el';
        lbMedia.appendChild(el);
    }

    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; showLb(); } });
    lbNext.addEventListener('click', () => { if (lbIndex < allMedia.length - 1) { lbIndex++; showLb(); } });
    lbDownload.addEventListener('click', () => { if (lbIndex >= 0) download(allMedia[lbIndex]); });

    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLb(); });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape')      closeLb();
        if (e.key === 'ArrowLeft')  { if (lbIndex > 0) { lbIndex--; showLb(); } }
        if (e.key === 'ArrowRight') { if (lbIndex < allMedia.length - 1) { lbIndex++; showLb(); } }
    });

    // Touch swipe
    let tx = 0;
    lightbox.addEventListener('touchstart', e => tx = e.changedTouches[0].screenX, { passive: true });
    lightbox.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].screenX - tx;
        if (dx < -50 && lbIndex < allMedia.length - 1) { lbIndex++; showLb(); }
        if (dx >  50 && lbIndex > 0)                   { lbIndex--; showLb(); }
    });

    // ── Single download ───────────────────────────────────────────
    async function download(item) {
        const url = await getUrl(item);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = name(item);
        a.click();
    }

});
