/**
 * NYTE ARCADE - CORE ENGINE (script.js)
 * Architecture:
 * - Minimal, quiet luxury aesthetic with human-centered curation.
 * - Dynamic spotlight: the most engaged title commands the hero canvas.
 * - Categorized horizontal rows with automatic new row generation.
 * - Zero artificial metrics: no simulated player counts, no public play counters.
 * - Strict security: textContent injection (XSS-proof), HTTPS validation,
 *   and sandboxed iframe player (no allow-same-origin).
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Default Curated Library
  // ---------------------------------------------------------------------------
  const DEFAULT_GAMES = [
    {
      id: 'game-2048',
      name: '2048 Harmony',
      category: 'Puzzle',
      url: 'https://gabrielecirulli.github.io/2048/',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      description: 'A meditative numerical sequence puzzle. Merge matching values in quiet, rhythmic focus.',
      weight: 120
    },
    {
      id: 'game-tetris-retro',
      name: 'Tetra Classic',
      category: 'Arcade',
      url: 'https://chvin.github.io/react-tetris/',
      cover: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80',
      description: 'Pure geometric composition. A timeless study in spatial balance and quick reflexes.',
      weight: 110
    },
    {
      id: 'game-tower',
      name: 'Tower Equilibrium',
      category: 'Arcade',
      url: 'https://iamkun.github.io/tower_game/',
      cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      description: 'Stack geometric blocks with precise timing to build an ascending minimalist spire.',
      weight: 95
    },
    {
      id: 'game-clumsy-bird',
      name: 'Sky Drift',
      category: 'Action',
      url: 'https://ellisonleao.github.io/clumsy-bird/',
      cover: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      description: 'Gentle rhythmic navigation through open skies and shifting architectural obstacles.',
      weight: 85
    },
    {
      id: 'game-dino',
      name: 'Desert Mirage',
      category: 'Action',
      url: 'https://wayou.github.io/t-rex-runner/',
      cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
      description: 'A minimalist monochrome sprint across endless undulating dunes and low horizons.',
      weight: 80
    },
    {
      id: 'game-minesweeper',
      name: 'Pattern Field',
      category: 'Puzzle',
      url: 'https://muan.github.io/emoji-minesweeper/',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      description: 'Deduce hidden markers through serene logic and mindful numerical deduction.',
      weight: 70
    },
    {
      id: 'game-pacman',
      name: 'Labyrinth Circuit',
      category: 'Arcade',
      url: 'https://passer-by.com/pacman/',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      description: 'Navigate glowing pathways and clear energy nodes through an intricate kinetic labyrinth.',
      weight: 65
    },
    {
      id: 'game-pixie',
      name: 'Pixie Run',
      category: 'Action',
      url: 'https://www.goodboydigital.com/runpixierun/',
      cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      description: 'A vibrant kinetic dash through enchanted ambient forests and celestial flora.',
      weight: 60
    }
  ];

  const STORAGE_KEY = 'nyte_arcade_playable_v3';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let games = [];
  let currentActiveGame = null;
  let activeSearchTerm = '';

  // DOM Elements
  const heroBackdrop = document.getElementById('heroBackdrop');
  const heroTitle = document.getElementById('heroTitle');
  const heroCategory = document.getElementById('heroCategory');
  const heroDesc = document.getElementById('heroDesc');
  const heroPlayBtn = document.getElementById('heroPlayBtn');

  const categoriesContainer = document.getElementById('categoriesContainer');
  const collectionOverviewText = document.getElementById('collectionOverviewText');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const noResultsState = document.getElementById('noResultsState');
  const clearSearchAction = document.getElementById('clearSearchAction');

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
  const resetDataBtn = document.getElementById('resetDataBtn');

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------
  function loadGames() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          games = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Unable to load from storage; falling back to curated defaults:', err);
    }
    games = JSON.parse(JSON.stringify(DEFAULT_GAMES));
    saveGames();
  }

  function saveGames() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (err) {
      console.error('Storage save error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // Business Logic
  // ---------------------------------------------------------------------------
  function getSpotlightGame() {
    if (!games || games.length === 0) return null;
    // Highest engagement weight takes spotlight
    const sorted = [...games].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    return sorted[0];
  }

  function updateOverviewStats() {
    if (collectionOverviewText) {
      const categories = new Set(games.map(g => g.category.trim()));
      collectionOverviewText.textContent = `${games.length} curated experiences across ${categories.size} genres`;
    }
  }

  function updateCategorySuggestions() {
    if (!categorySuggestions) return;
    categorySuggestions.textContent = '';
    const categories = new Set(games.map(g => g.category.trim()));
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      categorySuggestions.appendChild(opt);
    });
  }

  // ---------------------------------------------------------------------------
  // Rendering (Strict textContent - Zero innerHTML for user data)
  // ---------------------------------------------------------------------------
  function renderAll() {
    const spotlightGame = getSpotlightGame();
    renderHero(spotlightGame);
    renderCategories(spotlightGame);
    updateOverviewStats();
    updateCategorySuggestions();
  }

  function renderHero(game) {
    if (!game) {
      heroTitle.textContent = 'Archive Empty';
      heroCategory.textContent = 'General';
      heroDesc.textContent = 'Submit an experience to initiate the curated catalog.';
      heroBackdrop.style.backgroundImage = 'none';
      return;
    }

    // Safe textContent assignment
    heroTitle.textContent = game.name;
    heroCategory.textContent = game.category;
    heroDesc.textContent = game.description || 'A serene browser experience, rendered cleanly in isolated stillness.';

    // Cover
    const coverUrl = game.cover && isValidHttpsUrl(game.cover) ? game.cover : generateMinimalCover(game.name);
    heroBackdrop.style.backgroundImage = `url("${coverUrl}")`;

    heroPlayBtn.onclick = () => launchGame(game);
  }

  function renderCategories(spotlightGame) {
    categoriesContainer.textContent = ''; // safe clear

    let filtered = games;
    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
      filtered = games.filter(g =>
        g.name.toLowerCase().includes(term) ||
        g.category.toLowerCase().includes(term) ||
        (g.description && g.description.toLowerCase().includes(term))
      );
    }

    if (filtered.length === 0) {
      noResultsState.hidden = false;
      return;
    }
    noResultsState.hidden = true;

    // Separate rows below spotlight
    const rowGames = activeSearchTerm ? filtered : filtered.filter(g => !spotlightGame || g.id !== spotlightGame.id);

    const categoryMap = new Map();
    rowGames.forEach(game => {
      const cat = game.category.trim();
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat).push(game);
    });

    if (categoryMap.size === 0 && !activeSearchTerm) {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'text-dim';
      emptyNote.style.textAlign = 'center';
      emptyNote.textContent = 'Submit more titles to cultivate distinct category rows.';
      categoriesContainer.appendChild(emptyNote);
      return;
    }

    categoryMap.forEach((gamesInCat, categoryName) => {
      const row = createCategoryRow(categoryName, gamesInCat);
      categoriesContainer.appendChild(row);
    });
  }

  function createCategoryRow(categoryName, gamesList) {
    const rowSection = document.createElement('section');
    rowSection.className = 'category-row';
    rowSection.setAttribute('aria-label', `${categoryName} Genre`);

    // Row Header
    const rowHeader = document.createElement('div');
    rowHeader.className = 'category-row-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'category-row-title-wrap';

    const rowTitle = document.createElement('h3');
    rowTitle.className = 'category-row-title';
    rowTitle.textContent = categoryName; // SAFE textContent

    const countBadge = document.createElement('span');
    countBadge.className = 'category-count-badge';
    countBadge.textContent = `${gamesList.length} ${gamesList.length === 1 ? 'title' : 'titles'}`;

    titleWrap.appendChild(rowTitle);
    titleWrap.appendChild(countBadge);
    rowHeader.appendChild(titleWrap);

    // Track for capsules
    const track = document.createElement('div');
    track.className = 'category-games-track';

    gamesList.forEach(game => {
      const capsule = createGameCapsule(game);
      track.appendChild(capsule);
    });

    rowSection.appendChild(rowHeader);
    rowSection.appendChild(track);
    return rowSection;
  }

  function createGameCapsule(game) {
    const card = document.createElement('article');
    card.className = 'game-capsule';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Play ${game.name}`);

    // Cover
    const coverWrap = document.createElement('div');
    coverWrap.className = 'capsule-cover-wrap';

    const coverImg = document.createElement('img');
    coverImg.className = 'capsule-cover-img';
    coverImg.alt = game.name;
    coverImg.loading = 'lazy';

    if (game.cover && isValidHttpsUrl(game.cover)) {
      coverImg.src = game.cover;
      coverImg.onerror = () => {
        coverImg.src = generateMinimalCover(game.name);
      };
    } else {
      coverImg.src = generateMinimalCover(game.name);
    }

    const overlay = document.createElement('div');
    overlay.className = 'capsule-overlay';

    // Top Meta
    const topMeta = document.createElement('div');
    topMeta.className = 'capsule-top-meta';

    const catBadge = document.createElement('span');
    catBadge.className = 'badge badge-category';
    catBadge.textContent = game.category; // SAFE textContent

    topMeta.appendChild(catBadge);

    // Hover Play Action
    const playAction = document.createElement('div');
    playAction.className = 'capsule-play-action';
    playAction.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="6 4 20 12 6 20 6 4"></polygon>
      </svg>
    `;

    coverWrap.appendChild(coverImg);
    coverWrap.appendChild(overlay);
    coverWrap.appendChild(topMeta);
    coverWrap.appendChild(playAction);

    // Details
    const details = document.createElement('div');
    details.className = 'capsule-details';

    const titleEl = document.createElement('h4');
    titleEl.className = 'capsule-title';
    titleEl.textContent = game.name; // SAFE textContent

    const descEl = document.createElement('p');
    descEl.className = 'capsule-desc';
    descEl.textContent = game.description || 'Thoughtful browser game. Click to launch inside quiet sandboxed player.'; // SAFE textContent

    details.appendChild(titleEl);
    details.appendChild(descEl);

    card.appendChild(coverWrap);
    card.appendChild(details);

    const triggerPlay = () => launchGame(game);
    card.addEventListener('click', triggerPlay);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPlay();
      }
    });

    return card;
  }

  /**
   * Generates a quiet, understated procedural SVG cover.
   */
  function generateMinimalCover(title) {
    const clean = encodeURIComponent((title || 'TITLE').slice(0, 18).toUpperCase());
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="375" viewBox="0 0 600 375"><rect width="600" height="375" fill="%23110f1e"/><circle cx="300" cy="187" r="110" fill="none" stroke="%2326213d" stroke-width="1"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%23b5afd1" font-family="sans-serif" font-weight="500" font-size="20" letter-spacing="4">${clean}</text></svg>`;
  }

  // ---------------------------------------------------------------------------
  // Player Controller
  // ---------------------------------------------------------------------------
  function launchGame(game) {
    currentActiveGame = game;

    // Elevate engagement weight so spotlight can adapt naturally
    game.weight = (game.weight || 0) + 1;
    saveGames();

    // Set modal headers
    playerTitle.textContent = game.name;
    playerCategory.textContent = game.category;

    // Load iframe
    iframeLoader.classList.remove('hidden');
    gameIframe.src = game.url;

    gameIframe.onload = () => {
      iframeLoader.classList.add('hidden');
    };

    playerDialog.showModal();
    renderAll();
  }

  function closePlayer() {
    gameIframe.src = 'about:blank';
    playerDialog.close();
    playerDialog.classList.remove('is-fullscreen');
    currentActiveGame = null;
  }

  // ---------------------------------------------------------------------------
  // Add Game Dialog & Validation
  // ---------------------------------------------------------------------------
  function openAddModal() {
    formErrorMessage.hidden = true;
    formSuccessMessage.hidden = true;
    addGameForm.reset();
    addGameDialog.showModal();
    gameNameInput.focus();
  }

  function closeAddModal() {
    addGameDialog.close();
  }

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

  function handleAddGameSubmit(e) {
    e.preventDefault();
    formErrorMessage.hidden = true;
    formSuccessMessage.hidden = true;

    const name = gameNameInput.value.trim();
    let category = gameCategoryInput.value.trim();
    const url = gameUrlInput.value.trim();
    const cover = gameCoverInput.value.trim();
    const description = gameDescInput.value.trim();

    // Validation
    if (!name || name.length < 2) {
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
      showFormError('Security Requirement: URL must be valid and begin with https://');
      gameUrlInput.focus();
      return;
    }

    if (cover && !isValidHttpsUrl(cover)) {
      showFormError('Cover image link must begin with https:// or remain empty.');
      gameCoverInput.focus();
      return;
    }

    const newGame = {
      id: 'game-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name,
      category: category,
      url: url,
      cover: cover || '',
      description: description,
      weight: 50
    };

    games.unshift(newGame);
    saveGames();

    showFormSuccess(`"${name}" was archived under ${category}.`);
    setTimeout(() => {
      closeAddModal();
      renderAll();
      document.getElementById('collectionSection').scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }

  function showFormError(msg) {
    formErrorMessage.textContent = msg;
    formErrorMessage.hidden = false;
  }

  function showFormSuccess(msg) {
    formSuccessMessage.textContent = msg;
    formSuccessMessage.hidden = false;
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Player Dialog
    closePlayerBtn.addEventListener('click', closePlayer);
    exitDialogFooterBtn.addEventListener('click', closePlayer);

    fullscreenToggleBtn.addEventListener('click', () => {
      playerDialog.classList.toggle('is-fullscreen');
    });

    playerDialog.addEventListener('click', (e) => {
      if (e.target === playerDialog) {
        closePlayer();
      }
    });

    playerDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closePlayer();
    });

    // Add Game Dialog
    openAddGameBtn.addEventListener('click', openAddModal);
    closeAddGameBtn.addEventListener('click', closeAddModal);
    cancelAddGameBtn.addEventListener('click', closeAddModal);
    addGameDialog.addEventListener('click', (e) => {
      if (e.target === addGameDialog) {
        closeAddModal();
      }
    });
    addGameForm.addEventListener('submit', handleAddGameSubmit);

    // Search
    searchInput.addEventListener('input', (e) => {
      activeSearchTerm = e.target.value.trim();
      clearSearchBtn.hidden = activeSearchTerm.length === 0;
      renderAll();
    });

    const resetSearch = () => {
      searchInput.value = '';
      activeSearchTerm = '';
      clearSearchBtn.hidden = true;
      renderAll();
    };

    clearSearchBtn.addEventListener('click', resetSearch);
    clearSearchAction.addEventListener('click', resetSearch);

    // Restore Defaults
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Restore Nyte Arcade to the default curated selection?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadGames();
        renderAll();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    loadGames();
    renderAll();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
