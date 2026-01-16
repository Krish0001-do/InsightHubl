const searchBtn = document.getElementById('searchBtn');
const usernameInput = document.getElementById('username');
const profileDiv = document.getElementById('profile');
const errorDiv = document.getElementById('error');

const themeToggleBtn = document.getElementById('themeToggle');
const shareBtn = document.getElementById('shareBtn');
const copyUsernameBtn = document.getElementById('copyUsernameBtn');
const loadingDiv = document.getElementById('loading');
const historyChips = document.getElementById('historyChips');
const historyList = document.getElementById('historyList');
const searchResultsEl = document.getElementById('searchResults');

const repoSortSelect = document.getElementById('repoSort');
const repoQueryInput = document.getElementById('repoQuery');
const repoLanguageInput = document.getElementById('repoLanguage');
const minStarsInput = document.getElementById('minStars');
const excludeForksCheckbox = document.getElementById('excludeForks');
const updatedAfterInput = document.getElementById('updatedAfter');
const loadMoreReposBtn = document.getElementById('loadMoreRepos');
const repoMeta = document.getElementById('repoMeta');

const languagesSection = document.getElementById('languagesSection');
const langChart = document.getElementById('langChart');
const orgsSection = document.getElementById('orgsSection');
const orgsList = document.getElementById('orgsList');
const followersSection = document.getElementById('followersSection');
const followersList = document.getElementById('followersList');
const followingSection = document.getElementById('followingSection');
const followingList = document.getElementById('followingList');
const gistsSection = document.getElementById('gistsSection');
const gistsList = document.getElementById('gistsList');

const readmeSection = document.getElementById('readmeSection');
const readmeTitle = document.getElementById('readmeTitle');
const readmeContent = document.getElementById('readmeContent');
const activitySection = document.getElementById('activitySection');
const activityList = document.getElementById('activityList');

const insightsEl = document.getElementById('insights');
const compareSection = document.getElementById('compareSection');
const compareTable = document.getElementById('compareTable');
const downloadBtn = document.getElementById('downloadBtn');

const historyRow = document.getElementById('historyRow');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const infinityLayer = document.getElementById('infinityLayer');
const infinityBtn = document.getElementById('infinityBtn');
const fxCanvas = document.getElementById('fxCanvas');

const HISTORY_KEY = 'ghpf_history_v1';
const THEME_KEY = 'ghpf_theme_v1';
const CACHE_KEY = 'ghpf_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

const repoState = {
    username: null,
    sort: 'updated',
    page: 1,
    perPage: 10,
    loaded: [],
    hasMore: true,
};

const searchState = {
    query: '',
    page: 1,
    perPage: 10,
    totalCount: 0,
    items: [],
};

// Event Listeners
searchBtn.addEventListener('click', searchUser);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUser();
});

if (searchResultsEl) {
    searchResultsEl.addEventListener('click', (e) => {
        const el = (e.target instanceof Element) ? e.target : null;
        if (!el) return;

        const more = el.closest('[data-action="load-more"]');
        if (more) {
            const q = more.getAttribute('data-query') || '';
            loadMoreSimilarUsers(q);
            return;
        }

        const btn = el.closest('[data-user]');
        if (!btn) return;
        const u = btn.getAttribute('data-user');
        if (!u) return;
        usernameInput.value = u;
        hideSearchResults();
        // Load selected user directly
        searchExactUser(u, [u]);
    });
}

themeToggleBtn.addEventListener('click', toggleTheme);
shareBtn.addEventListener('click', copyShareLink);
copyUsernameBtn.addEventListener('click', copyUsername);

if (infinityBtn && infinityLayer) {
    infinityBtn.addEventListener('click', (e) => moveInfinityPattern(e));
}

// Click on background to create a satisfying 'warp' effect (doesn't interfere with UI controls)
if (infinityLayer) {
    document.addEventListener('pointerdown', (e) => {
        if (e.target && e.target.closest && e.target.closest('button,input,select,textarea,a,label')) return;
        moveInfinityPattern(e);
    });
}

