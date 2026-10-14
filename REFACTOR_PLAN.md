# Podbbang Helper: source review and development plan

Reviewed October 12, 2026. Recommendation: improve the existing React/Vite client and Electron shell incrementally. The codebase is small enough that a framework rewrite would add migration work without addressing the main product problems.

Planning assumptions: continue supporting Windows and the web; keep the core experience usable without an account; prioritize reliable listening and a personal library. Estimates below are rough engineering effort for one developer, including targeted tests, and exclude store review and external API changes.

## Current application

| Area | What exists | Main limitation |
| --- | --- | --- |
| Discovery | Ranked channels, pagination, channel details, episode keyword search | No global channel search or category UI; errors resemble empty results |
| Listening | Persistent player, queue, seeking, speed, volume, saved positions | Playback intent, queue selection, and persistence can disagree |
| Library | Favorites and recent-channel hooks | Favorites have no UI; recent visits are recorded but not displayed |
| Downloads | Direct media link with a download attribute | No progress, cancellation, retry, download inventory, or offline library |
| Desktop | Electron wrapper and Windows package configuration | Renderer has Node access; preload is disconnected |
| Backend | Vercel proxy used by both clients | Repeated handlers, debug endpoints, limited validation and failure handling |
| Delivery | npm workspaces, lockfiles, an Azure workflow | Conflicting package-manager configuration and obsolete build steps |

The active flow is React UI → Vercel proxy → Podbbang API, with audio loaded from the media URL. `server/` is explicitly deprecated. Its download implementation is reference material, not an active feature. The server README's claim that Electron accesses the API directly conflicts with `webapp/src/data/repository.js`, which uses the same Vercel URL for both clients.

## Findings that should drive the refactor

### Highest priority: desktop boundary and release credentials

- `electronApp/main.js:10` disables context isolation and enables Node integration. A renderer compromise could reach native capabilities. Enable isolation, disable Node integration, enable sandboxing, and register a deliberately small preload API. Restrict navigation and new windows and add a Content Security Policy compatible with the actual media hosts.
- `electronApp/preload.js` is never configured in the window and references IPC handlers absent from the main process. Do not simply activate its arbitrary-path read/write methods. Replace these with explicit operations such as selecting a download directory and managing a known download ID.
- A PFX is tracked at `electronApp/assets/my-cert.pfx`, and `electronApp/package.json` contains a literal signing password. The script also references a different, nonexistent certificate path. Determine whether the certificate is an active signing identity; replace exposed credentials before further signing, move signing inputs to external secret storage, and exclude them from source and package output. Certificate validity and prior exposure were not assessed in this review.

### High priority: playback correctness

- `webapp/src/components/episode-list-item.jsx:28` selects an episode and appends it but never requests playback. A source-based reducer check confirmed that the initial Play action leaves `isPlaying` false.
- `webapp/src/contexts/audio-list-context.jsx:99` retains the old queue index when selecting an episode absent from the queue. Appending it afterward does not repair that index. A check selecting B after A produced current episode B with queue index 0 pointing to A. Repeated additions also create duplicate episode IDs, which are used as React keys.
- `webapp/src/components/modern-audio-player.jsx:81` synchronizes playback only when `isPlaying` changes. Changing the media source while that flag stays true does not explicitly restart playback. Its ended handler sets playback false and selects the next episode without starting it. These lifecycle paths need browser tests.
- Both the provider and player instantiate `usePlaybackPosition` and write independent snapshots of the same storage map. The restore effect also depends on the saved position changing, so ongoing saves can trigger seeking again. Use a single persistence owner and restore once per loaded source.
- `webapp/src/hooks/use-persisted-state.js:60` discards a pending debounced write on unmount. Pause saves are also throttled. Flush progress on pause, episode switch, page hide, and desktop close; represent completion separately from a position of zero.

### High priority: API and loading behavior

- `webapp/src/data/repository.js:15` hardcodes the deployed proxy URL. Its fetch functions do not check HTTP status or validate response shapes. A mocked HTTP 500 was returned as successful data; `use-channel.js:62` can then set episodes to undefined, which the view reads using `.length`.
- Episode keywords are interpolated without query encoding, and the requested limit is ignored. A check with keyword `a&sort=asc` generated an extra query parameter; requesting 50 episodes still generated `limit=20`.
- Channel and ranking hooks do not cancel or guard stale requests. Rapid navigation or searches can overwrite newer results. Channel metadata is fetched again for every episode page and search. Zero-result counts are ignored by truthiness checks, leaving stale pagination.
- `webapp/src/components/channel-list.jsx:103` generates only page numbers 1–10 before filtering around the current page. Numbers above 10 never appear; sufficiently late pages show none. Share one correct pagination component and keep page/search state in the URL.
- Proxy handlers duplicate headers and URL construction, forward query parameters without a defined schema, lack explicit timeouts, and generally collapse upstream failures to HTTP 500. Retain the three client-facing routes while sharing a validated upstream client underneath them.

