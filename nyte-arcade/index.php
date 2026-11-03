<?php
/**
 * Nyte Arcade - Main Portal (PHP & MySQL)
 * Minimal, quiet luxury aesthetic with human-centered curation.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$allGames = [];
$dbError = null;

if ($pdo) {
    try {
        $stmt = $pdo->query('SELECT * FROM `games` ORDER BY `engagement_weight` DESC, `id` DESC');
        $allGames = $stmt->fetchAll();
    } catch (PDOException $e) {
        $dbError = 'Could not load games: ' . $e->getMessage();
    }
} else {
    $dbError = 'Database connection could not be established. Please check your MySQL settings in config.php or visit setup.php.';
}

// Flash notifications
$flashSuccess = $_SESSION['flash_success'] ?? null;
$flashError = $_SESSION['flash_error'] ?? null;
unset($_SESSION['flash_success'], $_SESSION['flash_error']);

// Determine Spotlight (Highest Engagement Weight)
$spotlightGame = !empty($allGames) ? $allGames[0] : null;

// Group remaining games by category
$categories = [];
$distinctCategories = [];

foreach ($allGames as $game) {
    $cat = trim($game['category']);
    if (!in_array($cat, $distinctCategories, true)) {
        $distinctCategories[] = $cat;
    }
    // Spotlight is featured at the top; other games populate category rows below
    if ($spotlightGame && $game['id'] === $spotlightGame['id']) {
        continue;
    }
    $categories[$cat][] = $game;
}

// Helper for minimal procedural cover fallback
function getCoverUrl(?string $coverUrl, string $title): string {
    if (!empty($coverUrl) && isValidHttpsUrl($coverUrl)) {
        return $coverUrl;
    }
    $clean = rawurlencode(mb_strtoupper(mb_substr($title, 0, 18)));
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='375' viewBox='0 0 600 375'><rect width='600' height='375' fill='%23110f1e'/><circle cx='300' cy='187' r='110' fill='none' stroke='%2326213d' stroke-width='1'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='%23b5afd1' font-family='sans-serif' font-weight='500' font-size='20' letter-spacing='4'>{$clean}</text></svg>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Nyte Arcade — A curated gallery of thoughtful browser experiences powered by PHP & MySQL. Minimalist, serene, and securely sandboxed.">
  <title><?= h(APP_NAME) ?> — <?= h(APP_TAGLINE) ?></title>
  
  <!-- Single Primary Font: Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>✧</text></svg>">
</head>
<body>
  <!-- Ambient atmosphere -->
  <div class="ambient-glow orb-slate"></div>
  <div class="ambient-glow orb-amethyst"></div>

  <!-- Header -->
  <header class="site-header">
    <div class="nav-container">
      <a href="index.php" class="brand-logo" aria-label="Nyte Arcade Home">
        <span class="logo-mark">✧</span>
        <span class="logo-text">NYTE <span class="logo-light">ARCADE</span></span>
      </a>

      <!-- Search Bar -->
      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="searchInput" placeholder="Search curated library..." autocomplete="off">
        <button id="clearSearchBtn" class="clear-btn" aria-label="Clear search" hidden>&times;</button>
      </div>

      <!-- Header Action -->
      <div class="header-actions">
        <button id="openAddGameBtn" class="btn btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Submit Game</span>
        </button>
      </div>
    </div>
  </header>

  <?php if ($flashSuccess): ?>
    <div class="flash-banner flash-success">
      <span><?= h($flashSuccess) ?></span>
      <button class="flash-close" onclick="this.parentElement.remove()">&times;</button>
    </div>
  <?php endif; ?>

  <?php if ($flashError): ?>
    <div class="flash-banner flash-error">
      <span><?= h($flashError) ?></span>
      <button class="flash-close" onclick="this.parentElement.remove()">&times;</button>
    </div>
  <?php endif; ?>

  <?php if ($dbError): ?>
    <div class="flash-banner flash-warning">
      <span><?= h($dbError) ?> — <a href="setup.php" style="text-decoration: underline; font-weight: 600;">Launch Setup Utility</a></span>
    </div>
  <?php endif; ?>

  <!-- Fullscreen Hero (Spotlight Game) -->
  <section id="heroSection" class="hero-section" aria-label="Featured Spotlight">
    <?php if ($spotlightGame): ?>
      <?php $spotlightCover = getCoverUrl($spotlightGame['cover_url'], $spotlightGame['title']); ?>
      <div class="hero-backdrop" id="heroBackdrop" style="background-image: url('<?= h($spotlightCover) ?>');"></div>
      <div class="hero-overlay"></div>
      
      <div class="hero-content">
        <div class="hero-meta-badges">
          <span class="badge badge-spotlight">Spotlight</span>
          <span class="badge badge-category" id="heroCategory"><?= h($spotlightGame['category']) ?></span>
        </div>

        <h1 class="hero-title" id="heroTitle"><?= h($spotlightGame['title']) ?></h1>
        <p class="hero-desc" id="heroDesc">
          <?= h($spotlightGame['description'] ?: 'A calm and captivating web game, curated for pure in-browser play without setup or friction.') ?>
        </p>

        <div class="hero-cta-group">
          <button 
            id="heroPlayBtn" 
            class="btn btn-hero-play"
            data-id="<?= (int)$spotlightGame['id'] ?>"
            data-title="<?= h($spotlightGame['title']) ?>"
            data-category="<?= h($spotlightGame['category']) ?>"
            data-url="<?= h($spotlightGame['url']) ?>">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4"></polygon>
            </svg>
            <span>Play Experience</span>
          </button>
          <a href="#collectionSection" class="btn btn-hero-secondary">
            <span>Explore Collection</span>
          </a>
        </div>
      </div>
    <?php else: ?>
      <div class="hero-backdrop" id="heroBackdrop"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-meta-badges">
          <span class="badge badge-spotlight">Nyte Arcade</span>
        </div>
        <h1 class="hero-title">Archive Empty</h1>
        <p class="hero-desc">Connect MySQL and initialize the database to cultivate the curated arcade collection.</p>
        <div class="hero-cta-group">
          <a href="setup.php" class="btn btn-primary">Initialize Database</a>
        </div>
      </div>
    <?php endif; ?>

    <!-- Subtle Scroll cue -->
    <a href="#collectionSection" class="scroll-cue" aria-label="Scroll to collection">
      <div class="scroll-indicator"></div>
    </a>
  </section>

  <!-- Categorized Game Collection Section -->
  <main id="collectionSection" class="collection-section">
    <div class="section-container">
      <div class="section-top-bar">
        <div>
          <span class="section-kicker">Curated Vault</span>
          <h2 class="section-title">The Collection</h2>
        </div>
        <div class="global-info-pill">
          <span id="collectionOverviewText">
            <?= count($allGames) ?> curated <?= count($allGames) === 1 ? 'experience' : 'experiences' ?> across <?= count($distinctCategories) ?> <?= count($distinctCategories) === 1 ? 'genre' : 'genres' ?>
          </span>
        </div>
      </div>

      <!-- Category rows -->
      <div id="categoriesContainer" class="categories-container">
        <?php if (empty($categories) && count($allGames) <= 1): ?>
          <p class="text-dim" style="text-align: center; padding: 2rem 0;">
            Submit more titles to cultivate distinct category rows below the spotlight.
          </p>
        <?php else: ?>
          <?php foreach ($categories as $catName => $catGames): ?>
            <section class="category-row" data-category-row="<?= h(strtolower($catName)) ?>" aria-label="<?= h($catName) ?> Genre">
              <div class="category-row-header">
                <div class="category-row-title-wrap">
                  <h3 class="category-row-title"><?= h($catName) ?></h3>
                  <span class="category-count-badge"><?= count($catGames) ?> <?= count($catGames) === 1 ? 'title' : 'titles' ?></span>
                </div>
              </div>

              <!-- Track for game capsules with CSS :has() hover focus -->
              <div class="category-games-track">
                <?php foreach ($catGames as $game): ?>
                  <?php $cover = getCoverUrl($game['cover_url'], $game['title']); ?>
                  <article 
                    class="game-capsule" 
                    tabindex="0" 
                    role="button" 
                    aria-label="Play <?= h($game['title']) ?>"
                    data-id="<?= (int)$game['id'] ?>"
                    data-title="<?= h($game['title']) ?>"
                    data-category="<?= h($game['category']) ?>"
                    data-url="<?= h($game['url']) ?>"
                    data-desc="<?= h($game['description'] ?? '') ?>">
                    
                    <div class="capsule-cover-wrap">
                      <img 
                        class="capsule-cover-img" 
                        src="<?= h($cover) ?>" 
                        alt="<?= h($game['title']) ?>" 
                        loading="lazy">
                      <div class="capsule-overlay"></div>
                      <div class="capsule-top-meta">
                        <span class="badge badge-category"><?= h($game['category']) ?></span>
                      </div>
                      <div class="capsule-play-action">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 4 20 12 6 20 6 4"></polygon>
                        </svg>
                      </div>
                    </div>

                    <div class="capsule-details">
                      <h4 class="capsule-title"><?= h($game['title']) ?></h4>
                      <p class="capsule-desc">
                        <?= h($game['description'] ?: 'Thoughtful browser game. Click to launch inside quiet sandboxed player.') ?>
                      </p>
                    </div>
                  </article>
                <?php endforeach; ?>
              </div>
            </section>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>

      <!-- Empty Search Fallback State -->
      <div id="noResultsState" class="empty-state" hidden>
        <div class="empty-icon">✧</div>
        <h3>No titles found</h3>
        <p>No experiences match your search query. Try a different term or archive a new title.</p>
        <button id="clearSearchAction" class="btn btn-secondary">Clear Search</button>
      </div>
    </div>
  </main>

  <!-- Sandboxed Game Player Dialog -->
  <dialog id="playerDialog" class="player-dialog">
    <div class="dialog-card">
      <div class="dialog-header">
        <div class="dialog-info">
          <span class="badge badge-category" id="playerCategory">Category</span>
          <h2 id="playerTitle" class="dialog-title">Game Title</h2>
        </div>

        <div class="dialog-controls">
          <button id="fullscreenToggleBtn" class="icon-btn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
          <button id="closePlayerBtn" class="icon-btn icon-btn-close" title="Close Game" aria-label="Close Game">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="iframe-container" id="iframeWrapper">
        <div class="iframe-loader" id="iframeLoader">
          <div class="spinner"></div>
          <p>Loading isolated environment...</p>
        </div>
        <!-- 
          SECURITY DESIGN:
          - sandbox deliberately excludes allow-same-origin.
          - Untrusted game pages cannot read parent cookies, session, or local storage.
        -->
        <iframe 
          id="gameIframe" 
          title="Nyte Arcade Sandboxed Game Player" 
          sandbox="allow-scripts allow-forms allow-pointer-lock allow-popups"
          allow="autoplay; fullscreen; gamepad"
          loading="lazy">
        </iframe>
      </div>

      <div class="dialog-footer">
        <span class="security-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Isolated sandbox runtime • PHP & MySQL Backend
        </span>
        <button id="exitDialogFooterBtn" class="btn btn-secondary btn-sm">Close</button>
      </div>
    </div>
  </dialog>

  <!-- Submit / Add Game Dialog -->
  <dialog id="addGameDialog" class="add-game-dialog">
    <div class="dialog-card">
      <div class="dialog-header">
        <div>
          <h2 class="dialog-title">Submit Experience</h2>
          <p class="dialog-subtitle">Introduce a web title into the MySQL archive.</p>
        </div>
        <button id="closeAddGameBtn" class="icon-btn" aria-label="Close modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form id="addGameForm" action="api/add-game.php" method="POST" class="add-game-form" novalidate>
        <div class="form-group">
          <label for="gameNameInput">Title <span class="required">*</span></label>
          <input 
            type="text" 
            id="gameNameInput" 
            name="name" 
            placeholder="e.g. Echoes of the Horizon" 
            maxlength="100" 
            required>
        </div>

        <div class="form-group">
          <label for="gameCategoryInput">Genre / Category <span class="required">*</span></label>
          <input 
            type="text" 
            id="gameCategoryInput" 
            name="category" 
            placeholder="e.g. Puzzle, Minimal, Arcade" 
            list="categorySuggestions" 
            maxlength="50" 
            required>
          <datalist id="categorySuggestions">
            <?php foreach ($distinctCategories as $cat): ?>
              <option value="<?= h($cat) ?>"></option>
            <?php endforeach; ?>
          </datalist>
          <small class="form-hint">Introducing a new category name automatically initiates a new row.</small>
        </div>

        <div class="form-group">
          <label for="gameUrlInput">Experience URL (HTTPS) <span class="required">*</span></label>
          <input 
            type="url" 
            id="gameUrlInput" 
            name="url" 
            placeholder="https://example.com/experience/" 
            pattern="https://.*" 
            required>
          <small class="form-hint">For security, experiences must be served over <code>https://</code>.</small>
        </div>

        <div class="form-group">
          <label for="gameCoverInput">Cover Image URL (HTTPS, optional)</label>
          <input 
            type="url" 
            id="gameCoverInput" 
            name="cover" 
            placeholder="https://images.unsplash.com/photo-..." 
            pattern="https://.*">
          <small class="form-hint">Leave blank to generate an understated procedural cover.</small>
        </div>

        <div class="form-group">
          <label for="gameDescInput">Summary</label>
          <textarea 
            id="gameDescInput" 
            name="description" 
            rows="2" 
            maxlength="300" 
            placeholder="A calm narrative of the game's rhythm and essence..."></textarea>
        </div>

        <div id="formErrorMessage" class="form-alert alert-error" hidden></div>
        <div id="formSuccessMessage" class="form-alert alert-success" hidden></div>

        <div class="form-actions">
          <button type="button" id="cancelAddGameBtn" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Archive Title</button>
        </div>
      </form>
    </div>
  </dialog>

  <!-- Minimal Luxury Footer -->
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="brand-inline">
            <span class="logo-mark">✧</span>
            <span class="logo-text">NYTE <span class="logo-light">ARCADE</span></span>
          </div>
          <p class="footer-description">A quiet collection of browser games powered by PHP and MySQL with zero build tooling.</p>
        </div>
        <div class="footer-meta">
          <span class="security-chip">Isolated Sandbox</span>
          <span class="security-chip">PHP & MySQL</span>
          <span class="security-chip">HTTPS Only</span>
          <span class="security-chip">Prepared PDO</span>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© Nyte Arcade. Built with PHP, MySQL, CSS, and vanilla JS.</p>
        <a href="setup.php" class="text-btn">Database Setup</a>
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
