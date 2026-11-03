<?php
/**
 * Nyte Arcade - API / Form Handler: Add New Game
 * Inserts a player-submitted game into MySQL with strict validation:
 * - Title and category requirements
 * - Strict HTTPS-only validation for game URL and cover URL
 * - Prepared statement execution with PDO
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    || (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
        exit;
    }
    header('Location: ../index.php');
    exit;
}

// Retrieve inputs (supporting JSON or $_POST)
$input = $_POST;
$rawInput = file_get_contents('php://input');
$json = json_decode($rawInput, true);
if (is_array($json)) {
    $input = array_merge($input, $json);
}

$title       = trim($input['name'] ?? $input['title'] ?? '');
$categoryRaw = trim($input['category'] ?? '');
$url         = trim($input['url'] ?? '');
$coverUrl    = trim($input['cover'] ?? $input['cover_url'] ?? '');
$description = trim($input['description'] ?? '');

$errors = [];

// 1. Validate Title
if (empty($title) || mb_strlen($title) < 2 || mb_strlen($title) > 100) {
    $errors[] = 'Game title must be between 2 and 100 characters.';
}

// 2. Validate Category
if (empty($categoryRaw) || mb_strlen($categoryRaw) < 2 || mb_strlen($categoryRaw) > 50) {
    $errors[] = 'Category must be specified (between 2 and 50 characters).';
}
// Normalize category casing (Title Case)
$category = ucwords(strtolower($categoryRaw));

// 3. Security: Validate Game URL (HTTPS only)
if (!isValidHttpsUrl($url)) {
    $errors[] = 'Security requirement: Game URL must be a valid link starting strictly with https://';
}

// 4. Security: Validate Cover URL (if provided, HTTPS only)
if (!empty($coverUrl) && !isValidHttpsUrl($coverUrl)) {
    $errors[] = 'Cover image URL must begin with https:// or remain empty.';
}

// 5. Sanitize description
if (mb_strlen($description) > 300) {
    $description = mb_substr($description, 0, 300);
}

// Return errors if any
if (!empty($errors)) {
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $errors, 'error' => $errors[0]]);
        exit;
    }
    $_SESSION['flash_error'] = implode(' ', $errors);
    header('Location: ../index.php#addGame');
    exit;
}

$pdo = getDbConnection();
if (!$pdo) {
    $msg = 'Database connection is currently unavailable.';
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => $msg]);
        exit;
    }
    $_SESSION['flash_error'] = $msg;
    header('Location: ../index.php');
    exit;
}

try {
    $slug = generateSlug($title);
    $initialWeight = 50;

    $stmt = $pdo->prepare('
        INSERT INTO `games` (`title`, `slug`, `category`, `url`, `cover_url`, `description`, `engagement_weight`)
        VALUES (:title, :slug, :category, :url, :cover_url, :description, :engagement_weight)
    ');

    $stmt->execute([
        ':title'             => $title,
        ':slug'              => $slug,
        ':category'          => $category,
        ':url'               => $url,
        ':cover_url'         => !empty($coverUrl) ? $coverUrl : null,
        ':description'       => !empty($description) ? $description : null,
        ':engagement_weight' => $initialWeight,
    ]);

    $newId = (int)$pdo->lastInsertId();

    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'message' => sprintf('"%s" was archived under %s.', $title, $category),
            'game'    => [
                'id'          => $newId,
                'name'        => $title,
                'category'    => $category,
                'url'         => $url,
                'cover'       => $coverUrl,
                'description' => $description,
            ]
        ]);
        exit;
    }

    $_SESSION['flash_success'] = sprintf('"%s" was archived under %s.', $title, $category);
    header('Location: ../index.php');
    exit;

} catch (PDOException $e) {
    error_log('Insert game error: ' . $e->getMessage());
    $msg = 'Database error while saving game.';
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $msg]);
        exit;
    }
    $_SESSION['flash_error'] = $msg;
    header('Location: ../index.php');
    exit;
}
