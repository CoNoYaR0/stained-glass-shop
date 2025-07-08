<?php
// proxy/products.php

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

// --- Cache Configuration ---
// Ensure PROXY_CACHE_DIR and PROXY_CACHE_EXPIRATION are defined (they should be in config.php)
if (!defined('PROXY_CACHE_DIR') || !defined('PROXY_CACHE_EXPIRATION')) {
    // Fallback if not defined, though they should be. This indicates a config issue.
    // In a real production scenario, you might want to log this error or handle it more gracefully.
    define('PROXY_CACHE_DIR_FALLBACK', __DIR__ . '/cache/');
    define('PROXY_CACHE_EXPIRATION_FALLBACK', 3600); // 1 hour

    if (!is_dir(PROXY_CACHE_DIR_FALLBACK)) {
        mkdir(PROXY_CACHE_DIR_FALLBACK, 0755, true);
    }
    $cacheDirToUse = PROXY_CACHE_DIR_FALLBACK;
    $cacheExpirationToUse = PROXY_CACHE_EXPIRATION_FALLBACK;
} else {
    if (!is_dir(PROXY_CACHE_DIR)) {
        mkdir(PROXY_CACHE_DIR, 0755, true);
    }
    $cacheDirToUse = PROXY_CACHE_DIR;
    $cacheExpirationToUse = PROXY_CACHE_EXPIRATION;
}

$cacheKey = md5(DOLIBARR_API_URL . '_products'); // Simple cache key for this specific endpoint
$cacheFile = rtrim($cacheDirToUse, '/') . '/' . $cacheKey . '.json';

// --- Try to serve from cache ---
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheExpirationToUse) {
    // Cache hit and not expired
    readfile($cacheFile);
    exit;
}

// --- Fetch from Dolibarr API ---
$ch = curl_init(DOLIBARR_API_URL . '/products');

if (!$ch) {
    http_response_code(500);
    echo json_encode(['error' => "Failed to initialize cURL session"]);
    exit;
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'DOLAPIKEY: ' . DOLIBARR_API_TOKEN,
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);

curl_close($ch);

// --- Handle API Response ---
if ($response === false) {
    http_response_code(502); // Bad Gateway
    echo json_encode([
        'error' => 'Error connecting to Dolibarr API',
        'details' => $curl_error
    ]);
    exit;
}

if ($httpcode === 200) {
    // Save to cache
    file_put_contents($cacheFile, $response);
    echo $response;
} else {
    http_response_code($httpcode); // Forward Dolibarr's HTTP status code
    // Attempt to parse Dolibarr's response if it's JSON, otherwise pass it as is
    $decodedResponse = json_decode($response);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode([
            'error' => "Dolibarr API Error (HTTP $httpcode)",
            'original_response' => $decodedResponse
        ]);
    } else {
        echo json_encode([
            'error' => "Dolibarr API Error (HTTP $httpcode)",
            'original_response_raw' => $response // Send raw if not JSON
        ]);
    }
}
?>
