<?php
/**
 * Nyte Arcade - Database Setup & Health Check Utility
 * Accessible via http://localhost/nyte-arcade/setup.php
 */

require_once __DIR__ . '/config.php';

$stepLogs = [];
$setupSuccess = false;
$pdo = null;

// 1. Check PDO MySQL Extension
$hasPdoMysql = extension_loaded('pdo_mysql');
if (!$hasPdoMysql) {
    $stepLogs[] = ['status' => 'error', 'msg' => 'PHP extension "pdo_mysql" is not enabled. Please enable it in your php.ini.'];
} else {
    $stepLogs[] = ['status' => 'ok', 'msg' => 'PDO MySQL extension is active.'];

    // 2. Connect to MySQL server (without selecting db first)
    try {
        $rootDsn = sprintf('mysql:host=%s;port=%s;charset=%s', DB_HOST, DB_PORT, DB_CHARSET);
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
        $stepLogs[] = ['status' => 'ok', 'msg' => sprintf('Connected to MySQL server at %s:%s.', DB_HOST, DB_PORT)];

        // 3. Create database if not exists
        $rootPdo->exec(sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_unicode_ci;',
            DB_NAME,
            DB_CHARSET,
            DB_CHARSET
        ));
        $stepLogs[] = ['status' => 'ok', 'msg' => sprintf('Database "%s" verified/created.', DB_NAME)];

        // 4. Connect to database
        $dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', DB_HOST, DB_PORT, DB_NAME, DB_CHARSET);
        $pdo = new PDO($dbDsn, DB_USER, DB_PASS, $options);

        // Handle Reset action if requested
        if (isset($_POST['action']) && $_POST['action'] === 'reset') {
            $pdo->exec('DROP TABLE IF EXISTS `games`;');
            $stepLogs[] = ['status' => 'ok', 'msg' => 'Table `games` dropped for fresh reset.'];
        }

        // 5. Run schema.sql
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $pdo->exec($sql);
            $stepLogs[] = ['status' => 'ok', 'msg' => 'Schema & seed data executed successfully.'];
        }

        // 6. Query count
        $count = $pdo->query('SELECT COUNT(*) as cnt FROM `games`')->fetch()['cnt'];
        $stepLogs[] = ['status' => 'ok', 'msg' => sprintf('Database currently holds %d games ready for play.', $count)];
        $setupSuccess = true;

    } catch (PDOException $e) {
        $stepLogs[] = ['status' => 'error', 'msg' => 'MySQL Error: ' . $e->getMessage()];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Setup — <?= h(APP_NAME) ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <style>
    .setup-container {
      max-width: 680px;
      margin: 5rem auto;
      padding: 2.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--accent-border-subtle);
      border-radius: 18px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.6);
    }
    .setup-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-main);
    }
    .setup-subtitle {
      color: var(--text-muted);
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .log-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .log-item {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .log-ok {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }
    .log-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .setup-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
  </style>
</head>
<body>
  <div class="setup-container">
    <h1 class="setup-title">✧ Nyte Arcade Database Setup</h1>
    <p class="setup-subtitle">Automated MySQL health verification and schema migration utility.</p>

    <ul class="log-list">
      <?php foreach ($stepLogs as $log): ?>
        <li class="log-item <?= $log['status'] === 'ok' ? 'log-ok' : 'log-error' ?>">
          <span><?= $log['status'] === 'ok' ? '✓' : '✗' ?></span>
          <span><?= h($log['msg']) ?></span>
        </li>
      <?php endforeach; ?>
    </ul>

    <div class="setup-actions">
      <?php if ($setupSuccess): ?>
        <a href="index.php" class="btn btn-primary">Launch Nyte Arcade</a>
        <form method="POST" onsubmit="return confirm('Reset database back to the 8 default curated games?');">
          <input type="hidden" name="action" value="reset">
          <button type="submit" class="btn btn-secondary">Re-seed Defaults</button>
        </form>
      <?php else: ?>
        <a href="setup.php" class="btn btn-secondary">Retry Setup</a>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
