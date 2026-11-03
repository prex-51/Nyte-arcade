# Nyte Arcade — PHP & MySQL Edition

A browser game portal designed with a minimal, quiet luxury aesthetic: midnight obsidian and deep plum hues, subtle platinum hairline accents, single typography (**Outfit**), and secure sandboxed instant play.

Backed by **PHP** (PDO) and **MySQL** for dynamic catalog persistence, automatic category row generation, and engagement-based spotlight rotation.

---

## Architecture & Features

1. **Spotlight Canvas (Most-Engaged Game)**:
   - Fetches the top title from MySQL ordered by `engagement_weight DESC`.
   - Commands the primary viewport with cover artwork, genre tag, description, and instant play trigger.
   - Every "Play Experience" click triggers an asynchronous API update (`api/play.php`), allowing the spotlight to adapt naturally over time.
2. **Auto-Generating Category Rows**:
   - All other games sit below in categorized horizontal tracks.
   - Submitting a game with a new genre automatically creates a brand new category row.
3. **CSS `:has()` Hover Focus**:
   - Hovering over any game card gently softens and dims sibling cards (`opacity: 0.42`, soft blur) while elevating the active card with a luminous platinum border.
4. **Sandboxed Game Player (`<dialog>` + `<iframe>`)**:
   - Native HTML `<dialog>` with isolated `<iframe>`.
   - Uses `sandbox="allow-scripts allow-forms allow-pointer-lock allow-popups"` strictly **without `allow-same-origin`**, preventing embedded games from reading host cookies, sessions, or manipulating parent frames.
5. **Add Your Game**:
   - Validates title, category, and strict HTTPS URLs.
   - Inserts records into MySQL using PDO prepared statements.

---

## File Structure

```
nyte-arcade/
├── index.php           # Main server-rendered game portal
├── config.php          # Database credentials & security helpers
├── db.php              # PDO MySQL connection wrapper with auto-init
├── schema.sql          # MySQL database DDL and 8 verified curated games
├── setup.php           # Web-based database migration & health check utility
├── style.css           # Minimal luxury styling & CSS :has() hover focus
├── script.js           # Client player modal, search filter & API interactions
├── api/
│   ├── play.php        # API endpoint: records engagement in MySQL
│   └── add-game.php    # API / POST endpoint: validates & inserts games
├── docker-compose.yml  # Instant 1-command containerized local environment
└── README.md           # Documentation and setup guide
```

---

## Getting Started

### Option 1: XAMPP / WAMP / Laragon (Recommended for Windows)

1. Copy or extract the `nyte-arcade` folder into your local web root:
   - **XAMPP**: `C:\xampp\htdocs\nyte-arcade\`
   - **WAMP**: `C:\wamp64\www\nyte-arcade\`
   - **Laragon**: `C:\laragon\www\nyte-arcade\`
2. Start **Apache** and **MySQL** in your control panel.
3. Open your browser to:
   ```
   http://localhost/nyte-arcade/setup.php
   ```
4. The setup utility will automatically connect to MySQL, create the `nyte_arcade` database, create tables, and populate the 8 verified playable games.
5. Click **"Launch Nyte Arcade"** or navigate to `http://localhost/nyte-arcade/index.php`.

### Option 2: Docker Compose (Zero Configuration)

If Docker Desktop is installed:
```bash
cd nyte-arcade
docker compose up -d
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 3: PHP Built-in Server + Existing MySQL

If you have PHP and MySQL installed in your terminal:
1. Ensure MySQL is running on `localhost:3306`.
2. Start the PHP server:
   ```bash
   cd nyte-arcade
   php -S localhost:8000
   ```
3. Visit [http://localhost:8000/setup.php](http://localhost:8000/setup.php) to verify/initialize the database, then enjoy Nyte Arcade!

---

## Database Configuration

Credentials can be adjusted in [`config.php`](config.php) or via environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | MySQL hostname |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `nyte_arcade` | Database name |
| `DB_USER` | `root` | Database username |
| `DB_PASS` | `""` (empty) | Database password |

---

## Security Guarantees

- **Prepared Statements (PDO)**: Every query uses parameterized inputs to prevent SQL Injection (SQLi).
- **Zero XSS**: All dynamic outputs are escaped with `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` on the server and safe `textContent` in JavaScript.
- **Sandboxed Iframe**: Omits `allow-same-origin` to isolate third-party code.
- **HTTPS-Only Validation**: Restricts input URLs strictly to secure HTTPS protocols.