### Delivery and user experience

- `.github/workflows/main_podbbanghelper.yml:22` uses Node 14 and old actions. Its optional build/test commands do not match current scripts, allowing checks to be skipped. Modernize CI around the actual Vite and Windows outputs.
- npm workspaces name the real applications, while `pnpm-workspace.yaml` points to nonexistent `packages/*`. Several package-manager lockfiles coexist. Standardize on npm and a root lockfile unless there is a concrete reason to switch.
- The web lint script lacks declared ESLint/config dependencies; there is no application test runner or test script. Files named test under the proxy are HTTP diagnostic handlers, not automated tests.
- Replace stale Create React App READMEs, metadata, and missing manifest/icon references. Restore React StrictMode after making effects safe to repeat.
- The seek bar and queue items are clickable divs without equivalent keyboard controls. Preserve existing theme tokens, add semantic controls and focus management, and verify the persistent player at narrow widths.

## Target architecture

Keep the current workspace names during the initial fixes. Organize the web application by product responsibility as files are touched:

```text
webapp/src/
  app/                  routing, providers, application shell
  features/
    discovery/          rankings, channels, search
    library/            favorites, subscriptions, history
    player/             audio controller, queue reducer, player UI
    downloads/          platform-neutral download views
    settings/           language, theme, backup, preferences
  services/
    api/                HTTP client, response validation, query hooks
    persistence/        versioned records and migrations
    platform/           browser and Electron capability adapters
  shared/ui/            buttons, pagination, loading/error states

electronApp/            main process, narrow preload, native services
vercel-proxy/           thin routes and shared upstream request handling
```

Introduce TypeScript first at API, persistence, and IPC boundaries, then migrate components as they change. Define stable Channel, Episode, QueueEntry, PlaybackProgress, and DownloadJob models. A queue entry needs its own ID if intentional repeats are supported.

Use a query cache such as TanStack Query for server data, cancellation, and retries. Keep playback state separate: an explicit reducer and a single audio controller are sufficient initially. Split rapidly changing progress subscriptions from library and navigation state so every audio update does not invalidate unrelated consumers.

Retain localStorage for small settings. Move growing library/history records to IndexedDB behind a repository interface. Migrate existing `podbbang_*` values with schema validation, an exportable backup, and a migration version; never silently discard the user's queue. Keep downloaded audio in managed desktop files. Browser media storage is a separate capability with quota and CORS constraints.

## Delivery roadmap

| Phase | Work and user benefit | Rough effort | Completion criteria |
| --- | --- | --- | --- |
| 1. Reliable baseline | Fix Play/next/index bugs, unify progress saving, handle API failures, fix pagination, secure Electron, repair build and signing configuration | 5–8 days | Clicking Play starts audio; next advances and plays; resume survives restart; failed requests show retry; CI builds web and an unsigned Windows smoke package |
| 2. Maintainable core | Typed models, shared API/proxy client, request cancellation/cache, persistence migrations, platform adapter, shared controls | 4–7 days | Old saved data migrates; stale responses cannot replace the current view; proxy contract tests pass; browser and desktop share feature logic |
| 3. Personal library | Favorite channels/episodes, recent channels, Continue Listening, history, played/unplayed state, local subscriptions and latest-episode inbox | 5–8 days | Saved items are discoverable after restart; progress badges agree with the player; followed-channel refresh is bounded and handles failures |
| 4. Better listening | Skip back/forward, sleep timer, Play Next, queue remove/reorder/clear, timestamp bookmarks, per-channel speed, media keys | 4–6 days | Queue operations preserve the active episode; sleep timer pauses correctly; controls work by keyboard; media-session actions work on supported platforms |
| 5. Managed downloads | Up to three parallel transfers, persistent FIFO queue, progress/status, cancel/retry, batch selection, and a custom folder | Implemented locally | Queue limit and recovery are implemented; verify real-media transfers and Store package behavior before release. Offline playback, disk usage/deletion, and auto-download rules remain future work |
| 6. Discovery and polish | Global search/category filters after API validation, sort/filter controls, Korean/English UI, responsive layouts, accessible dialogs, import/export | 4–7 days | Korean search encodes correctly; navigation preserves filters; controls pass keyboard checks; backup round-trip preserves library and settings |

