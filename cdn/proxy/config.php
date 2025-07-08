<?php
// cdn/proxy/config.php

// --- Dolibarr API Configuration ---
define('DOLIBARR_API_URL', 'https://7ssab.stainedglass.tn/api/index.php'); // Base URL, endpoint will be appended
define('DOLIBARR_API_TOKEN', '469bd2122d58dbc1ca4910283a809a8328146338'); // Replace with your actual Dolibarr API token

// --- Image Cache Configuration (for sync_images.php) ---
define('IMG_SYNC_SRC_DIR', '/home/stainea/documents/produit/'); // Source of product images (e.g., from Dolibarr export) - IMPORTANT: Secure this path!
define('IMG_CACHE_DIR_ABS', __DIR__ . '/../stainedglass-img-cache/'); // Absolute path to image cache dir, relative to this proxy dir (used by sync_images.php)
define('IMG_CACHE_URL', 'https://cdn.stainedglass.tn/stainedglass-img-cache/'); // Public URL for cached images (used by front-end)

// --- Image Sync Script Configuration ---
define('SYNC_IMAGES_TOKEN', 'YOUR_STRONG_SECRET_TOKEN_HERE'); // Replace with a strong, random token for sync_images.php

// --- Proxy Cache Configuration (for products.php) ---
define('PROXY_CACHE_DIR', __DIR__ . '/cache/'); // Directory to store cached API responses
define('PROXY_CACHE_EXPIRATION', 3600); // Cache expiration time in seconds (e.g., 3600 = 1 hour)

// --- (Optional) Future API Key for this proxy itself, if needed ---
// define('PROXY_OWN_API_KEY', 'a_strong_key_for_this_proxy_if_it_were_to_expose_an_api');

?>