function moveInfinityPattern(e) {
    if (!infinityLayer) return;

    // Random, but bounded shifts so it always looks intentional.
    const x = Math.round((Math.random() * 220) - 110);
    const y = Math.round((Math.random() * 160) - 80);
    const r = Math.round((Math.random() * 10) - 5);
    const s = (0.98 + Math.random() * 0.08).toFixed(2);

    let px = 50;
    let py = 50;
    if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        px = Math.max(0, Math.min(100, (e.clientX / window.innerWidth) * 100));
        py = Math.max(0, Math.min(100, (e.clientY / window.innerHeight) * 100));
    }

    infinityLayer.style.setProperty('--inf-x', `${x}px`);
    infinityLayer.style.setProperty('--inf-y', `${y}px`);
    infinityLayer.style.setProperty('--inf-r', `${r}deg`);
    infinityLayer.style.setProperty('--inf-s', s);
    infinityLayer.style.setProperty('--px', `${px}%`);
    infinityLayer.style.setProperty('--py', `${py}%`);

    infinityLayer.classList.remove('pulse');
    // reflow to restart animation
    void infinityLayer.offsetWidth;
    infinityLayer.classList.add('pulse');
    window.setTimeout(() => infinityLayer.classList.remove('pulse'), 700);
}

repoSortSelect.addEventListener('change', () => {
    repoState.sort = repoSortSelect.value;
    resetRepos();
    if (repoState.username) {
        loadReposPage();
    }
});

repoLanguageInput.addEventListener('input', () => {
    renderRepos();
    renderLanguageStats();
});

repoQueryInput.addEventListener('input', () => {
    renderRepos();
    renderLanguageStats();
});

minStarsInput.addEventListener('input', () => {
    renderRepos();
    renderLanguageStats();
});

excludeForksCheckbox.addEventListener('change', () => {
    renderRepos();
    renderLanguageStats();
});

updatedAfterInput.addEventListener('change', () => {
    renderRepos();
    renderLanguageStats();
});

loadMoreReposBtn.addEventListener('click', () => {
    if (repoState.username) {
        loadReposPage();
    }
});

downloadBtn.addEventListener('click', downloadCard);

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryUI();
});

initApp();

function initApp() {
    applySavedTheme();
    renderHistoryUI();
    initFuturisticFx();

    const url = new URL(window.location.href);
    const deepUser = url.searchParams.get('user');
    if (deepUser) {
        usernameInput.value = deepUser;
        searchUser();
    }
}

