/**
 * NYTE ARCADE - UNIVERSAL CLIENT SCRIPT (script.js)
 * Architecture:
 * - Dual-mode engine:
 *   1. Full PHP & MySQL mode: talks to api/play.php and api/add-game.php, server-rendered.
 *   2. Standalone presentation fallback: works with zero server (double-click index.html or Netlify),
 *      using local storage persistence.
 * - Minimal, quiet luxury aesthetic with human-centered curation.
 * - Sandboxed player with iframe isolation (no allow-same-origin).
 * - Real-time client-side search and dynamic category row generation.
 * - Strict XSS prevention: textContent and DOM APIs for all user content.
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Default Curated Library (Used in standalone / fallback mode)
  // ---------------------------------------------------------------------------
  const DEFAULT_GAMES = [
    {
      id: 1,
      title: '2048 Harmony',
      category: 'Puzzle',
      url: 'https://gabrielecirulli.github.io/2048/',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      description: 'A meditative numerical sequence puzzle. Merge matching values in quiet, rhythmic focus.',
      weight: 120
    },
    {
      id: 2,
      title: 'Tetra Classic',
      category: 'Arcade',
      url: 'https://chvin.github.io/react-tetris/',
      cover: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80',
      description: 'Pure geometric composition. A timeless study in spatial balance and quick reflexes.',
      weight: 110
    },
    {
      id: 3,
      title: 'Tower Equilibrium',
      category: 'Arcade',
      url: 'https://iamkun.github.io/tower_game/',
      cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      description: 'Stack geometric blocks with precise timing to build an ascending minimalist spire.',
      weight: 95
    },
    {
      id: 4,
      title: 'Sky Drift',
      category: 'Action',
      url: 'https://ellisonleao.github.io/clumsy-bird/',
      cover: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      description: 'Gentle rhythmic navigation through open skies and shifting architectural obstacles.',
      weight: 85
    },
    {
      id: 5,
      title: 'Desert Mirage',
      category: 'Action',
      url: 'https://wayou.github.io/t-rex-runner/',
      cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
      description: 'A minimalist monochrome sprint across endless undulating dunes and low horizons.',
      weight: 80
    },
    {
      id: 6,
      title: 'Pattern Field',
      category: 'Puzzle',
      url: 'https://muan.github.io/emoji-minesweeper/',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      description: 'Deduce hidden markers through serene logic and mindful numerical deduction.',
      weight: 70
    },
    {
      id: 7,
      title: 'Labyrinth Circuit',
      category: 'Arcade',
      url: 'https://passer-by.com/pacman/',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      description: 'Navigate glowing pathways and clear energy nodes through an intricate kinetic labyrinth.',
      weight: 65
    },
    {
      id: 8,
      title: 'Pixie Run',
      category: 'Action',
      url: 'https://www.goodboydigital.com/runpixierun/',
      cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      description: 'A vibrant kinetic dash through enchanted ambient forests and celestial flora.',
      weight: 60
    }
  ];

  const CLIENT_STORAGE_KEY = 'nyte_arcade_standalone_v1';

  // ---------------------------------------------------------------------------
  // DOM Elements Cache
  // ---------------------------------------------------------------------------
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const clearSearchAction = document.getElementById('clearSearchAction');
  const noResultsState = document.getElementById('noResultsState');
  const categoriesContainer = document.getElementById('categoriesContainer');
  const collectionOverviewText = document.getElementById('collectionOverviewText');

  // Hero Spotlight Elements
  const heroSection = document.getElementById('heroSection');
  const heroBackdrop = document.getElementById('heroBackdrop');
  const heroTitle = document.getElementById('heroTitle');
  const heroCategory = document.getElementById('heroCategory');
  const heroDesc = document.getElementById('heroDesc');
  const heroPlayBtn = document.getElementById('heroPlayBtn');

  // Player Dialog Elements
  const playerDialog = document.getElementById('playerDialog');
  const playerTitle = document.getElementById('playerTitle');
  const playerCategory = document.getElementById('playerCategory');
  const gameIframe = document.getElementById('gameIframe');
  const iframeLoader = document.getElementById('iframeLoader');
  const closePlayerBtn = document.getElementById('closePlayerBtn');
  const exitDialogFooterBtn = document.getElementById('exitDialogFooterBtn');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');

  // Add Game Dialog Elements
  const addGameDialog = document.getElementById('addGameDialog');
  const openAddGameBtn = document.getElementById('openAddGameBtn');
  const closeAddGameBtn = document.getElementById('closeAddGameBtn');
  const cancelAddGameBtn = document.getElementById('cancelAddGameBtn');
  const addGameForm = document.getElementById('addGameForm');
  const gameNameInput = document.getElementById('gameNameInput');
  const gameCategoryInput = document.getElementById('gameCategoryInput');
  const gameUrlInput = document.getElementById('gameUrlInput');
  const gameCoverInput = document.getElementById('gameCoverInput');
  const gameDescInput = document.getElementById('gameDescInput');
  const formErrorMessage = document.getElementById('formErrorMessage');
  const formSuccessMessage = document.getElementById('formSuccessMessage');
  const categorySuggestions = document.getElementById('categorySuggestions');

  let localGames = [];

  // ---------------------------------------------------------------------------
  // Validation Helpers
  // ---------------------------------------------------------------------------
  function isValidHttpsUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;
    const trimmed = urlString.trim();
    if (!trimmed.startsWith('https://')) return false;
    try {
      const url = new URL(trimmed);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function generateMinimalCover(title) {
    const clean = encodeURIComponent((title || 'TITLE').slice(0, 18).toUpperCase());
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="375" viewBox="0 0 600 375"><rect width="600" height="375" fill="%23110f1e"/><circle cx="300" cy="187" r="110" fill="none" stroke="%2326213d" stroke-width="1"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%23b5afd1" font-family="sans-serif" font-weight="500" font-size="20" letter-spacing="4">${clean}</text></svg>`;
  }

  // ---------------------------------------------------------------------------
  // Standalone Client-side Storage & Renderer (for index.html direct viewing)
  // ---------------------------------------------------------------------------
  function loadStandaloneGames() {
    try {
      const stored = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localGames = parsed;
          return;
        }
      }
    } catch {
      // Fallback
    }
    localGames = JSON.parse(JSON.stringify(DEFAULT_GAMES));
    saveStandaloneGames();
  }

  function saveStandaloneGames() {
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(localGames));
    } catch {}
  }

  function renderStandaloneUI() {
    if (!localGames || localGames.length === 0) return;

    // 1. Spotlight Game (highest weight)
    const sorted = [...localGames].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const spotlight = sorted[0];

    if (heroTitle && spotlight) {
      heroTitle.textContent = spotlight.title;
      if (heroCategory) heroCategory.textContent = spotlight.category;
      if (heroDesc) heroDesc.textContent = spotlight.description || 'A calm and captivating web game.';
      if (heroBackdrop) {
        const cover = spotlight.cover && isValidHttpsUrl(spotlight.cover) ? spotlight.cover : generateMinimalCover(spotlight.title);
        heroBackdrop.style.backgroundImage = `url("${cover}")`;
      }
      if (heroPlayBtn) {
        heroPlayBtn.dataset.id = spotlight.id;
        heroPlayBtn.dataset.title = spotlight.title;
        heroPlayBtn.dataset.category = spotlight.category;
        heroPlayBtn.dataset.url = spotlight.url;
      }
    }

    // 2. Category Rows
    if (!categoriesContainer) return;
    categoriesContainer.textContent = '';

    const remaining = sorted.filter(g => g.id !== spotlight.id);
    const categoryMap = new Map();
    remaining.forEach(g => {
      const cat = g.category.trim();
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat).push(g);
    });

    categoryMap.forEach((gamesList, categoryName) => {
      const row = document.createElement('section');
      row.className = 'category-row';
      row.dataset.categoryRow = categoryName.toLowerCase();
      row.setAttribute('aria-label', `${categoryName} Genre`);

      const header = document.createElement('div');
      header.className = 'category-row-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'category-row-title-wrap';

      const rowTitle = document.createElement('h3');
      rowTitle.className = 'category-row-title';
      rowTitle.textContent = categoryName;

      const countBadge = document.createElement('span');
      countBadge.className = 'category-count-badge';
      countBadge.textContent = `${gamesList.length} ${gamesList.length === 1 ? 'title' : 'titles'}`;

      titleWrap.appendChild(rowTitle);
      titleWrap.appendChild(countBadge);
      header.appendChild(titleWrap);

      const track = document.createElement('div');
      track.className = 'category-games-track';

      gamesList.forEach(g => {
        const card = document.createElement('article');
        card.className = 'game-capsule';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play ${g.title}`);
        card.dataset.id = g.id;
        card.dataset.title = g.title;
        card.dataset.category = g.category;
        card.dataset.url = g.url;
        card.dataset.desc = g.description || '';

        const coverWrap = document.createElement('div');
        coverWrap.className = 'capsule-cover-wrap';

        const img = document.createElement('img');
        img.className = 'capsule-cover-img';
        img.alt = g.title;
        img.loading = 'lazy';
        img.src = g.cover && isValidHttpsUrl(g.cover) ? g.cover : generateMinimalCover(g.title);
        img.onerror = () => { img.src = generateMinimalCover(g.title); };

        const overlay = document.createElement('div');
        overlay.className = 'capsule-overlay';

        const topMeta = document.createElement('div');
        topMeta.className = 'capsule-top-meta';
        const badge = document.createElement('span');
        badge.className = 'badge badge-category';
        badge.textContent = g.category;
        topMeta.appendChild(badge);

        const playAction = document.createElement('div');
        playAction.className = 'capsule-play-action';
        playAction.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>';

        coverWrap.appendChild(img);
        coverWrap.appendChild(overlay);
        coverWrap.appendChild(topMeta);
        coverWrap.appendChild(playAction);

        const details = document.createElement('div');
        details.className = 'capsule-details';

        const titleEl = document.createElement('h4');
        titleEl.className = 'capsule-title';
        titleEl.textContent = g.title;

        const descEl = document.createElement('p');
        descEl.className = 'capsule-desc';
        descEl.textContent = g.description || 'Thoughtful browser game. Click to launch inside quiet sandboxed player.';

        details.appendChild(titleEl);
        details.appendChild(descEl);

        card.appendChild(coverWrap);
        card.appendChild(details);
        track.appendChild(card);
      });

      row.appendChild(header);
      row.appendChild(track);
      categoriesContainer.appendChild(row);
    });

    if (collectionOverviewText) {
      collectionOverviewText.textContent = `${localGames.length} curated experiences across ${categoryMap.size} genres`;
    }

    if (categorySuggestions) {
      categorySuggestions.textContent = '';
      const distinct = new Set(localGames.map(g => g.category));
      distinct.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        categorySuggestions.appendChild(opt);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Player Controller
  // ---------------------------------------------------------------------------
  function launchGame(gameData) {
    if (!gameData || !gameData.url) return;

    // 1. Notify PHP backend to increment engagement weight in MySQL
    if (gameData.id) {
      recordPlayInBackend(gameData.id);
    }

    // 2. Set safe modal headers
    playerTitle.textContent = gameData.title || 'Untitled Experience';
    playerCategory.textContent = gameData.category || 'Arcade';

    // 3. Load game into sandboxed iframe
    iframeLoader.classList.remove('hidden');
    gameIframe.src = gameData.url;

    gameIframe.onload = () => {
      iframeLoader.classList.add('hidden');
    };

    // 4. Open modal
    playerDialog.showModal();
  }

  function closePlayer() {
    gameIframe.src = 'about:blank';
    playerDialog.close();
    playerDialog.classList.remove('is-fullscreen');
  }

  function recordPlayInBackend(gameId) {
    // Ping PHP play endpoint
    fetch('api/play.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ id: gameId })
    })
    .catch(() => {
      // In standalone fallback mode: update local weight
      const found = localGames.find(g => g.id == gameId);
      if (found) {
        found.weight = (found.weight || 0) + 1;
        saveStandaloneGames();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Card & Hero Click Listeners
  // ---------------------------------------------------------------------------
  function setupGameTriggers() {
    if (heroPlayBtn) {
      heroPlayBtn.addEventListener('click', () => {
        const gameData = {
          id: heroPlayBtn.dataset.id,
          title: heroPlayBtn.dataset.title || heroTitle.textContent,
          category: heroPlayBtn.dataset.category || (heroCategory ? heroCategory.textContent : 'Arcade'),
          url: heroPlayBtn.dataset.url
        };
        launchGame(gameData);
      });
    }

    document.addEventListener('click', (e) => {
      const capsule = e.target.closest('.game-capsule');
      if (capsule) {
        const gameData = {
          id: capsule.dataset.id,
          title: capsule.dataset.title,
          category: capsule.dataset.category,
          url: capsule.dataset.url,
          desc: capsule.dataset.desc
        };
        launchGame(gameData);
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.classList.contains('game-capsule')) {
        e.preventDefault();
        document.activeElement.click();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Search Filtering
  // ---------------------------------------------------------------------------
  function filterGames(query) {
    const term = (query || '').toLowerCase().trim();
    if (clearSearchBtn) clearSearchBtn.hidden = term.length === 0;

    const rows = document.querySelectorAll('.category-row');
    let totalVisible = 0;

    rows.forEach(row => {
      const cards = row.querySelectorAll('.game-capsule');
      let rowVisible = 0;

      cards.forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        const category = (card.dataset.category || '').toLowerCase();
        const desc = (card.dataset.desc || '').toLowerCase();

        const matches = !term || title.includes(term) || category.includes(term) || desc.includes(term);
        card.style.display = matches ? '' : 'none';
        if (matches) {
          rowVisible++;
          totalVisible++;
        }
      });

      row.style.display = rowVisible > 0 ? '' : 'none';
    });

    if (noResultsState) {
      noResultsState.hidden = (totalVisible > 0 || !term);
    }
  }

  function resetSearch() {
    if (searchInput) searchInput.value = '';
    filterGames('');
  }

  // ---------------------------------------------------------------------------
  // Add Game Form Submission
  // ---------------------------------------------------------------------------
  function openAddModal() {
    formErrorMessage.hidden = true;
    formSuccessMessage.hidden = true;
    addGameForm.reset();
    addGameDialog.showModal();
    if (gameNameInput) gameNameInput.focus();
  }

  function closeAddModal() {
    addGameDialog.close();
  }

  function showFormError(msg) {
    formErrorMessage.textContent = msg;
    formErrorMessage.hidden = false;
  }

  function showFormSuccess(msg) {
    formSuccessMessage.textContent = msg;
    formSuccessMessage.hidden = false;
  }

  function handleAddGameSubmit(e) {
    e.preventDefault();
    formErrorMessage.hidden = true;
    formSuccessMessage.hidden = true;

    const title = gameNameInput.value.trim();
    let category = gameCategoryInput.value.trim();
    const url = gameUrlInput.value.trim();
    const cover = gameCoverInput.value.trim();
    const description = gameDescInput.value.trim();

    // 1. Client-side Validation
    if (!title || title.length < 2) {
      showFormError('Please enter a title (minimum 2 characters).');
      gameNameInput.focus();
      return;
    }

    if (!category || category.length < 2) {
      showFormError('Please specify a genre or category.');
      gameCategoryInput.focus();
      return;
    }
    category = category.charAt(0).toUpperCase() + category.slice(1);

    if (!isValidHttpsUrl(url)) {
      showFormError('Security Requirement: URL must be valid and begin strictly with https://');
      gameUrlInput.focus();
      return;
    }

    if (cover && !isValidHttpsUrl(cover)) {
      showFormError('Cover image link must begin with https:// or remain empty.');
      gameCoverInput.focus();
      return;
    }

    const payload = {
      name: title,
      category: category,
      url: url,
      cover: cover,
      description: description
    };

    // 2. Attempt PHP backend submission
    fetch('api/add-game.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit game to database.');
      }
      return data;
    })
    .then((data) => {
      showFormSuccess(data.message || `"${title}" was archived under ${category}.`);
      setTimeout(() => {
        closeAddModal();
        window.location.reload();
      }, 700);
    })
    .catch(() => {
      // Standalone Fallback: Save to localStorage and re-render
      const newGame = {
        id: Date.now(),
        title: title,
        category: category,
        url: url,
        cover: cover,
        description: description,
        weight: 50
      };
      localGames.unshift(newGame);
      saveStandaloneGames();
      showFormSuccess(`"${title}" was archived under ${category}.`);
      setTimeout(() => {
        closeAddModal();
        if (categoriesContainer && categoriesContainer.children.length === 0) {
          renderStandaloneUI();
        } else {
          window.location.reload();
        }
      }, 700);
    });
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    if (closePlayerBtn) closePlayerBtn.addEventListener('click', closePlayer);
    if (exitDialogFooterBtn) exitDialogFooterBtn.addEventListener('click', closePlayer);

    if (fullscreenToggleBtn) {
      fullscreenToggleBtn.addEventListener('click', () => {
        playerDialog.classList.toggle('is-fullscreen');
      });
    }

    if (playerDialog) {
      playerDialog.addEventListener('click', (e) => {
        if (e.target === playerDialog) {
          closePlayer();
        }
      });

      playerDialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        closePlayer();
      });
    }

    if (openAddGameBtn) openAddGameBtn.addEventListener('click', openAddModal);
    if (closeAddGameBtn) closeAddGameBtn.addEventListener('click', closeAddModal);
    if (cancelAddGameBtn) cancelAddGameBtn.addEventListener('click', closeAddModal);

    if (addGameDialog) {
      addGameDialog.addEventListener('click', (e) => {
        if (e.target === addGameDialog) {
          closeAddModal();
        }
      });
    }

    if (addGameForm) {
      addGameForm.addEventListener('submit', handleAddGameSubmit);
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => filterGames(e.target.value));
    }
    if (clearSearchBtn) clearSearchBtn.addEventListener('click', resetSearch);
    if (clearSearchAction) clearSearchAction.addEventListener('click', resetSearch);
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  function init() {
    // If categories container is empty (static HTML file opened directly), render from local catalog!
    if (categoriesContainer && categoriesContainer.children.length === 0) {
      loadStandaloneGames();
      renderStandaloneUI();
    }
    setupGameTriggers();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
