---
inclusion: manual
---

Core Libraries:

`lib/cloudflare/r2-client.ts`:
- `createR2Client()` — Creates and returns S3Client configured for Cloudflare R2.

`lib/cloudflare/r2-utils.ts`:
- `generateR2Key({ fileName, path?, prefix? })` — Generates unique keys with timestamp and random string. Returns formatted key with optional path and prefix.

`lib/cloudflare/r2.ts`:
- `serverUploadFile({ data, contentType, path?, key })` — Uploads file (Buffer or base64 string) and returns `{ url, key }`.
- `deleteFile(key)` — Deletes file by key.
- `listR2Objects({ prefix?, continuationToken?, pageSize? })` — Paginated listing, returns `{ objects: ListedObject[], nextContinuationToken?, error? }`.
- `createPresignedUploadUrl({ key, contentType, expiresIn? })` — Generates presigned PUT URL for client-side uploads. Returns `{ presignedUrl, publicObjectUrl }`.
- `createPresignedDownloadUrl({ key, expiresIn? })` — Generates presigned GET URL for temporary download access.

`lib/cloudflare/r2-download.ts` (Client-side utilities):
- `downloadFileAsAdmin(key)` — Client-side helper to download file using admin presigned URL. Fetches presigned URL via `generateAdminPresignedDownloadUrl`, then triggers browser download. Falls back to opening in new tab on error.
- `downloadFileAsUser(key)` — Client-side helper to download file using authenticated user presigned URL. Fetches presigned URL via `generateUserPresignedDownloadUrl`, then triggers browser download.
- `downloadFileAsPublic(key)` — Client-side helper to download file using public presigned URL (rate limited). Fetches presigned URL via `generatePublicPresignedDownloadUrl`, then triggers browser download.
- `downloadFileFromUrl(fullPath, mode)` — Convenience helper that extracts key from full URL and delegates to appropriate download method based on mode ('admin' | 'user' | 'public'). Default mode is 'user'.
- All download helpers use toast notifications (sonner) for error feedback and automatically extract filename from key.

Required env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

Server Actions (`actions/r2-resources/index.ts`):
- `listR2Files({ categoryPrefix, filterPrefix?, continuationToken?, pageSize? })` — Admin-only. Lists files with optional filtering. Returns `{ files, nextContinuationToken }` via `actionResponse`.
- `deleteR2File(key)` — Admin-only. Sanitizes key and calls `deleteFile`.
- `generateAdminPresignedUploadUrl({ fileName, contentType, path, prefix? })` — Admin-only presigned upload URL. Uses `generateR2Key` and `createPresignedUploadUrl`. Returns `{ presignedUrl, key, publicObjectUrl }`.
- `generateUserPresignedUploadUrl({ fileName, contentType, path, prefix? })` — Authenticated user presigned upload. Automatically prefixes path with `users/{path}/userid-{userId}` for user isolation.
- `generatePublicPresignedUploadUrl({ fileName, contentType, path, prefix? })` — Anonymous user presigned upload with rate limiting (using Upstash). Limit configurable via `NEXT_PUBLIC_DAILY_IMAGE_UPLOAD_LIMIT` env (default: 100/day). Admins bypass rate limit.
- `generateAdminPresignedDownloadUrl(key)` — Admin-only presigned download URL.
- `generateUserPresignedDownloadUrl(key)` — Authenticated user presigned download URL.
- `generatePublicPresignedDownloadUrl(key)` — Anonymous user presigned download with rate limiting. Limit configurable via `NEXT_PUBLIC_DAILY_IMAGE_DOWNLOAD_LIMIT` env (default: 100/day). Admins bypass rate limit.
- AuthN/AuthZ: Admin actions require `isAdmin()`. User actions require `getSession()`. Public actions use IP-based rate limiting via `checkRateLimit` with `getClientIPFromHeaders`.
- Validation: All inputs validated via zod schemas. Returns `actionResponse.badRequest` on validation errors.
- Constants: `PRESIGNED_UPLOAD_EXPIRES_IN = 300` (5min), `PRESIGNED_DOWNLOAD_EXPIRES_IN = 300` (5min), `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`.

Best Practices:

Uploads:
- Do not use client-side SDK for uploads. Route all uploads through server actions or route handlers.
- Client-originated uploads (browser/mobile): Prefer presigned URL flow so client PUTs directly to R2. Choose action based on user type:
  - Authenticated users → `generateUserPresignedUploadUrl` (auto-isolates by userId)
  - Admins → `generateAdminPresignedUploadUrl` (full control over path)
  - Anonymous → `generatePublicPresignedUploadUrl` (rate limited)
- Server-side-only uploads (AI output, transforms, imports): Prefer `serverUploadFile(...)` to avoid presign hop.
- Selection rule: Client-held files → presigned. Server-produced bytes → `serverUploadFile`.
- Always validate contentType/size. Use `lib/validations.ts` for file constraints.
- Never trust client-provided keys or paths. Always generate keys with `generateR2Key`.
- Persist both `key` and `publicObjectUrl` in your DB for each uploaded file.

Downloads:
- For client-side downloads, import helpers from `lib/cloudflare/r2-download.ts`. These handle presigned URL generation, browser download triggers, and error handling automatically.
- Choose download method based on user type:
  - Admins → `downloadFileAsAdmin(key)` (no rate limits)
  - Authenticated users → `downloadFileAsUser(key)` (no rate limits)
  - Anonymous → `downloadFileAsPublic(key)` (rate limited)
- Use `downloadFileFromUrl(fullPath, mode)` when you have a full URL and need to extract the key automatically.
- All download methods provide user feedback via toast notifications and fallback to opening files in new tab if direct download fails.
- For programmatic/server-side downloads, use the presigned download URL server actions directly (`generateAdminPresignedDownloadUrl`, etc.) and implement custom logic.

General:
- Ensure `next.config.mjs` `images.remotePatterns` includes `R2_PUBLIC_URL` hostname (already configured).
