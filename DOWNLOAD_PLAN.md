# Download manager plan

Status: implemented locally; packaged-app behavior and an end-to-end transfer exercise remain before release.

## Current behavior

`webapp/src/components/episode-list-item.jsx` uses an `<a download target="_blank">` for media. The Electron window-opening handler can send that URL to an external browser. There is no app-owned queue, transfer status, or destination setting. Cross-origin links also do not reliably honor the browser's `download` attribute.

Implement the desktop manager in Electron's main process and connect the existing React interface through a narrow preload API. Keep the listening queue separate from the download queue. The deprecated `server/data/download-utils.js` is not suitable for reuse: it buffers entire files and relies on incomplete legacy dependencies.

## User experience

| Requirement | Proposed behavior |
| --- | --- |
| Up to three parallel downloads | Start up to three episode transfers globally, across all channels. Additional episodes wait. Download one episode from its card, or select multiple episodes and choose Download selected. |
| Download queue | FIFO ordering, with queued items starting automatically when a slot opens. A Downloads page shows active transfers, waiting items, and history. Users can cancel waiting/active items, retry failures, and clear finished history without deleting files. |
| Download status | Episode cards show Queued, Downloading, Downloaded, or Failed. The Downloads page shows queue position, bytes transferred, percentage when the server supplies a trustworthy total, transfer speed, and estimated time when calculable. Unknown totals show bytes and an indeterminate indicator. Completed items offer Show in folder; failures show a useful reason and Retry. |
| Custom folder | A native Choose folder action in Downloads settings. Default to `Downloads/Podbbang Unofficial`. Display the current destination and persist it across app restarts. Changing it affects newly added jobs; existing jobs retain their saved destination. |

Batch selection applies to explicitly selected episodes, with Select all on this page. Retain selection by channel/episode ID across episode pages in the current channel, and show the selected count. Reset selection when leaving the channel. Do not silently fetch and download a channel's entire catalog.

Repeated clicks must not create duplicate active or queued jobs for the same channel/episode. Completed episodes show their saved state; if the file has been moved or removed, offer Download again. Use a title plus episode ID for readable filenames, sanitize Windows-reserved characters/names, and allocate a collision-safe path without overwriting existing files.

## Architecture and delivery sequence

### 1. Native manager and file handling

- Add an Electron download-manager module with a global three-slot scheduler and an explicit job lifecycle: queued → downloading → completed/failed/canceled. A job interrupted by shutdown or a crash becomes interrupted on restoration.
- Stream responses to disk with backpressure rather than buffering audio in memory. Write a uniquely owned `.part` file and rename it within the same directory only after a successful transfer and available length checks. Reject error responses and unexpected HTML responses instead of saving an error page as audio.
- Free a transfer slot only after its request and output stream have settled, including cancellation and retry, so retries cannot exceed the limit. Cancel aborts the network request, closes the file, and removes only that job's partial file.
- Validate HTTP(S) media URLs and redirect targets, enforce timeouts and bounded redirects, and reject unsupported schemes. Keep filesystem paths and file-opening operations in the main process. Resolve media from episode metadata where possible; if a signed URL expires, refresh it through the existing repository flow or present an actionable retry error.
- Expose validated IPC methods for enqueue, snapshot, cancel, retry, choose folder, reveal completed file, and clear finished history. Validate the sending frame and job identifiers; do not expose generic filesystem or shell access. Publish throttled status events and provide an unsubscribe function.

### 2. Persistence and folder settings

- Store versioned job metadata and settings atomically under Electron's user-data directory, outside the selected audio folder. Persist job ID, episode/channel identity and title, media reference, state, timestamps, destination, received/total bytes, and last error. Do not persist secrets in diagnostic logs.
- Serialize metadata writes; persist state transitions immediately and checkpoint progress at a bounded frequency. Recover from malformed state using a retained last-known-good copy and a visible recovery message.
- Restore queued jobs on launch. Offer Restart interrupted for interrupted jobs; initial delivery restarts these from zero and safely cleans their owned partial files. Do not claim byte-level resume.
- If downloads are pending when the user exits, offer Keep downloading or Quit and save queue. Quitting aborts transfers, saves state, and exits; no background service or hidden tray behavior is required for this release.
- Verify a chosen folder can accept files. Folder cancellation preserves the previous preference. Handle unavailable drives, revoked access, disk-full errors, and destination collisions with clear job errors; do not silently save somewhere else. Existing failed/queued jobs can explicitly be reassigned to the current folder before retrying.