function initFuturisticFx() {
    if (!fxCanvas) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const ctx = fxCanvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let rafId = 0;
    let running = true;

    const rootStyle = getComputedStyle(document.documentElement);
    const accentA = (rootStyle.getPropertyValue('--accentA') || '#60a5fa').trim();
    const accentB = (rootStyle.getPropertyValue('--accentB') || '#818cf8').trim();

    const pointer = { x: null, y: null, down: false };

    function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        w = Math.max(1, window.innerWidth);
        h = Math.max(1, window.innerHeight);
        fxCanvas.width = Math.floor(w * dpr);
        fxCanvas.height = Math.floor(h * dpr);
        fxCanvas.style.width = `${w}px`;
        fxCanvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    const isSmall = () => Math.min(window.innerWidth, window.innerHeight) < 520;
    const baseCount = () => (isSmall() ? 42 : 78);

    let particles = [];
    function spawn() {
        const count = baseCount();
        particles = Array.from({ length: count }, () => ({
            x: rand(0, w),
            y: rand(0, h),
            vx: rand(-0.22, 0.22),
            vy: rand(-0.18, 0.18),
            r: rand(1.1, 2.1),
            phase: rand(0, Math.PI * 2),
        }));
    }

    function draw(t) {
        if (!running) return;
        const time = t * 0.001;

        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        const light = document.body.classList.contains('light');
        const maxDist = isSmall() ? 120 : 160;
        const maxDist2 = maxDist * maxDist;

        // subtle vignette to keep focus on card
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, 40, w * 0.5, h * 0.45, Math.max(w, h) * 0.72);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.22)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

        // move
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
            if (p.y < -20) p.y = h + 20;
            if (p.y > h + 20) p.y = -20;
        }

        // lines
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 > maxDist2) continue;
                const alpha = (1 - (d2 / maxDist2)) * (light ? 0.18 : 0.24);

                ctx.strokeStyle = i % 2 === 0
                    ? `rgba(96,165,250,${alpha})`
                    : `rgba(129,140,248,${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        // pointer attract / pulse
        if (pointer.x !== null && pointer.y !== null) {
            const pr = pointer.down ? (isSmall() ? 150 : 220) : (isSmall() ? 110 : 160);
            const pr2 = pr * pr;
            for (const p of particles) {
                const dx = p.x - pointer.x;
                const dy = p.y - pointer.y;
                const d2 = dx * dx + dy * dy;
                if (d2 > pr2) continue;
                const pull = (1 - d2 / pr2) * (pointer.down ? 0.010 : 0.006);
                p.vx += (-dx) * pull * 0.001;
                p.vy += (-dy) * pull * 0.001;
            }
        }

        // dots
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const glow = (Math.sin(time + p.phase) * 0.5 + 0.5);
            const a = (light ? 0.55 : 0.8) * (0.55 + glow * 0.45);
            const col = i % 2 === 0 ? accentA : accentB;

            ctx.fillStyle = col;
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            // small outer glow
            ctx.globalAlpha = a * 0.22;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        rafId = window.requestAnimationFrame(draw);
    }

    function onPointerMove(e) {
        if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    }

    function onPointerLeave() {
        pointer.x = null;
        pointer.y = null;
        pointer.down = false;
    }

    function onPointerDown() {
        pointer.down = true;
        // quick burst
        for (const p of particles) {
            p.vx *= 1.08;
            p.vy *= 1.08;
        }
        window.setTimeout(() => { pointer.down = false; }, 260);
    }

    function onVisibility() {
        running = document.visibilityState === 'visible';
        if (running) {
            cancelAnimationFrame(rafId);
            rafId = window.requestAnimationFrame(draw);
        }
    }

    window.addEventListener('resize', () => {
        resize();
        spawn();
    }, { passive: true });

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave, { passive: true });

    resize();
    spawn();
    rafId = window.requestAnimationFrame(draw);
}

async function searchUser() {
    const raw = usernameInput.value.trim();
    const parts = parseUsernames(raw);
    const username = parts[0];
    
    if (!username) {
        showError('Please enter a GitHub username!');
        return;
    }

    hideError();
    shareBtn.classList.add('hidden');
    hideSearchResults();

    // Compare mode: keep old behavior (exact usernames).
    if (parts.length === 2) {
        await searchExactUser(parts[0], parts);
        return;
    }

    // Single search: show similar matches first, then auto-load exact match if present.
    setLoading(true);
    try {
        await startSimilarUsersSearch(raw);
        renderSearchResults(searchState.query, searchState.items, searchState.totalCount);

        const exact = searchState.items.find(m => (m.login || '').toLowerCase() === raw.toLowerCase());
        // If there are multiple similar users (like "ravi"), keep the list visible.
        // Only auto-load when there is exactly one clear match.
        if (exact && exact.login && searchState.items.length === 1) {
            hideSearchResults();
            await searchExactUser(exact.login, [exact.login]);
        } else {
            profileDiv.classList.add('hidden');
        }
    } catch (error) {
        const msg = String(error?.message || '');
        if (msg.startsWith('GitHub API rate limit hit')) {
            hideError();
            updateDeepLink(username);
            displayMinimalProfile(username, msg);
        } else {
            showError(msg || 'Network error. Please check your connection.');
        }
    } finally {
        setLoading(false);
    }
}

async function startSimilarUsersSearch(query) {
    const q = String(query || '').trim();
    searchState.query = q;
    searchState.page = 1;
    searchState.totalCount = 0;
    searchState.items = [];
    if (!q) return;
    const res = await searchSimilarUsers(q, 1, searchState.perPage);
    searchState.totalCount = res.totalCount;
    searchState.items = res.items;
}

async function loadMoreSimilarUsers(query) {
    const q = String(query || '').trim();
    if (!q || q !== searchState.query) return;
    const nextPage = searchState.page + 1;
    setLoading(true);
    try {
        const res = await searchSimilarUsers(q, nextPage, searchState.perPage);
        const existing = new Set(searchState.items.map(x => String(x.login || '').toLowerCase()));
        for (const it of res.items) {
            const key = String(it.login || '').toLowerCase();
            if (!key || existing.has(key)) continue;
            existing.add(key);
            searchState.items.push(it);
        }
        searchState.page = nextPage;
        searchState.totalCount = res.totalCount;
        renderSearchResults(searchState.query, searchState.items, searchState.totalCount);
    } catch (error) {
        const msg = String(error?.message || '');
        showError(msg || 'Failed to load more results.');
    } finally {
        setLoading(false);
    }
}

async function searchExactUser(username, parts) {
    const u = String(username || '').trim();
    if (!u) return;

    hideError();
    profileDiv.classList.add('hidden');
    setLoading(true);
    shareBtn.classList.add('hidden');

    resetRepos();
    hideReadme();
    clearExtraPanels();
    repoState.username = u;
    repoState.sort = repoSortSelect.value;

    try {
        const userData = await fetchJson(`https://api.github.com/users/${u}`);
        updateDeepLink(u);

        const reposData = await fetchJson(getReposUrl(u, repoState.sort, repoState.page, repoState.perPage));
        repoState.loaded = Array.isArray(reposData) ? reposData : [];
        repoState.hasMore = (repoState.loaded.length === repoState.perPage);
        repoState.page = 1;

        displayProfile(userData);
        renderInsights(userData);
        renderRepos();
        renderLanguageStats();

        const extraResults = await Promise.allSettled([
            fetchJson(`https://api.github.com/users/${u}/orgs?per_page=15`),
            fetchJson(`https://api.github.com/users/${u}/followers?per_page=15`),
            fetchJson(`https://api.github.com/users/${u}/following?per_page=15`),
            fetchJson(`https://api.github.com/users/${u}/gists?per_page=10`),
            fetchJson(`https://api.github.com/users/${u}/events/public?per_page=12`),
        ]);

        const [orgsR, followersR, followingR, gistsR, eventsR] = extraResults;
        if (orgsR.status === 'fulfilled') renderOrgs(orgsR.value);
        if (followersR.status === 'fulfilled' && followingR.status === 'fulfilled') {
            renderPeopleLists(followersR.value, followingR.value);
        }
        if (gistsR.status === 'fulfilled') renderGists(gistsR.value);
        if (eventsR.status === 'fulfilled') renderActivity(eventsR.value);

        addToHistory(u);
        renderHistoryUI();

        shareBtn.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');

        if (parts && parts.length === 2) {
            await renderComparison(parts[0], parts[1]);
        } else {
            compareSection.classList.add('hidden');
        }
    } catch (error) {
        const msg = String(error?.message || '');
        if (msg.startsWith('GitHub API rate limit hit')) {
            hideError();
            updateDeepLink(u);
            displayMinimalProfile(u, msg);
        } else {
            showError(msg || 'Network error. Please check your connection.');
        }
    } finally {
        setLoading(false);
    }
}

