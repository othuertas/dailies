/* ============================================================
   THE DAILIES — MAIN APPLICATION
   Vanilla JS · CSV data source · localStorage persistence
   ============================================================ */
(async function () {
    'use strict';

    /* ----------------------------------------------------------
       DOM References
       ---------------------------------------------------------- */
    const gameGrid = document.getElementById('game-grid');
    const tabBar = document.getElementById('tab-bar');
    const counterText = document.getElementById('counter-text');
    const counterEl = document.getElementById('counter');
    const themeToggle = document.getElementById('theme-toggle');
    const wordmark = document.getElementById('wordmark');

    /* ----------------------------------------------------------
       State
       ---------------------------------------------------------- */
    let games = [];
    let playedGames = {};
    let favoriteGames = {};
    let gameOrder = [];   // custom sort: array of game IDs
    let activeFilter = 'all';
    let easterEggShown = false;

    const KEYS = {
        PLAYED: 'dailies_played',
        FAVORITES: 'dailies_favorites',
        ORDER: 'dailies_order',
        THEME: 'dailies_theme',
    };

    /* ==========================================================
       CSV PARSER
       Handles quoted fields, commas/semicolons, and CRLF line endings
       ========================================================== */
    function detectDelimiter(headerLine) {
        let inQ = false, commas = 0, semis = 0;
        for (let i = 0; i < headerLine.length; i++) {
            const ch = headerLine[i];
            if (ch === '"') inQ = !inQ;
            else if (!inQ) {
                if (ch === ',') commas++;
                else if (ch === ';') semis++;
            }
        }
        return semis > commas ? ';' : ',';
    }

    function parseCSV(text) {
        const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = cleaned.trim().split('\n');
        if (lines.length < 2) return [];
        const delim = detectDelimiter(lines[0]);
        const headers = splitCSVLine(lines[0], delim);
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const vals = splitCSVLine(line, delim);
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h.trim().toLowerCase()] = (vals[idx] || '').trim();
            });
            if (obj.name) rows.push(obj);
        }
        return rows;
    }

    function splitCSVLine(line, delim = ',') {
        const result = [];
        let cur = '';
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQ) {
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') { inQ = false; }
                else { cur += ch; }
            } else {
                if (ch === '"') { inQ = true; }
                else if (ch === delim) { result.push(cur); cur = ''; }
                else { cur += ch; }
            }
        }
        result.push(cur);
        return result;
    }

    /* ==========================================================
       TAG UTILS
       Languages defined in references/notes_and_features.md:
       Català, Español, English
       ========================================================== */
    const KNOWN_LANGUAGES = new Set([
        'català', 'catala',
        'español', 'espanol',
        'english'
    ]);

    function isLanguageTag(tag) {
        return KNOWN_LANGUAGES.has(tag.toLowerCase().trim());
    }

    function sortTags(tags) {
        const categories = [];
        const languages = [];
        tags.forEach(t => {
            if (isLanguageTag(t)) {
                languages.push(t);
            } else {
                categories.push(t);
            }
        });
        categories.sort((a, b) => a.localeCompare(b));
        languages.sort((a, b) => a.localeCompare(b));
        return [...categories, ...languages];
    }

    /* ==========================================================
       DATA LOADING
       ========================================================== */
    async function loadGames() {
        const res = await fetch('data/games.csv');
        const text = await res.text();
        const rows = parseCSV(text);
        games = rows.map(r => {
            const rawTags = r.tags ? r.tags.split(';').map(t => t.trim()).filter(Boolean) : [];
            return {
                id: r.name.toLowerCase().replace(/\s+/g, '-'),
                name: r.name,
                url: r.url,
                description: r.description,
                tags: rawTags,
            };
        });
    }

    /* ==========================================================
       PERSISTENCE  (localStorage)
       ========================================================== */
    function todayStamp() {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    }

    function loadPlayed() {
        try {
            const s = JSON.parse(localStorage.getItem(KEYS.PLAYED));
            if (s && s.ts >= todayStamp()) { playedGames = s.games || {}; }
            else { playedGames = {}; savePlayed(); }
        } catch { playedGames = {}; }
    }
    function savePlayed() {
        localStorage.setItem(KEYS.PLAYED, JSON.stringify({ ts: Date.now(), games: playedGames }));
    }

    function loadFavorites() {
        try { favoriteGames = JSON.parse(localStorage.getItem(KEYS.FAVORITES)) || {}; }
        catch { favoriteGames = {}; }
    }
    function saveFavorites() {
        localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favoriteGames));
    }

    function loadOrder() {
        try { gameOrder = JSON.parse(localStorage.getItem(KEYS.ORDER)) || []; }
        catch { gameOrder = []; }
    }
    function saveOrder() {
        localStorage.setItem(KEYS.ORDER, JSON.stringify(gameOrder));
    }

    function loadState() {
        loadPlayed();
        loadFavorites();
        loadOrder();
    }

    /* ==========================================================
       THEME
       ========================================================== */
    function initTheme() {
        const saved = localStorage.getItem(KEYS.THEME);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(saved || (prefersDark ? 'dark' : 'light'));
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        wordmark.src = theme === 'dark'
            ? 'assets/wordmark-light.png'
            : 'assets/wordmark-dark.png';
        updateThemeIcon(theme);

        /* Update mobile browser chrome color */
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        meta.content = theme === 'dark' ? '#21211B' : '#D4CCC0';
    }

    function toggleTheme() {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(KEYS.THEME, next);
    }

    function updateThemeIcon(theme) {
        /* Moon for light mode, Sun for dark mode */
        themeToggle.innerHTML = theme === 'dark'
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

    /* ==========================================================
       ORDERING
       ========================================================== */
    function applyCustomOrder(list) {
        if (!gameOrder.length) return list;
        const idx = {};
        gameOrder.forEach((id, i) => idx[id] = i);
        return [...list].sort((a, b) => (idx[a.id] ?? Infinity) - (idx[b.id] ?? Infinity));
    }

    /* ==========================================================
       FILTERING
       ========================================================== */
    function getFilteredGames() {
        let list;
        if (activeFilter === 'favorites') {
            list = games.filter(g => favoriteGames[g.id]);
        } else if (activeFilter === 'all') {
            list = [...games];
        } else {
            list = games.filter(g => g.tags.includes(activeFilter));
        }
        return applyCustomOrder(list);
    }

    /* ==========================================================
       RENDER — TABS
       ========================================================== */
    function renderTabs() {
        const tagSet = new Set();
        games.forEach(g => g.tags.forEach(t => tagSet.add(t)));
        const tabs = ['All', 'Favorites', ...sortTags(Array.from(tagSet))];

        tabBar.innerHTML = tabs.map(tab => {
            const val = tab === 'All' ? 'all' : tab === 'Favorites' ? 'favorites' : tab;
            const active = (val === activeFilter) ? ' active' : '';
            const isTag = (val !== 'all' && val !== 'favorites');
            const dot = isTag ? '<span class="tab-dot"></span>' : '';
            return `<button class="tab-btn${active}" data-tag="${val}">${dot}<span class="tab-label">${tab}</span></button>`;
        }).join('');
    }

    /* ==========================================================
       RENDER — GAME CARDS
       ========================================================== */
    function getCheckIcon(isPlayed) {
        return isPlayed
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="0" stroke-width="2"/><path d="m8.5 12 2.5 2.5 5-5" stroke-width="2.8"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="0"/></svg>';
    }

    function renderGames(animateCounter = false) {
        const filtered = getFilteredGames();
        gameGrid.innerHTML = '';

        if (!filtered.length) {
            gameGrid.innerHTML = `<div class="empty-state">${activeFilter === 'favorites'
                    ? 'No favorites yet. Star some games!'
                    : 'No games in this category.'
                }</div>`;
            updateCounter(0, 0, animateCounter);
            return;
        }

        filtered.forEach(game => {
            const isPlayed = !!playedGames[game.id];
            const isFavorite = !!favoriteGames[game.id];

            const card = document.createElement('div');
            card.className = 'game-card' + (isPlayed ? ' played' : '');
            card.dataset.id = game.id;
            const primary = (game.tags && game.tags.length > 0) ? game.tags[0].toLowerCase() : 'default';
            card.dataset.primaryTag = primary;
            card.draggable = true;

            /* Star icon: filled when favorite */
            const starFill = isFavorite ? 'currentColor' : 'none';

            /* Checkbox icon: empty square vs checked square */
            const checkIcon = getCheckIcon(isPlayed);

            /* Tags: editorial style with colored category dot */
            const tagsHtml = game.tags.map(t =>
                `<span class="card-tag" data-tag="${t.toLowerCase()}"><span class="card-tag-dot"></span>${t}</span>`
            ).join('<span class="tag-sep">·</span>');

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-title"><span class="card-title-text">${game.name}</span></span>
                    <div class="card-actions">
                        <button class="card-action favorite-btn${isFavorite ? ' is-favorite' : ''}"
                                title="Toggle favorite" aria-label="Toggle favorite">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                 fill="${starFill}" stroke="currentColor" stroke-width="2"
                                 stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </button>
                        <button class="card-action complete-btn${isPlayed ? ' is-completed' : ''}"
                                title="Mark as completed" aria-label="Mark as completed">
                            ${checkIcon}
                        </button>
                    </div>
                </div>
                <p class="card-description">${game.description}</p>
                <div class="card-tags">${tagsHtml}</div>
            `;

            gameGrid.appendChild(card);
        });

        updateCounter(undefined, undefined, animateCounter);
    }

    /* ==========================================================
       COUNTER
       ========================================================== */
    let counterTimer = null;

    function applyCounterValues(c, t) {
        counterText.textContent = `${c}/${t}`;

        if (t > 0 && c === t) {
            counterEl.classList.add('all-complete');
            checkEasterEgg();
        } else {
            counterEl.classList.remove('all-complete');
        }
    }

    function updateCounter(completed, total, animate = false) {
        const filtered = getFilteredGames();
        const c = completed ?? filtered.filter(g => playedGames[g.id]).length;
        const t = total ?? filtered.length;

        if (animate) {
            if (counterTimer) clearTimeout(counterTimer);

            // Quickly fade out current counter on the spot
            counterEl.classList.remove('initial-enter', 'counter-enter');
            counterEl.classList.add('counter-fade-out');

            counterTimer = setTimeout(() => {
                applyCounterValues(c, t);
                counterEl.classList.remove('counter-fade-out');
                counterEl.classList.add('counter-enter');

                counterTimer = setTimeout(() => {
                    counterEl.classList.remove('counter-enter');
                    counterTimer = null;
                }, 300);
            }, 120);
        } else {
            applyCounterValues(c, t);
        }
    }

    /* ==========================================================
       EASTER EGG — all games completed
       ========================================================== */
    function checkEasterEgg() {
        if (easterEggShown) return;
        const allDone = games.every(g => playedGames[g.id]);
        if (!allDone) return;
        easterEggShown = true;
        launchEasterEgg();
    }

    function launchEasterEgg() {
        /* --- Confetti --- */
        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C42'];
        const pieces = Array.from({ length: 160 }, () => ({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * canvas.height * 0.6,
            w: 5 + Math.random() * 6,
            h: 3 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            rs: (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 3,
            vy: 2 + Math.random() * 3,
            o: 1,
        }));

        let frame = 0;
        (function tick() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            pieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.rs;
                p.vy += 0.04;
                if (frame > 140) p.o -= 0.008;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.o);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (frame < 320 && pieces.some(p => p.o > 0)) requestAnimationFrame(tick);
            else canvas.remove();
        })();

        /* --- Message --- */
        const backdrop = document.createElement('div');
        backdrop.className = 'easter-egg-backdrop';
        document.body.appendChild(backdrop);

        const msg = document.createElement('div');
        msg.className = 'easter-egg-message';
        msg.innerHTML = '<h2>🌱 All Done!</h2><p>You\'ve completed every daily today. Go touch some grass.</p>';
        document.body.appendChild(msg);

        const dismiss = () => {
            backdrop.style.transition = 'opacity 0.4s';
            msg.style.transition = 'opacity 0.4s, transform 0.4s';
            backdrop.style.opacity = '0';
            msg.style.opacity = '0';
            msg.style.transform = 'translate(-50%,-50%) scale(0.92)';
            setTimeout(() => { backdrop.remove(); msg.remove(); }, 400);
        };

        backdrop.addEventListener('click', dismiss);
        msg.addEventListener('click', dismiss);
        setTimeout(dismiss, 5000);
    }

    /* ==========================================================
       BURST ANIMATION
       ========================================================== */
    function createCompletionBurst(card, btn) {
        const burst = document.createElement('div');
        burst.className = 'completion-burst';
        const rect = btn.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        burst.style.left = (rect.left - cardRect.left + rect.width / 2) + 'px';
        burst.style.top = (rect.top - cardRect.top + rect.height / 2) + 'px';

        const colors = [
            'var(--tag-word)',
            'var(--tag-logic)',
            'var(--tag-visual)',
            'var(--tag-music)',
            'var(--tag-audio)',
            'var(--tag-trivia)',
            'var(--tag-quiz)',
            'var(--tag-catala)',
            'var(--tag-espanol)',
            'var(--tag-english)'
        ];
        const count = 10;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('span');
            p.className = 'burst-particle';
            const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
            const dist = 22 + Math.random() * 20;
            p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            p.style.setProperty('--color', colors[i % colors.length]);
            p.style.setProperty('--size', `${4 + Math.random() * 3}px`);
            burst.appendChild(p);
        }
        burst.addEventListener('animationend', (e) => e.stopPropagation());
        card.appendChild(burst);
        setTimeout(() => burst.remove(), 600);
    }

    /* ==========================================================
       EVENT HANDLERS
       ========================================================== */
    function triggerTransientAnimation(el, classesToRemove, animNames, maxDuration = 600) {
        if (el._animCleanup) el._animCleanup();

        const cleanup = () => {
            el.classList.remove(...classesToRemove);
            el.removeEventListener('animationend', onEnd);
            el.removeEventListener('animationcancel', onEnd);
            clearTimeout(timeoutId);
            el._animCleanup = null;
        };

        const onEnd = (evt) => {
            if ((evt.target === el || el.contains(evt.target)) && animNames.includes(evt.animationName)) {
                cleanup();
            }
        };

        const timeoutId = setTimeout(cleanup, maxDuration);
        el._animCleanup = cleanup;
        el.addEventListener('animationend', onEnd);
        el.addEventListener('animationcancel', onEnd);
    }

    function handleCardClick(e) {
        const card = e.target.closest('.game-card');
        if (!card) return;
        const id = card.dataset.id;

        /* Favorite */
        const favBtn = e.target.closest('.favorite-btn');
        if (favBtn) {
            e.stopPropagation();
            const isFav = !favoriteGames[id];
            if (isFav) {
                favoriteGames[id] = true;
            } else {
                delete favoriteGames[id];
            }
            saveFavorites();

            if (activeFilter === 'favorites') {
                renderGames();
            } else {
                favBtn.classList.toggle('is-favorite', isFav);
                const poly = favBtn.querySelector('polygon');
                if (poly) poly.setAttribute('fill', isFav ? 'currentColor' : 'none');

                favBtn.classList.remove('just-favorited', 'just-unfavorited');
                void favBtn.offsetWidth;
                favBtn.classList.add(isFav ? 'just-favorited' : 'just-unfavorited');
                triggerTransientAnimation(favBtn, ['just-favorited', 'just-unfavorited'], ['star-pop', 'star-deflate'], 500);
            }
            return;
        }

        /* Complete */
        const completeBtn = e.target.closest('.complete-btn');
        if (completeBtn) {
            e.stopPropagation();
            const wasPlayed = !!playedGames[id];
            if (wasPlayed) {
                if (card._animCleanup) card._animCleanup();
                delete playedGames[id];
                card.classList.remove('played', 'just-completed');
                completeBtn.classList.remove('is-completed');
                completeBtn.innerHTML = getCheckIcon(false);
            } else {
                playedGames[id] = true;
                // Force reflow so animation re-triggers if re-checked
                card.classList.remove('just-completed');
                void card.offsetWidth;
                card.classList.add('played', 'just-completed');
                completeBtn.classList.add('is-completed');
                completeBtn.innerHTML = getCheckIcon(true);
                createCompletionBurst(card, completeBtn);
                triggerTransientAnimation(card, ['just-completed'], ['card-jump'], 600);
            }
            savePlayed();
            updateCounter();
            return;
        }

        /* Open game link */
        const game = games.find(g => g.id === id);
        if (game?.url) window.open(game.url, '_blank', 'noopener,noreferrer');
    }

    function handleTabClick(e) {
        const btn = e.target.closest('.tab-btn');
        if (!btn || btn.dataset.tag === activeFilter) return;
        activeFilter = btn.dataset.tag;
        tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGames(true);
    }

    /* ==========================================================
       DRAG & DROP
       ========================================================== */
    const drag = {
        active: false,
        el: null,
        id: null,
        clone: null,
        timer: null,
        sx: 0, sy: 0,
        ox: 0, oy: 0,
    };

    function setupDnD() {
        /* Desktop */
        gameGrid.addEventListener('dragstart', onDragStart);
        gameGrid.addEventListener('dragover', onDragOver);
        gameGrid.addEventListener('drop', onDrop);
        gameGrid.addEventListener('dragend', onDragEnd);
        /* Mobile */
        gameGrid.addEventListener('touchstart', onTouchStart, { passive: true });
        gameGrid.addEventListener('touchmove', onTouchMove, { passive: false });
        gameGrid.addEventListener('touchend', onTouchEnd);
        gameGrid.addEventListener('touchcancel', onTouchEnd);
    }

    /* --- Desktop DnD --- */
    function onDragStart(e) {
        const card = e.target.closest('.game-card');
        if (!card || e.target.closest('.card-action')) return;
        drag.el = card;
        drag.id = card.dataset.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', drag.id);
        requestAnimationFrame(() => card.classList.add('dragging'));
    }

    function onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = getCardAt(e.clientX, e.clientY);
        if (!target || target === drag.el) return;
        const rect = target.getBoundingClientRect();
        const after = e.clientX > rect.left + rect.width / 2;
        gameGrid.insertBefore(drag.el, after ? target.nextSibling : target);
    }

    function onDrop(e) { e.preventDefault(); commitOrder(); }

    function onDragEnd() {
        drag.el?.classList.remove('dragging');
        drag.el = null;
        drag.id = null;
    }

    /* --- Mobile touch DnD --- */
    function onTouchStart(e) {
        const card = e.target.closest('.game-card');
        if (!card || e.target.closest('.card-action')) return;
        const t = e.touches[0];
        drag.sx = t.clientX;
        drag.sy = t.clientY;
        drag.el = card;
        drag.id = card.dataset.id;

        drag.timer = setTimeout(() => {
            drag.active = true;
            card.classList.add('dragging');
            const rect = card.getBoundingClientRect();
            const clone = card.cloneNode(true);
            clone.className = 'game-card drag-clone';
            clone.style.width = rect.width + 'px';
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            document.body.appendChild(clone);
            drag.clone = clone;
            drag.ox = t.clientX - rect.left;
            drag.oy = t.clientY - rect.top;
            if (navigator.vibrate) navigator.vibrate(30);
        }, 450);
    }

    function onTouchMove(e) {
        if (!drag.active) {
            const t = e.touches[0];
            if (Math.abs(t.clientX - drag.sx) > 10 || Math.abs(t.clientY - drag.sy) > 10) {
                clearTimeout(drag.timer);
            }
            return;
        }
        e.preventDefault();
        const t = e.touches[0];
        if (drag.clone) {
            drag.clone.style.left = (t.clientX - drag.ox) + 'px';
            drag.clone.style.top = (t.clientY - drag.oy) + 'px';
        }
        /* Reorder */
        if (drag.clone) drag.clone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (drag.clone) drag.clone.style.display = '';
        const target = el?.closest('.game-card');
        if (target && target !== drag.el) {
            const rect = target.getBoundingClientRect();
            const after = t.clientX > rect.left + rect.width / 2;
            gameGrid.insertBefore(drag.el, after ? target.nextSibling : target);
        }
    }

    function onTouchEnd() {
        clearTimeout(drag.timer);
        if (drag.active) {
            drag.el?.classList.remove('dragging');
            drag.clone?.remove();
            commitOrder();
        }
        drag.active = false;
        drag.el = null;
        drag.id = null;
        drag.clone = null;
    }

    /* Helpers */
    function getCardAt(x, y) {
        for (const card of gameGrid.querySelectorAll('.game-card:not(.dragging)')) {
            const r = card.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card;
        }
        return null;
    }

    function commitOrder() {
        gameOrder = Array.from(gameGrid.querySelectorAll('.game-card')).map(c => c.dataset.id);
        saveOrder();
    }

    /* ==========================================================
       DAILY RESET (midnight event from clock.js)
       ========================================================== */
    window.addEventListener('dailyreset', () => {
        playedGames = {};
        savePlayed();
        easterEggShown = false;
        renderGames();
    });

    /* ==========================================================
       INIT
       ========================================================== */
    async function init() {
        initTheme();
        await loadGames();
        loadState();
        renderTabs();
        renderGames();

        themeToggle.addEventListener('click', toggleTheme);
        tabBar.addEventListener('click', handleTabClick);
        gameGrid.addEventListener('click', handleCardClick);
        setupDnD();

        /* 7-segment clock (clock.js must be loaded before app.js) */
        const clockEl = document.getElementById('clock');
        if (typeof SegmentClock !== 'undefined') {
            new SegmentClock(clockEl);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
