<?php
// proxy/products.php

header('Content-Type: application/json');

$url = 'https://7ssab.stainedglass.tn/api/index.php/products';
$token = '469bd2122d58dbc1ca4910283a809a8328146338'; // ← remplace ici avec ton vrai token

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'DOLAPIKEY: ' . $token,
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Log de debug local (à désactiver en prod)
file_put_contents(__DIR__ . '/log_proxy_products.txt', json_encode([
    'timestamp' => date('c'),
    'url' => $url,
    'http_code' => $httpcode,
    'error' => $error,
    'response' => $response
], JSON_PRETTY_PRINT));

if ($httpcode === 200) {
    echo $response;
} else {
    echo json_encode([
        'error' => "Erreur API Dolibarr code HTTP $httpcode",
        'response' => $response
    ]);
}