async function searchSimilarUsers(query, page = 1, perPage = 10) {
    const q = String(query || '').trim();
    if (!q) return { items: [], totalCount: 0 };

    // Search API returns similar usernames. Note: GitHub also rate-limits this endpoint.
    const url = new URL('https://api.github.com/search/users');
    url.searchParams.set('q', `${q} in:login`);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    const data = await fetchJson(url.toString());
    const items = data && Array.isArray(data.items) ? data.items : [];
    const totalCount = data && typeof data.total_count === 'number' ? data.total_count : items.length;
    return { items, totalCount };
}

function renderSearchResults(query, items, totalCount = 0) {
    if (!searchResultsEl) return;
    const arr = Array.isArray(items) ? items : [];

    if (arr.length === 0) {
        searchResultsEl.classList.add('hidden');
        searchResultsEl.innerHTML = '';
        return;
    }

    searchResultsEl.classList.remove('hidden');
    const canLoadMore = totalCount > arr.length;
    searchResultsEl.innerHTML = `
        <div class="results-head">
            <h3>✨ Similar Users</h3>
            <div class="muted">Showing ${arr.length}${totalCount ? ` of ${totalCount}` : ''} for “${escapeHtml(query)}”</div>
        </div>
        <div class="results-list">
            ${arr.slice(0, 50).map(u => {
                const login = escapeHtml(u.login || '');
                const avatar = escapeHtml(u.avatar_url || '');
                const url = escapeHtml(u.html_url || '#');
                const score = typeof u.score === 'number' ? u.score.toFixed(1) : '';
                return `
                    <div class="result-item">
                        <div class="result-left">
                            <img src="${avatar}" alt="${login}">
                            <div class="login">${login}${score ? ` <span class="muted" style="font-weight:600; opacity:.7">(${score})</span>` : ''}</div>
                        </div>
                        <div class="result-right">
                            <a class="small-btn" href="${url}" target="_blank" rel="noreferrer">Open</a>
                            <button class="small-btn" type="button" data-user="${login}">Load</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        ${canLoadMore ? `
            <div class="results-footer">
                <button class="small-btn" type="button" data-action="load-more" data-query="${escapeHtml(query)}">Load more</button>
            </div>
        ` : ''}
    `;
}

function hideSearchResults() {
    if (!searchResultsEl) return;
    searchResultsEl.classList.add('hidden');
    searchResultsEl.innerHTML = '';
    searchState.query = '';
    searchState.page = 1;
    searchState.totalCount = 0;
    searchState.items = [];
}

function displayMinimalProfile(username, note) {
    // Works even when API is rate-limited: uses public avatar URL + GitHub links.
    const u = String(username || '').trim();
    if (!u) return;

    const safe = encodeURIComponent(u);
    const avatarUrl = `https://github.com/${safe}.png?size=200`;
    const profileUrl = `https://github.com/${safe}`;

    document.getElementById('avatar').src = avatarUrl;
    document.getElementById('name').textContent = u;
    document.getElementById('bio').textContent = note || 'GitHub API limit reached — showing basic profile link.';

    const link = document.getElementById('profileLink');
    link.href = profileUrl;
    link.textContent = 'Open GitHub Profile';

    // Stats unknown without API
    document.getElementById('repos').textContent = '—';
    document.getElementById('followers').textContent = '—';
    document.getElementById('following').textContent = '—';

    // Hide details we can't fetch
    setDetail('location', null);
    setDetail('company', null);
    document.getElementById('blog').classList.add('hidden');
    document.getElementById('twitter').classList.add('hidden');
    const joinedEl = document.getElementById('joined');
    if (joinedEl) joinedEl.classList.add('hidden');

    // Hide sections dependent on API data
    hideReadme();
    clearExtraPanels();
    document.getElementById('reposList').innerHTML = '';
    repoMeta.textContent = '';
    loadMoreReposBtn.disabled = true;
    compareSection.classList.add('hidden');

    // Show main card + share/download controls if you want
    repoState.username = u;
    profileDiv.classList.remove('hidden');
    shareBtn.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
}

