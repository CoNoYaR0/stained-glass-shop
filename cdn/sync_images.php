<?php
ini_set('display_errors', 1); // Recommended for dev, consider changing for prod
error_reporting(E_ALL);     // Recommended for dev, consider changing for prod

require_once __DIR__ . '/proxy/config.php'; // Adjusted path to config

// --- Configuration Check & Security ---
if (!defined('SYNC_IMAGES_TOKEN') || !defined('IMG_SYNC_SRC_DIR') || !defined('IMG_CACHE_DIR_ABS')) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server configuration error. Required constants are not defined.'
    ]);
    exit;
}

$providedToken = $_GET['token'] ?? '';
if ($providedToken !== SYNC_IMAGES_TOKEN) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => '🚫 Unauthorized. Invalid or missing token.'
    ]);
    exit;
}

// Autoriser CORS - useful if this script is ever called from a browser admin panel
// For a cron job or direct CLI execution, this might not be strictly necessary
// but doesn't harm.
header("Access-Control-Allow-Origin: *"); // Consider restricting this in production
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

function sync_images($productId = null) {
    $sourceDir = rtrim(IMG_SYNC_SRC_DIR, '/') . '/';
    $targetDir = rtrim(IMG_CACHE_DIR_ABS, '/') . '/';

    $results = [
        'status' => 'error',
        'message' => '',
        'copied_files' => [],
        'skipped_files' => [], // Files that already exist
        'warnings' => [],
        'errors' => []
    ];

    if (!is_dir($sourceDir) || !is_readable($sourceDir)) {
        $results['message'] = 'Source directory not found or not readable.';
        $results['errors'][] = "Source directory '{$sourceDir}' does not exist or is not readable.";
        http_response_code(500);
        return $results;
    }

    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true)) {
            $results['message'] = 'Failed to create target directory.';
            $results['errors'][] = "Failed to create target directory '{$targetDir}'. Check permissions.";
            http_response_code(500);
            return $results;
        }
    }
    if (!is_writable($targetDir)) {
        $results['message'] = 'Target directory not writable.';
        $results['errors'][] = "Target directory '{$targetDir}' is not writable.";
        http_response_code(500);
        return $results;
    }

    $sourceItems = scandir($sourceDir);
    if ($sourceItems === false) {
        $results['message'] = 'Could not scan source directory.';
        $results['errors'][] = "Failed to scan source directory '{$sourceDir}'.";
        http_response_code(500);
        return $results;
    }

    foreach ($sourceItems as $item) {
        if ($item == '.' || $item == '..') continue;

        $productFolderCandidate = $sourceDir . $item;
        
        if (is_dir($productFolderCandidate)) {
            // If a specific product ID is requested, only process that folder
            if ($productId && $item != $productId) {
                continue;
            }

            $productImages = scandir($productFolderCandidate);
            if ($productImages === false) {
                $results['warnings'][] = "Could not scan product sub-directory '{$productFolderCandidate}'. Skipping.";
                continue;
            }

            foreach ($productImages as $file) {
                if (preg_match('/\.(jpg|jpeg|png)$/i', $file)) {
                    $sourceFile = $productFolderCandidate . '/' . $file;
                    $targetFile = $targetDir . basename($file); // Flatten structure in cache

                    if (!is_readable($sourceFile)) {
                        $results['warnings'][] = "Source file '{$sourceFile}' is not readable. Skipping.";
                        continue;
                    }

                    if (!file_exists($targetFile)) {
                        if (copy($sourceFile, $targetFile)) {
                            chmod($targetFile, 0644); // Set permissions for the copied file
                            $results['copied_files'][] = basename($file);
                        } else {
                            $results['errors'][] = "Failed to copy '{$file}' from '{$sourceFile}' to '{$targetFile}'.";
                        }
                    } else {
                        $results['skipped_files'][] = basename($file) . " (already exists)";
                    }
                }
            }
        }
    }

    if (empty($results['errors'])) {
        $results['status'] = 'ok';
        if (!empty($results['copied_files'])) {
            $results['message'] = 'Image synchronization complete.';
        } elseif (!empty($results['skipped_files']) && empty($results['copied_files'])) {
            $results['message'] = 'Image synchronization complete. No new files to copy.';
        } else {
            $results['message'] = 'Image synchronization complete. No images found or copied.';
        }
    } else {
        $results['message'] = 'Image synchronization completed with errors.';
        http_response_code(500); // Internal Server Error if there were copy errors
    }

    if (empty($results['copied_files']) && empty($results['skipped_files']) && empty($results['errors']) && empty($results['warnings'])) {
         if ($productId) {
            $results['message'] = "No images found for product ID '{$productId}' in source directory or its subfolders.";
         } else {
            $results['message'] = "No image files found in source directory subfolders.";
         }
    }


    return $results;
}

// --- Main Program ---
$productId = $_GET['id'] ?? null; // Optional: sync only for a specific product ID

$syncResult = sync_images($productId);

// Set appropriate HTTP status code based on outcome
if ($syncResult['status'] === 'error' && !headers_sent()) {
    // If http_response_code was not set inside sync_images due to an early exit, set it here.
    // Typically it would be 500 for server-side issues.
    if (http_response_code() === 200) { // Check if it hasn't been set to an error code already
        http_response_code(500);
    }
} elseif ($syncResult['status'] === 'ok' && !empty($syncResult['errors']) && !headers_sent()) {
    // Partial success with errors
    http_response_code(207); // Multi-Status
} elseif ($syncResult['status'] === 'ok' && !headers_sent()) {
    http_response_code(200);
}


echo json_encode($syncResult, JSON_PRETTY_PRINT);

?>
