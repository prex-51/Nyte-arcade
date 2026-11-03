<?php
/**
 * Nyte Arcade - Configuration Settings
 * Supports local development (XAMPP, WAMP, Laragon) and production environments.
 */

// Database Credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'nyte_arcade');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'Nyte Arcade');
define('APP_TAGLINE', 'Curated Browser Portal');

// Session Settings
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * XSS Protection Helper: Sanitize string for HTML output
 */
function h(?string $str): string {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Strict HTTPS validator helper
 */
function isValidHttpsUrl(?string $url): bool {
    if (empty($url) || !is_string($url)) {
        return false;
    }
    $trimmed = trim($url);
    if (strpos($trimmed, 'https://') !== 0) {
        return false;
    }
    return filter_var($trimmed, FILTER_VALIDATE_URL) !== false;
}

/**
 * URL Slug generator helper
 */
function generateSlug(string $title): string {
    $clean = preg_replace('/[^a-zA-Z0-9\s-]/', '', strtolower(trim($title)));
    $clean = preg_replace('/[\s-]+/', '-', $clean);
    return trim($clean, '-') . '-' . substr(md5(uniqid((string)mt_rand(), true)), 0, 4);
}
