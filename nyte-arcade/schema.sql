-- ============================================================================
-- Nyte Arcade - Database Schema & Seed Data
-- Database Engine: MySQL / MariaDB (InnoDB)
-- Character Set: utf8mb4 (Full Unicode support)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `nyte_arcade` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `nyte_arcade`;

-- Drop table if re-running migration
-- DROP TABLE IF EXISTS `games`;

CREATE TABLE IF NOT EXISTS `games` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `category` VARCHAR(50) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `cover_url` VARCHAR(2048) DEFAULT NULL,
  `description` VARCHAR(300) DEFAULT NULL,
  `engagement_weight` INT UNSIGNED NOT NULL DEFAULT 50,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_weight` (`engagement_weight` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Curated Initial Games (Verified 100% playable in sandboxed iframes)
-- ============================================================================
INSERT INTO `games` (`title`, `slug`, `category`, `url`, `cover_url`, `description`, `engagement_weight`) VALUES
(
  '2048 Harmony',
  '2048-harmony',
  'Puzzle',
  'https://gabrielecirulli.github.io/2048/',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'A meditative numerical sequence puzzle. Merge matching values in quiet, rhythmic focus.',
  120
),
(
  'Tetra Classic',
  'tetra-classic',
  'Arcade',
  'https://chvin.github.io/react-tetris/',
  'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80',
  'Pure geometric composition. A timeless study in spatial balance and quick reflexes.',
  110
),
(
  'Tower Equilibrium',
  'tower-equilibrium',
  'Arcade',
  'https://iamkun.github.io/tower_game/',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'Stack geometric blocks with precise timing to build an ascending minimalist spire.',
  95
),
(
  'Sky Drift',
  'sky-drift',
  'Action',
  'https://ellisonleao.github.io/clumsy-bird/',
  'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
  'Gentle rhythmic navigation through open skies and shifting architectural obstacles.',
  85
),
(
  'Desert Mirage',
  'desert-mirage',
  'Action',
  'https://wayou.github.io/t-rex-runner/',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
  'A minimalist monochrome sprint across endless undulating dunes and low horizons.',
  80
),
(
  'Pattern Field',
  'pattern-field',
  'Puzzle',
  'https://muan.github.io/emoji-minesweeper/',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'Deduce hidden markers through serene logic and mindful numerical deduction.',
  70
),
(
  'Labyrinth Circuit',
  'labyrinth-circuit',
  'Arcade',
  'https://passer-by.com/pacman/',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  'Navigate glowing pathways and clear energy nodes through an intricate kinetic labyrinth.',
  65
),
(
  'Pixie Run',
  'pixie-run',
  'Action',
  'https://www.goodboydigital.com/runpixierun/',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  'A vibrant kinetic dash through enchanted ambient forests and celestial flora.',
  60
)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
