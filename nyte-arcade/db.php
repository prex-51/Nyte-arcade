<?php
/**
 * Nyte Arcade - Database Connection (PDO)
 * Features:
 * - Robust PDO MySQL connection with prepared statements.
 * - Auto-schema initialization if tables are missing.
 * - Graceful diagnostic mode if MySQL is not yet configured.
 */

require_once __DIR__ . '/config.php';

function getDbConnection(): ?PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        // Ensure table exists
        ensureSchemaInitialized($pdo);
        return $pdo;
    } catch (PDOException $e) {
        // If database does not exist, try to connect without dbname and create it
        if ($e->getCode() == 1049) {
            try {
                $rootDsn = sprintf('mysql:host=%s;port=%s;charset=%s', DB_HOST, DB_PORT, DB_CHARSET);
                $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                $rootPdo->exec(sprintf(
                    'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_unicode_ci;',
                    DB_NAME,
                    DB_CHARSET,
                    DB_CHARSET
                ));
                // Reconnect to newly created database
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                ensureSchemaInitialized($pdo);
                return $pdo;
            } catch (PDOException $createEx) {
                error_log('Database creation failed: ' . $createEx->getMessage());
                return null;
            }
        }

        error_log('Database connection error: ' . $e->getMessage());
        return null;
    }
}

/**
 * Automatically creates tables and seeds curated games if not present
 */
function ensureSchemaInitialized(PDO $pdo): void {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'games'")->fetch();
        if (!$check) {
            $schemaFile = __DIR__ . '/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                // Execute multi-query schema
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log('Schema auto-init check error: ' . $e->getMessage());
    }
}
