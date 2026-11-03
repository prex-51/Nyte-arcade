<?php
/**
 * Nyte Arcade - API: Record Game Play / Engagement
 * Increments the game's engagement_weight in MySQL so the spotlight can adapt naturally.
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

// Parse request payload (supports JSON or form-data)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$gameId = 0;
if (is_array($data) && !empty($data['id'])) {
    $gameId = (int)$data['id'];
} elseif (!empty($_POST['id'])) {
    $gameId = (int)$_POST['id'];
}

if ($gameId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid game ID.']);
    exit;
}

$pdo = getDbConnection();
if (!$pdo) {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable.']);
    exit;
}

try {
    $stmt = $pdo->prepare('UPDATE `games` SET `engagement_weight` = `engagement_weight` + 1 WHERE `id` = :id');
    $stmt->execute([':id' => $gameId]);

    // Fetch updated weight
    $fetchStmt = $pdo->prepare('SELECT `id`, `title`, `engagement_weight` FROM `games` WHERE `id` = :id');
    $fetchStmt->execute([':id' => $gameId]);
    $updatedGame = $fetchStmt->fetch();

    echo json_encode([
        'success'    => true,
        'game_id'    => $gameId,
        'new_weight' => $updatedGame ? (int)$updatedGame['engagement_weight'] : null
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update engagement weight.']);
}
