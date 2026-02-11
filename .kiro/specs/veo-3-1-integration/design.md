
## Short-term: Generation history via `activity_logs.metadata`

### Goal
Store enough information in `activity_logs.metadata` to support a basic “My Generations” experience without introducing new tables or running DB migrations.

Requirements:
- User can view a list of their generation attempts.
- For successful generations, show generated asset URL(s) (e.g. video URL).
- For failed generations, store a stable failure reason for UI + an internal message for debugging.
- Client-facing error messages must not reveal upstream/provider details.

### Why `metadata (jsonb)`
We already have `activity_logs.metadata` as `jsonb` with default `{}`.
Using `metadata` enables:
- No schema migration / minimal risk.
- Flexible payload (different models return different fields).
- Backward compatibility (older logs simply won’t have new keys).

Trade-offs:
- We must enforce a consistent shape at the application layer.
- Analytics/filters on JSON fields require extra SQL/indexing later if needed.

### Metadata schema conventions
All generation-related activity logs should follow a consistent `metadata` structure.

Common keys:
- `taskId`: string (for async jobs; recommended for all video/image jobs)
- `modelId`: string
- `prompt`: string (optional; consider truncating)
- `creditsUsed`: number (optional)
- `provider`: string (optional, internal)
- `generationType`: string (optional, e.g. Veo `TEXT_2_VIDEO`)
- `aspectRatio`: string (optional)

Success keys:
- `resultUrls`: string[] (URLs of generated assets)
- `hasAudioList`: boolean[] (optional, Veo)

Failure keys:
- `reason`: one of
  - `invalid_input`
  - `insufficient_credits`
  - `upload_failed`
  - `upstream_failed`
  - `timeout`
  - `unknown`
- `errorMessageInternal`: string (internal only; never display directly to end users)
- `errorCodeInternal`: string | null (optional)
- `httpStatus`: number | null (optional)

### Activity log actions
Use clear action names so UI can filter and render the list.

Video:
- `video_generation_started`
- `video_generation_succeeded`
- `video_generation_failed`

Image:
- `image_generation_started`
- `image_generation_succeeded`
- `image_generation_failed`

Music (optional):
- `music_generation_started`
- `music_generation_succeeded`
- `music_generation_failed`

### Where to write logs

#### 1) “Started” log
Write in generation endpoints when a job/task is created and credits are deducted.

Example metadata:
```json
{
  "taskId": "...",
  "modelId": "veo-3.1-fast",
  "prompt": "...",
  "creditsUsed": 100,
  "generationType": "TEXT_2_VIDEO",
  "aspectRatio": "16:9"
}
```

#### 2) “Succeeded/Failed” log
For async jobs, the generation endpoint often returns only `taskId`.
The final `resultUrls` are only known when polling status.

Implementation plan:
- In the status polling API (e.g. `app/api/kie/status/route.ts`), when a task transitions to:
  - `success`: create `*_generation_succeeded` log with `resultUrls`.
  - `failed`: create `*_generation_failed` log with `reason` and `errorMessageInternal`.

To prevent duplicates:
- Check whether a success/fail log for the same `taskId` already exists before inserting, OR
- Add a stable `resourceId = taskId` and query by `(userId, action, resourceId)`.

### UI usage notes
Short-term UI can render a “Generations” list by querying `activity_logs`:
- Filter actions by `*_generation_*`
- Group by `metadata.taskId` if needed
- Display rules:
  - If `action` ends with `succeeded`: show `metadata.resultUrls[0]` as preview
  - If `action` ends with `failed`: show a generic “Generation failed” with optional mapping from `metadata.reason` to a user-friendly message

Important:
- Do not display `errorMessageInternal` to end users.

### Security & privacy
- Never store secrets in `metadata`.
- Keep `errorMessageInternal` minimal (truncate), and ensure it does not include sensitive provider information if logs are user-visible.
- Continue returning generic error messages from public APIs.

### Future evolution
When we need richer querying, deduplication, and a true “assets library”, introduce a dedicated `generations` table with indexed columns (`userId`, `status`, `type`, `modelId`, `createdAt`) and store `resultUrls` there.