function displayProfile(user) {
    // Basic Info
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('name').textContent = user.name || user.login;
    document.getElementById('bio').textContent = user.bio || 'No bio available';
    document.getElementById('profileLink').href = user.html_url;

    // Stats
    document.getElementById('repos').textContent = user.public_repos;
    document.getElementById('followers').textContent = user.followers;
    document.getElementById('following').textContent = user.following;

    // Details
    setDetail('location', user.location);
    setDetail('company', user.company);
    
    // Blog
    const blogEl = document.getElementById('blog');
    if (user.blog) {
        blogEl.classList.remove('hidden');
        const blogLink = blogEl.querySelector('a');
        blogLink.href = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
        blogLink.textContent = user.blog;
    } else {
        blogEl.classList.add('hidden');
    }

    // Twitter
    const twitterEl = document.getElementById('twitter');
    if (user.twitter_username) {
        twitterEl.classList.remove('hidden');
        const twitterLink = twitterEl.querySelector('a');
        twitterLink.href = `https://twitter.com/${user.twitter_username}`;
        twitterLink.textContent = `@${user.twitter_username}`;
    } else {
        twitterEl.classList.add('hidden');
    }

    // Joined Date
    const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.querySelector('#joined .detail-value').textContent = joinedDate;

    // Show profile
    profileDiv.classList.remove('hidden');
}

function setDetail(id, value) {
    const element = document.getElementById(id);
    if (value) {
        element.classList.remove('hidden');
        element.querySelector('.detail-value').textContent = value;
    } else {
        element.classList.add('hidden');
    }
}

function renderRepos() {
    const reposList = document.getElementById('reposList');
    reposList.innerHTML = '';

    const filtered = getFilteredRepos(repoState.loaded);

    repoMeta.textContent = repoState.username
        ? `Loaded ${repoState.loaded.length} repo(s) • Showing ${filtered.length} • Sort: ${repoState.sort}`
        : '';

    loadMoreReposBtn.disabled = !repoState.hasMore;

    if (repoState.loaded.length === 0) {
        reposList.innerHTML = '<p style="color: rgba(255,255,255,0.65)">No repositories loaded yet.</p>';
        return;
    }

    if (filtered.length === 0) {
        reposList.innerHTML = '<p style="color: rgba(255,255,255,0.65)">No repos match the current filter.</p>';
        return;
    }

    filtered.forEach(repo => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';
        repoItem.innerHTML = `
            <a href="${repo.html_url}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)}</a>
            <p>${escapeHtml(repo.description || 'No description')}</p>
            <div class="repo-stats">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🍴 ${repo.forks_count}</span>
                ${repo.language ? `<span>💻 ${escapeHtml(repo.language)}</span>` : ''}
            </div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="small-btn" type="button" data-readme="${escapeHtml(repo.full_name)}">Preview README</button>
                <button class="small-btn" type="button" data-clone="${escapeHtml(repo.clone_url)}">Copy clone</button>
            </div>
        `;
        reposList.appendChild(repoItem);
    });
}

