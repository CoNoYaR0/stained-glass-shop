# Dolibarr Integration Middleware

## Overview

This project is a Node.js (Fastify) middleware application designed to synchronize data (products, categories, variants, images, stock levels) from a Dolibarr ERP instance into an optimized PostgreSQL database. It then exposes this synchronized data via a RESTful API for consumption by frontend applications or other services.

The primary goals are:
-   Decouple frontend applications from direct Dolibarr API calls, improving frontend performance and resilience.
-   Reduce direct load on the Dolibarr instance.
-   Provide a more flexible and potentially enriched data source than the raw Dolibarr API.
-   Enable real-time (or near real-time) updates through webhooks and a polling fallback mechanism.
-   Serve product images via a CDN (AWS S3 + CloudFront).

## Features (Planned & Implemented)

-   **Data Synchronization:**
    -   [x] Categories
    -   [x] Products
    -   [x] Product Variants
    -   [x] Product Images (with S3 upload & CDN URL generation)
    -   [x] Stock Levels
-   **Synchronization Mechanisms:**
    -   [x] Initial full data sync (manually triggerable - *CLI/endpoint for this TBD*)
    -   [x] Webhook handling (Proof of Concept for products, categories, stock - *needs Dolibarr-specific payload adaptation*)
    -   [x] Polling service for fallback/regular updates (Implemented for stock levels)
-   **API:**
    -   [x] `GET /api/v1/categories` - List all categories.
    -   [x] `GET /api/v1/products` - List products with pagination, basic filtering by category, and sorting.
    -   [x] `GET /api/v1/products/:slug` - Get a single product by slug, including its variants, images, and stock.
    -   [x] API Documentation via Swagger/OpenAPI available at `/documentation`.
-   **Tech Stack:**
    -   Node.js
    -   Fastify (web framework)
    -   PostgreSQL (database)
    -   AWS S3 (for image storage)
    -   AWS CloudFront (as CDN for images - *manual setup required*)
    -   Docker & Docker Compose (for development and deployment)
    -   Vitest (for testing)

## Prerequisites

-   Node.js (v18+ recommended)
-   npm (or yarn)
-   Docker & Docker Compose
-   A running PostgreSQL instance (Docker Compose provides one for development)
-   A running Dolibarr instance with API access enabled.
-   AWS Account with S3 bucket and (optionally) CloudFront distribution configured. IAM user with S3 permissions.

## Project Structure

```
dolibarr-middleware/
├── migrations/                 # SQL database migration files
│   └── 001_initial_schema.sql
├── src/                        # Source code
│   ├── config/                 # Configuration management (index.js)
│   ├── controllers/            # API route handlers (categoryController.js, productController.js)
│   ├── models/                 # (Currently unused, could hold DB interaction logic/ORM models later)
│   ├── routes/                 # API and webhook route definitions (apiRoutes.js, webhookRoutes.js)
│   ├── services/               # Business logic and external service integrations
│   │   ├── __tests__/          # Unit/integration tests for services (syncService.test.js)
│   │   ├── dbService.js        # PostgreSQL connection and query helper
│   │   ├── dolibarrApiService.js # Client for Dolibarr API
│   │   ├── pollingService.js   # Cron-based polling tasks
│   │   ├── s3Service.js        # AWS S3 integration for file uploads
│   │   └── syncService.js      # Data synchronization logic
│   ├── utils/                  # Utility functions (logger.js)
│   └── server.js               # Fastify server setup and entry point
├── .env.example                # Example environment variables file
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore file
├── .prettierrc.json            # Prettier configuration
├── Dockerfile                  # Dockerfile for building the application image
├── docker-compose.yml          # Docker Compose for local development environment
├── package-lock.json
├── package.json
├── README.md                   # This file
└── vitest.config.js            # Vitest configuration
```

## Configuration

