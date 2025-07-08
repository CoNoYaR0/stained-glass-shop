<?php
// 🔐 Token check
$token = $_GET['token'] ?? '';
$secret = 'CoNo_Cache_B0ss';
if ($token !== $secret) {
    http_response_code(403);
    exit('🚫 Unauthorized');
}

ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'config.php';

// Autoriser CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

function sync_images($productId = null) {
    $sourceDir = '/home/stainea/documents/produit/';
    $targetDir = IMG_CACHE_DIR;

    if (!is_dir($sourceDir)) {
        http_response_code(500);
        exit(json_encode(['error' => 'Source directory not found']));
    }

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $copied = [];

    // Scanner tous les dossiers de produits
    foreach (scandir($sourceDir) as $dir) {
        if ($dir == '.' || $dir == '..') continue;

        $productFolder = $sourceDir . $dir;
        
        if (is_dir($productFolder)) {
            // Si on cherche un ID spécifique
            if ($productId && $dir != $productId) {
                continue;
            }

            // Chercher les images dans ce dossier
            foreach (scandir($productFolder) as $file) {
                if (preg_match('/\.(jpg|jpeg|png)$/i', $file)) {
                    $sourceFile = $productFolder . '/' . $file;
                    $targetFile = $targetDir . basename($file);

                    if (!file_exists($targetFile)) {
                        copy($sourceFile, $targetFile);
                        $copied[] = basename($file);
                    }
                }
            }
        }
    }

    return $copied;
}

// --- Programme principal ---

$productId = $_GET['id'] ?? null;
$imagesCopied = sync_images($productId);

header("Content-Type: application/json");
echo json_encode([
    'status' => 'ok',
    'images_copied' => $imagesCopied
]);
?>
