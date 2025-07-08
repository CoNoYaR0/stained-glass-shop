# CDN / Proxy Middleware for Dolibarr

This directory contains a set of PHP scripts designed to act as a lightweight CDN and proxy middleware between a Dolibarr ERP instance and a frontend application. Its primary purpose is to improve performance, reduce direct load on Dolibarr, and provide a caching layer for product information and images.

This component is intended to be deployed separately, for example, on an FTP server, and accessed via a specific CDN subdomain (e.g., `cdn.yourdomain.com`).

## Structure

-   `proxy/`: Contains scripts that proxy requests to Dolibarr.
    -   `products.php`: Fetches product listings from the Dolibarr API. Implements caching to reduce API calls.
    -   `config.php`: Main configuration file for API endpoints, tokens, cache settings, and file paths.
    -   `cache/`: Directory used by `products.php` to store cached API responses (must be writable by the web server).
-   `stainedglass-img-cache/`: Publicly accessible directory where product images are stored/cached (must be writable by `sync_images.php`).
-   `sync_images.php`: A script to synchronize product images from a source directory (e.g., a Dolibarr export folder) to the `stainedglass-img-cache/` directory.
-   `.htaccess`: Apache configuration file for the root `cdn/` directory. Manages CORS and security headers.
-   `stainedglass-img-cache/.htaccess`: Apache configuration file specific to the image cache directory.

## Configuration

All primary configuration is done in `cdn/proxy/config.php`. Key settings include:

**Dolibarr API:**
-   `DOLIBARR_API_URL`: The base URL of your Dolibarr API (e.g., `https://your.dolibarr.site/api/index.php`).
-   `DOLIBARR_API_TOKEN`: Your Dolibarr API key.

**Proxy Cache (for `products.php`):**
-   `PROXY_CACHE_DIR`: Absolute path to the directory for storing cached API responses (e.g., `__DIR__ . '/cache/'`). Must be writable.
-   `PROXY_CACHE_EXPIRATION`: Cache lifetime in seconds (e.g., `3600` for 1 hour).

**Image Synchronization (`sync_images.php`):**
-   `IMG_SYNC_SRC_DIR`: Absolute path to the source directory where product images are located (e.g., `/path/to/dolibarr/documents/produit/`). This directory structure is expected to contain subfolders per product, and those subfolders contain the actual images.
-   `IMG_CACHE_DIR_ABS`: Absolute path to the target directory for storing synchronized images (e.g., `__DIR__ . '/../stainedglass-img-cache/'`). This is the `stainedglass-img-cache` directory. Must be writable by `sync_images.php`.
-   `IMG_CACHE_URL`: The public URL corresponding to `IMG_CACHE_DIR_ABS` (e.g., `https://cdn.yourdomain.com/stainedglass-img-cache/`).
-   `SYNC_IMAGES_TOKEN`: A secret token that must be provided as a GET parameter (`?token=YOUR_TOKEN`) to authorize execution of `sync_images.php`. **IMPORTANT: Choose a strong, random token.**

**Important Paths:**
-   The `IMG_SYNC_SRC_DIR` needs to be carefully configured to point to where your raw product images are stored.
-   The `PROXY_CACHE_DIR` and `IMG_CACHE_DIR_ABS` need to be writable by the PHP process running on your FTP server.

## Usage

### Fetching Products

Access `https://your-cdn-domain.com/proxy/products.php`.
This will return a JSON response of products, either fresh from Dolibarr or from its cache.

### Synchronizing Images

To trigger image synchronization, access:
`https://your-cdn-domain.com/sync_images.php?token=YOUR_STRONG_SECRET_TOKEN_HERE`

Optionally, to sync images for a specific product ID (where the product ID corresponds to the folder name in `IMG_SYNC_SRC_DIR`):
`https://your-cdn-domain.com/sync_images.php?token=YOUR_STRONG_SECRET_TOKEN_HERE&id=PRODUCT_ID`

This script will output a JSON response detailing the success, and any files copied, skipped, or errors encountered. It's recommended to run this script periodically (e.g., via a cron job if your FTP server allows, or manually after product updates).

**Security for `sync_images.php`:**
-   Use a very strong, unpredictable string for `SYNC_IMAGES_TOKEN`.
-   If possible, restrict access to `sync_images.php` by IP address using `.htaccess` rules in the `cdn/` directory, allowing only trusted IPs to execute it. Example:
    ```apache
    <Files "sync_images.php">
        Require ip 1.2.3.4
        # Require ip ::1
    </Files>
    ```

## Error Handling & Logging

-   `proxy/products.php`: Returns appropriate HTTP status codes and JSON error messages if the Dolibarr API is unreachable or returns an error.
-   `sync_images.php`: Returns a JSON response with detailed information about copied, skipped, or problematic files. Check the `errors` and `warnings` arrays in the response.

## Deployment Notes

1.  **Upload:** Upload the entire `cdn/` directory (excluding this `README.md` if preferred in the parent, but useful here for context) to your FTP server.
2.  **Configure:** Edit `cdn/proxy/config.php` with your specific paths, URLs, and tokens.
3.  **Permissions:**
    -   Ensure `cdn/proxy/cache/` is writable by the web server.
    -   Ensure `cdn/stainedglass-img-cache/` is writable by the web server (specifically by the `sync_images.php` script).
4.  **Testing:**
    -   Access `proxy/products.php` to verify API connection and caching.
    -   Manually run `sync_images.php` (with the correct token) to test image synchronization.
5.  **Security:**
    -   Set a strong `SYNC_IMAGES_TOKEN`.
    -   Restrict access to `sync_images.php` by IP if possible.
    -   Ensure your Dolibarr API token (`DOLIBARR_API_TOKEN`) has the minimum necessary permissions.

## Future Enhancements

-   **Concurrency Support:** For very high traffic, the file-based caching in `products.php` might become a bottleneck. Using a more robust cache like Redis or Memcached (if available on the server) would be an improvement.
-   **Advanced HMAC for `sync_images.php`:** Instead of a static token, a time-based HMAC token could be used for `sync_images.php` if the calling client can generate it.
-   **More Granular Cache Keys:** The `products.php` cache key is currently static for the endpoint. If filtering or pagination were added, the cache key would need to incorporate those parameters.
-   **Logging:** Implement more robust logging to a dedicated log file or system logger, especially for errors in `sync_images.php`.
-   **Content Security Policy (CSP):** Implement a more comprehensive CSP via `.htaccess` once all interactions are fully understood and tested.
```