Create a `.env` file in the root of the `dolibarr-middleware` project. You can copy `.env.example` (which you'll need to create or I will create next) as a template.

**Required Environment Variables:**

-   `NODE_ENV`: `development`, `production`, or `test`.
-   `PORT`: Port for the middleware server (e.g., `3000`).
-   `LOG_LEVEL`: Logging level (e.g., `info`, `debug`, `warn`, `error`).

-   `DB_HOST`: Database host (e.g., `db` when using Docker Compose, `localhost` otherwise).
-   `DB_PORT`: Database port (e.g., `5432`).
-   `DB_USER`: Database user.
-   `DB_PASSWORD`: Database password.
-   `DB_NAME`: Database name.
-   `DB_SSL_MODE`: (Optional) e.g., `require` for SSL connections.

-   `DOLIBARR_API_URL`: Full base URL of your Dolibarr API (e.g., `https://your.dolibarr.site/api/index.php`).
-   `DOLIBARR_API_KEY`: Your Dolibarr API key.
-   `DOLIBARR_WEBHOOK_SECRET`: A strong secret string for validating incoming webhooks from Dolibarr.

-   `AWS_ACCESS_KEY_ID`: AWS IAM user access key ID.
-   `AWS_SECRET_ACCESS_KEY`: AWS IAM user secret access key.
-   `AWS_S3_BUCKET_NAME`: Name of the S3 bucket for image storage.
-   `AWS_REGION`: AWS region for the S3 bucket (e.g., `us-east-1`).
-   `AWS_CLOUDFRONT_DISTRIBUTION_ID`: (Optional) ID of your CloudFront distribution for serving images.

-   `POLLING_ENABLED`: `true` or `false` to enable/disable the polling service.
-   `POLLING_STOCK_SYNC_INTERVAL`: Cron string for stock sync polling (e.g., `0 */1 * * *` for hourly).

*(I will create an `.env.example` file next.)*

## Installation

1.  Clone the repository (if applicable).
2.  Navigate to the `dolibarr-middleware` directory.
3.  Create and populate your `.env` file as described above.
4.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Application

### Development (with Docker Compose)

This is the recommended way for local development as it includes a PostgreSQL database.

1.  Ensure Docker and Docker Compose are installed and running.
2.  Make sure you have a `.env` file configured in the `dolibarr-middleware` root. **Important:** For Docker Compose, `DB_HOST` in your `.env` file should typically be set to the service name of the database in `docker-compose.yml` (which is `db`).
3.  Build and start the services:
    ```bash
    docker-compose up --build
    ```
    (Use `docker-compose up -d` to run in detached mode).
4.  The application will be available at `http://localhost:PORT` (e.g., `http://localhost:3000`).
5.  The API documentation will be at `http://localhost:PORT/documentation`.
6.  The PostgreSQL database will be accessible from your host machine on the port specified by `DB_EXTERNAL_PORT` in your `.env` or `docker-compose.yml` (defaults to `5433` mapping to container's `5432`).

### Applying Database Migrations (Development with Docker)

After the database container is up and running for the first time (or after schema changes):
1.  You need to execute the SQL migration file(s) located in the `migrations/` directory against your database.
2.  For now, this is a manual step. Connect to the PostgreSQL database (e.g., using `psql` CLI, pgAdmin, DBeaver, or your IDE's database tools) using the credentials from your `.env` file and the external port (e.g., 5433).
3.  Run the SQL commands from `migrations/001_initial_schema.sql` (and any subsequent migration files).
    *Example using psql (if you have psql client installed and db is exposed on port 5433):*
    ```bash
    psql -h localhost -p 5433 -U YOUR_DB_USER -d YOUR_DB_NAME -f migrations/001_initial_schema.sql
    ```
*(Later, a proper migration tool like `node-pg-migrate` or `Knex.js` would be integrated to manage this with `npm run db:migrate` commands executed inside the container).*

### Production

Deployment strategies for production will vary (e.g., deploying the Docker container to a cloud provider like AWS ECS, Google Cloud Run, DigitalOcean App Platform, or a VPS). Ensure all environment variables are securely managed in the production environment.

## Running Tests

```bash
npm test
```
To run tests in watch mode:
```bash
npm run test:watch
```
To generate a coverage report (in `./coverage/`):
```bash
npm run coverage
```

## Triggering Initial Data Sync

Currently, the `runInitialSync()` function in `syncService.js` needs to be triggered manually.
Future improvements:
-   Add a CLI command (e.g., `npm run sync:initial`).
-   Create a secure, admin-only API endpoint to trigger it.

For now, you could temporarily add a route in `apiRoutes.js` or call it from `server.js` on startup (for the very first run).

## Webhook Setup in Dolibarr

1.  In your Dolibarr instance, navigate to the Webhooks module configuration.
2.  Create webhooks for the events you want to synchronize (e.g., Product Create, Product Update, Category Create, Category Update, Stock changes/Order validation).
3.  **Target URL:** `YOUR_MIDDLEWARE_APP_URL/webhooks/dolibarr` (e.g., `https://your-deployed-middleware.com/webhooks/dolibarr`).
4.  **Secret Key:** Configure Dolibarr to send a secret key with the webhook. This is often done via a custom HTTP Header (e.g., `X-Dolibarr-Webhook-Secret: YOUR_STRONG_SECRET`). The value `YOUR_STRONG_SECRET` must match the `DOLIBARR_WEBHOOK_SECRET` in your middleware's `.env` file.
5.  **Payload Structure:** You **MUST** inspect the actual JSON payload Dolibarr sends for each webhook event. The parsing logic in `dolibarr-middleware/src/routes/webhookRoutes.js` (for `entity`, `action`, `entityId`) needs to be adapted to match this structure precisely.

## Further Development & TODOs

-   Implement full CRUD operations for webhook handlers (e.g., product deletion).
-   Refine webhook payload parsing in `webhookRoutes.js`.
-   Adapt all transformation functions (`transformProduct`, `transformVariant`, etc.) in `syncService.js` based on actual Dolibarr API response fields for your specific Dolibarr version and modules.
-   Implement more robust error handling and retry mechanisms, especially for sync operations and API calls.
-   Add more comprehensive integration and end-to-end tests.
-   Integrate a database migration tool (e.g., `node-pg-migrate`, `Knex.js`).
-   Add more detailed response schemas to API routes for better Swagger documentation.
-   Secure sensitive endpoints if any are added (e.g., an endpoint to trigger sync).
-   Optimize database queries and add more indexes as needed based on usage patterns.
-   Implement image handling for product variants in `syncProductImages` and webhook handlers.
-   Refine stock update logic in webhook handlers based on actual Dolibarr stock webhook payloads.

---

This README provides a starting point. It should be expanded as the project evolves.