async function loadReposPage() {
    if (!repoState.username || !repoState.hasMore) return;

    loadMoreReposBtn.disabled = true;
    const nextPage = repoState.page + 1;

    try {
        const pageData = await fetchJson(getReposUrl(repoState.username, repoState.sort, nextPage, repoState.perPage));
        const arr = Array.isArray(pageData) ? pageData : [];
        repoState.loaded = repoState.loaded.concat(arr);
        repoState.page = nextPage;
        repoState.hasMore = (arr.length === repoState.perPage);

        renderRepos();
        renderLanguageStats();
    } catch (e) {
        showError(e?.message || 'Failed to load more repositories.');
    } finally {
        loadMoreReposBtn.disabled = !repoState.hasMore;
    }
}

function resetRepos() {
    repoState.page = 1;
    repoState.loaded = [];
    repoState.hasMore = true;
    repoMeta.textContent = '';
    document.getElementById('reposList').innerHTML = '';
    repoQueryInput.value = '';
    repoLanguageInput.value = '';
    minStarsInput.value = '';
    excludeForksCheckbox.checked = false;
    updatedAfterInput.value = '';
}

function getReposUrl(username, sort, page, perPage) {
    const url = new URL(`https://api.github.com/users/${username}/repos`);
    url.searchParams.set('sort', sort);
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    return url.toString();
}