### 3. React integration

- Replace the desktop anchor with an enqueue button and per-episode status. Add batch selection to the channel episode list and a Downloads navigation entry with active/waiting counts.
- Add a dedicated download-state provider/hook, Downloads page, and folder setting. Initialize from a native snapshot and subscribe to updates without losing events during initialization; a revisioned event/snapshot protocol can prevent stale replacements.
- Preserve status across navigation and renderer reloads. Keep frequent transfer updates scoped to download subscribers so playback and channel browsing remain responsive.
- Provide keyboard-operable controls, accessible progress indicators, and restrained status announcements. Disable unavailable actions and explain failures inline.
- In the browser build, label the fallback Open audio/download in browser; native queue, folder access, and persistent desktop transfers are Electron capabilities. Guard access to the preload API so the web build continues working.

### 4. Verification and Windows release

- Use a controllable local HTTP fixture to verify seven queued episodes create exactly three active transfers and the remaining four start as slots become free. Include cancel/retry races, duplicate enqueues, slow responses, redirects, unknown length, interrupted responses, and HTTP errors.
- Verify streaming keeps memory bounded for large files; partial files never appear as completed audio; collisions never overwrite user files; failed/canceled jobs release resources and slots.
- Verify navigation/reload retains status, queue restoration after crash/exit is consistent, and no job starts twice. Verify unavailable folders, disk-write errors, Unicode and long/reserved Windows filenames, and changing folders while jobs are active.
- Exercise single and batch downloads, progress, cancellation, retries, folder selection, and restart locally with real available episodes. Confirm playback remains usable during three transfers.
- Build both web and Windows packages. Smoke-test the packaged app's folder access, persistence, download controls, and existing Store identity/version checks. Rebuild the Store artifact after implementation; the currently built 0.1.4.0 package does not contain this feature. Submission follows local review and the release approval flow already in progress.

## Scope boundaries

First delivery includes all four requested capabilities plus cancellation, retry, persistent history, and safe interruption recovery. Manual reordering, pause/resume, automatic subscription downloads, offline playback integration, file deletion/disk management, and background downloading after exit remain separate enhancements. True resume requires verified HTTP range and validator support; a server returning a full response must never be appended to an existing partial file.

Acceptance example: select twelve episodes, enqueue once, see three downloading and nine queued, cancel one active job and see the next queued job start, then choose another folder and enqueue another episode there. Restart the app and see accurate completed history, saved queued destinations, and interrupted items that can be restarted safely.

## Implementation record

The current working tree adds:

- `electronApp/download-manager.js`: a three-slot FIFO scheduler, streamed HTTP(S) transfers, progress events, cancellation/retry, collision-safe filenames, `.part` cleanup, persistent job metadata with a backup, and recovery of active jobs as interrupted.
- `electronApp/main.js` and `electronApp/preload.js`: validated main-window IPC, native folder selection, file reveal, and a quit prompt that preserves queued jobs while marking active transfers interrupted.
- `webapp/src/contexts/downloads-context.jsx`: revision-aware snapshots, per-episode progress subscriptions, and channel-scoped multi-selection.
- `webapp/src/components/downloads.jsx` and its stylesheet: queue/history, progress, speed/ETA, status, retry/cancel, destination selection, and clearing history without deleting audio.
- Episode cards and channel pages: managed downloads, per-episode status, page selection, and multi-download across episode pages.

The web production build and Node syntax checks pass, and the Store package verifier accepts the rebuilt package. The Electron development app has been launched locally for review. Packaged-app access and real-media transfer behavior still need review; true resume is intentionally not included because upstream range behavior has not been established.