Phases 1–3 make a coherent first release: dependable playback plus a useful Library and Continue Listening screen. The initial listening controls and managed download queue are in place; editable playback-queue ordering, media keys, and offline download playback remain future work.

Start discovery research during phase 2: verify which search, category, sorting, and media endpoints actually work and which require authentication. Do not promise unavailable server capabilities. Local favorites, bookmarks, history, and queue improvements can proceed independently.

For downloads, use bounded native streaming and atomic completion. Support HTTP range resume only where the upstream server supports it; otherwise restart visibly. The legacy downloader references an undefined `getEpisodes` and hardcodes show metadata, so reuse its requirements rather than moving the implementation into Electron unchanged. A browser download link may navigate instead of saving when cross-origin download restrictions apply.

The focused [download manager plan](DOWNLOAD_PLAN.md) records the download slice: three concurrent transfers, a persistent FIFO queue, transfer status, and a custom destination folder, with cancellation/retry and Windows package acceptance checks.

Later options: optional cross-device sync, a browser PWA with deliberate storage limits, transcripts, and transcript search. Sync introduces identity and conflict handling; transcription introduces media availability, processing cost, and language-quality work. Validate demand and service support before scheduling these.

## Verification and rollout

Add tests that protect real behavior:

1. Reducer/controller: first Play, switching while playing, end-of-queue, removing/reordering the active item, repeat policy, failed `play()`, source errors, and resume after metadata.
2. Persistence: existing-data migration, malformed data, two rapid updates, episode-switch and close flushing, completion state, quota failure, and backup restore.
3. API/proxy: Korean and reserved characters, limits, zero results, 404/429/5xx, timeout, malformed JSON, unsupported methods, and late-response cancellation.
4. Browser journeys with mocked API/media fixtures: discover → channel → play → queue → reload → resume; offline/error recovery; keyboard navigation. Use Vitest/React Testing Library and a small Playwright suite.
5. Windows package smoke check: local assets and routing, isolated renderer, media playback, external links, and later download cancellation/recovery. Signed release validation remains a separate release step.

Keep changes vertical: the first slice addresses playback, API reliability, desktop safety, and the existing Library data. Preserve current endpoint URLs during any proxy consolidation. Confirm deployment usage before removing alternate routes or the obsolete Azure workflow. Keep storage migrations backward-aware and make backups usable if a release needs to be rolled back.

## Implementation status

The first implementation slice now includes:

- A Library page for saved channels, saved episodes, recent channels, and saved listening progress.
- Favorite controls on channel and episode cards; saved data continues using existing `podbbang_*` storage keys.
- Queue selection that starts playback and keeps the current index aligned; remove and clear actions work with keyboard controls, and duplicate additions are ignored.
- Playback position restoration, save on pause and track change, save before the window closes, accessible range seeking, 15-second skip, and sleep timers.
- API timeouts, HTTP and payload error messages, encoded query parameters, configurable proxy URLs, request cancellation, and retry states.
- Electron context isolation, disabled renderer Node access, a narrow preload surface, navigation restrictions, and a Content Security Policy.
- Separate Vite output bases for browser deployment and Electron file URLs, plus app artwork fallbacks and the local proxy URL example.
- Web CI now installs the npm workspace on Node 20 and runs the actual Vite build; its release archive omits the signing certificate.

The broader roadmap is not complete: offline playback integration, subscriptions, API caching, TypeScript migration, backup/import, history migration to IndexedDB, automated tests, and signed Windows release validation remain future work. Managed downloads now have a local implementation; real transfer behavior and packaged Windows access still need review. Signed desktop builds still need a newly provisioned certificate outside source control.

## Review evidence and limits

Reviewed the active web source, Electron shell/preload and packaging configuration, proxy handlers, deprecated server, workspace manifests, and CI workflow. Ran source-based reducer checks and mocked repository fetches; these reproduced the Play/index and HTTP/query defects above. `npm ci --dry-run --ignore-scripts --no-audit --no-fund` succeeded against the root lockfile.

Dependencies were not installed during implementation. No production build, browser/audio session, signed Windows package, live Podbbang request, deployment, or certificate-validity check was performed. The implementation remains unverified at runtime; the source-level race and file-loading behavior needs the targeted validation described above. An automatic review policy blocked deleting the tracked certificate from the working tree, so the package filter excludes it but the repository still requires credential rotation and cleanup. The code changes are the first delivery slice; this document tracks the rest of the roadmap.