function getFilteredRepos(repos) {
    const q = repoQueryInput.value.trim().toLowerCase();
    const lang = repoLanguageInput.value.trim().toLowerCase();
    const minStars = Number(minStarsInput.value || 0);
    const excludeForks = excludeForksCheckbox.checked;
    const updatedAfter = updatedAfterInput.value ? new Date(updatedAfterInput.value) : null;

    return repos.filter(r => {
        if (q) {
            const hay = `${r.name || ''} ${r.full_name || ''} ${r.description || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (lang && !(r.language || '').toLowerCase().includes(lang)) return false;
        if (minStars > 0 && (r.stargazers_count || 0) < minStars) return false;
        if (excludeForks && r.fork) return false;
        if (updatedAfter) {
            const updatedAt = r.updated_at ? new Date(r.updated_at) : null;
            if (!updatedAt || updatedAt < updatedAfter) return false;
        }
        return true;
    });
}

function renderLanguageStats() {
    const filtered = getFilteredRepos(repoState.loaded);
    const counts = new Map();

    for (const repo of filtered) {
        if (!repo.language) continue;
        counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    }

    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    langChart.innerHTML = '';

    if (entries.length === 0) {
        languagesSection.classList.add('hidden');
        return;
    }

    languagesSection.classList.remove('hidden');
    const max = entries[0][1];

    for (const [language, count] of entries) {
        const row = document.createElement('div');
        row.className = 'lang-row';
        const pct = Math.max(8, Math.round((count / max) * 100));
        row.innerHTML = `
            <div class="label">${escapeHtml(language)} <span style="opacity:.7">(${count})</span></div>
            <div class="bar"><div style="width:${pct}%"></div></div>
        `;
        langChart.appendChild(row);
    }
}

function renderOrgs(orgs) {
    orgsList.innerHTML = '';
    const arr = Array.isArray(orgs) ? orgs : [];
    if (arr.length === 0) {
        orgsSection.classList.add('hidden');
        return;
    }
    orgsSection.classList.remove('hidden');
    for (const org of arr.slice(0, 12)) {
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <img src="${org.avatar_url}" alt="${escapeHtml(org.login)}" />
            <a href="${org.url.replace('api.github.com/orgs', 'github.com')}" target="_blank" rel="noreferrer">${escapeHtml(org.login)}</a>
        `;
        orgsList.appendChild(div);
    }
}

function renderPeopleLists(followers, following) {
    renderPeopleList(followersSection, followersList, followers, 18);
    renderPeopleList(followingSection, followingList, following, 18);
}

function renderPeopleList(sectionEl, listEl, data, limit) {
    listEl.innerHTML = '';
    const arr = Array.isArray(data) ? data : [];
    if (arr.length === 0) {
        sectionEl.classList.add('hidden');
        return;
    }
    sectionEl.classList.remove('hidden');
    for (const person of arr.slice(0, limit)) {
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <img src="${person.avatar_url}" alt="${escapeHtml(person.login)}" />
            <a href="${person.html_url}" target="_blank" rel="noreferrer">${escapeHtml(person.login)}</a>
        `;
        listEl.appendChild(div);
    }
}

function renderGists(gists) {
    gistsList.innerHTML = '';
    const arr = Array.isArray(gists) ? gists : [];
    if (arr.length === 0) {
        gistsSection.classList.add('hidden');
        return;
    }
    gistsSection.classList.remove('hidden');
    for (const gist of arr.slice(0, 10)) {
        const fileNames = gist.files ? Object.keys(gist.files) : [];
        const title = fileNames[0] || gist.id;
        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <a href="${gist.html_url}" target="_blank" rel="noreferrer">${escapeHtml(title)}</a>
            <span class="muted">${gist.public ? 'public' : 'secret'}</span>
        `;
        gistsList.appendChild(div);
    }
}

async function fetchJson(url) {
    const cached = cacheGet(url);
    if (cached) return cached;

    const headers = {
        'Accept': 'application/vnd.github+json'
    };

    const res = await fetch(url, { headers });

    if (!res.ok) {
        if (res.status === 404) throw new Error('User not found! Please check the username.');

        if (res.status === 403) {
            const remaining = res.headers.get('X-RateLimit-Remaining');
            if (remaining === '0') {
                const reset = res.headers.get('X-RateLimit-Reset');
                let when = '';
                if (reset) {
                    const d = new Date(Number(reset) * 1000);
                    if (!Number.isNaN(d.getTime())) {
                        when = ` (resets at ${d.toLocaleTimeString()})`;
                    }
                }

                throw new Error(`GitHub API rate limit hit${when}.`);
            }
        }

        throw new Error(`Request failed (${res.status}). Please try again.`);
    }

    const data = await res.json();
    cacheSet(url, data);
    return data;
}

function setLoading(isLoading) {
    loadingDiv.classList.toggle('hidden', !isLoading);
    searchBtn.disabled = isLoading;
    loadMoreReposBtn.disabled = isLoading || !repoState.hasMore;
}

function clearExtraPanels() {
    languagesSection.classList.add('hidden');
    orgsSection.classList.add('hidden');
    followersSection.classList.add('hidden');
    followingSection.classList.add('hidden');
    gistsSection.classList.add('hidden');
    activitySection.classList.add('hidden');
    insightsEl.classList.add('hidden');
    compareSection.classList.add('hidden');
}

function renderInsights(user) {
    const followers = Number(user.followers || 0);
    const following = Number(user.following || 0);
    const repos = Number(user.public_repos || 0);

    const ratio = following === 0 ? (followers > 0 ? '∞' : '0') : (followers / following).toFixed(2);
    const score = Math.round(Math.min(100, (followers * 0.08) + (repos * 0.5) + (following === 0 ? 10 : 0)));

    insightsEl.classList.remove('hidden');
    insightsEl.innerHTML = `
        <div><b>Insights:</b> Followers/Following ratio: <b>${ratio}</b></div>
        <div>Public repos: <b>${repos}</b> • Quick score: <b>${score}/100</b></div>
        <div class="token-hint">Score is a simple heuristic (not official).</div>
    `;
}

function parseUsernames(input) {
    const cleaned = input.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    const byVs = cleaned.split(/\s+vs\s+/i);
    const byComma = cleaned.split(',');
    let parts = [];
    if (byVs.length === 2) parts = byVs;
    else if (byComma.length === 2) parts = byComma;
    else parts = [cleaned];

    return parts.map(s => s.trim()).filter(Boolean).slice(0, 2);
}

async function renderComparison(u1, u2) {
    try {
        const [a, b] = await Promise.all([
            fetchJson(`https://api.github.com/users/${u1}`),
            fetchJson(`https://api.github.com/users/${u2}`),
        ]);

        compareSection.classList.remove('hidden');
        compareTable.innerHTML = '';

        const rows = [
            ['Name', a.name || a.login, b.name || b.login],
            ['Repos', a.public_repos, b.public_repos],
            ['Followers', a.followers, b.followers],
            ['Following', a.following, b.following],
            ['Created', new Date(a.created_at).toLocaleDateString(), new Date(b.created_at).toLocaleDateString()],
        ];

        for (const [k, v1, v2] of rows) {
            const div = document.createElement('div');
            div.className = 'compare-row';
            div.innerHTML = `
                <div class="k">${escapeHtml(k)}</div>
                <div class="v">${escapeHtml(v1)}</div>
                <div class="v">${escapeHtml(v2)}</div>
            `;
            compareTable.appendChild(div);
        }
    } catch {
        compareSection.classList.add('hidden');
    }
}

function renderActivity(events) {
    activityList.innerHTML = '';
    const arr = Array.isArray(events) ? events : [];
    if (arr.length === 0) {
        activitySection.classList.add('hidden');
        return;
    }
    activitySection.classList.remove('hidden');

    for (const ev of arr.slice(0, 12)) {
        const repoName = ev.repo?.name || '';
        const when = ev.created_at ? new Date(ev.created_at).toLocaleString() : '';
        const type = ev.type || 'Event';
        const link = repoName ? `https://github.com/${repoName}` : '#';

        const div = document.createElement('div');
        div.className = 'mini-item';
        div.innerHTML = `
            <a href="${link}" target="_blank" rel="noreferrer">${escapeHtml(type)}</a>
            <span class="muted">${escapeHtml(repoName)} • ${escapeHtml(when)}</span>
        `;
        activityList.appendChild(div);
    }
}

function hideReadme() {
    readmeSection.classList.add('hidden');
    readmeTitle.textContent = '';
    readmeContent.textContent = '';
}

async function showReadmeFor(repoFullName) {
    if (!repoFullName) return;
    readmeTitle.textContent = repoFullName;
    readmeContent.textContent = 'Loading README…';
    readmeSection.classList.remove('hidden');

    const [owner, repo] = repoFullName.split('/');
    try {
        const data = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/readme`);
        const content = data && data.content ? atob(data.content.replace(/\n/g, '')) : '';
        readmeContent.textContent = content || 'No README content found.';
    } catch (e) {
        readmeContent.textContent = e?.message || 'Failed to load README.';
    }
}

// Hook README preview into repo list via event delegation
document.getElementById('reposList').addEventListener('click', (e) => {
    const el = (e.target instanceof Element) ? e.target : null;
    if (!el) return;

    const cloneBtn = el.closest('[data-clone]');
    if (cloneBtn) {
        const cloneUrl = cloneBtn.getAttribute('data-clone');
        copyToClipboard(`git clone ${cloneUrl}`).then(() => {
            showError('Clone command copied!');
            setTimeout(hideError, 1200);
        });
        return;
    }

    const btn = el.closest('[data-readme]');
    if (!btn) return;
    const full = btn.getAttribute('data-readme');
    showReadmeFor(full);
});

function getHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function addToHistory(username) {
    const norm = username.trim();
    if (!norm) return;
    const history = getHistory();
    const next = [norm, ...history.filter(x => x.toLowerCase() !== norm.toLowerCase())].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function renderHistoryUI() {
    const history = getHistory();

    historyList.innerHTML = '';
    for (const u of history) {
        const opt = document.createElement('option');
        opt.value = u;
        historyList.appendChild(opt);
    }

    historyChips.innerHTML = '';
    if (history.length === 0) {
        historyRow.classList.add('hidden');
        return;
    }

    historyRow.classList.remove('hidden');
    for (const u of history.slice(0, 8)) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = u;
        chip.addEventListener('click', () => {
            usernameInput.value = u;
            searchUser();
        });
        historyChips.appendChild(chip);
    }
}

function updateDeepLink(username) {
    const url = new URL(window.location.href);
    url.searchParams.set('user', username);
    window.history.replaceState({}, '', url.toString());
}

async function copyShareLink() {
    if (!repoState.username) return;
    const url = new URL(window.location.href);
    url.searchParams.set('user', repoState.username);
    await copyToClipboard(url.toString());
    showError('Share link copied!');
    setTimeout(hideError, 1200);
}

async function copyUsername() {
    if (!repoState.username) return;
    await copyToClipboard(repoState.username);
    showError('Username copied!');
    setTimeout(hideError, 1200);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const isLight = saved === 'light';
    document.body.classList.toggle('light', isLight);
    themeToggleBtn.setAttribute('aria-pressed', String(isLight));
    themeToggleBtn.textContent = isLight ? '🌞 Light' : '🌙 Dark';
}

function toggleTheme() {
    const willBeLight = !document.body.classList.contains('light');
    document.body.classList.toggle('light', willBeLight);
    localStorage.setItem(THEME_KEY, willBeLight ? 'light' : 'dark');
    applySavedTheme();
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function cacheGet(url) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        const entry = obj[url];
        if (!entry) return null;
        if ((Date.now() - entry.t) > CACHE_TTL_MS) return null;
        return entry.v;
    } catch {
        return null;
    }
}

function cacheSet(url, value) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[url] = { t: Date.now(), v: value };
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch {
        // ignore quota errors
    }
}

async function downloadCard() {
    try {
        if (!profileDiv || profileDiv.classList.contains('hidden')) return;
        if (!window.html2canvas) {
            showError('Download failed: html2canvas not loaded.');
            return;
        }

        const canvas = await window.html2canvas(profileDiv, {
            backgroundColor: null,
            scale: 2,
        });
        const a = document.createElement('a');
        a.download = `${repoState.username || 'profile'}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    } catch {
        showError('Download failed.');
    }
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
}
