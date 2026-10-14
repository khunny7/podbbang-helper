const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);
const MAX_PARALLEL_DOWNLOADS = 3;
const MAX_REDIRECTS = 5;
const PROGRESS_INTERVAL_MS = 300;
const NO_HARD_LINK_CODES = new Set(['EPERM', 'EACCES', 'ENOTSUP', 'EOPNOTSUPP', 'EXDEV', 'EINVAL']);

const cleanText = (value, fallback, limit = 500) => {
  const text = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return (text || fallback).slice(0, limit);
};

const sanitizeFilename = (value, fallback, limit = 120) => {
  let name = cleanText(value, fallback, limit + 20)
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)) {
    name = `_${name || fallback}`;
  }
  return name.slice(0, limit);
};

const userFacingDownloadError = error => {
  if (error.code === 'ENOSPC') return 'There is not enough free space in the download folder.';
  if (error.code === 'EACCES' || error.code === 'EPERM') return 'Windows denied access to the download folder. Choose a folder you can write to.';
  if (error.code === 'ENAMETOOLONG') return 'The destination path is too long. Choose a folder closer to the drive root.';
  if (['ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND'].includes(error.code)) {
    return 'The network connection was interrupted. Check your connection and retry.';
  }
  if ([401, 403, 404].includes(error.statusCode)) return 'The episode audio link expired or is unavailable. Reopen the episode and retry.';
  return cleanText(error.message, 'Download failed.', 500);
};

const validateUrl = value => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('The episode audio link is invalid.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('The episode audio link uses an unsupported address.');
  }
  return url;
};

const chooseExtension = (url, contentType) => {
  const allowed = new Set(['.mp3', '.m4a', '.mp4', '.aac', '.ogg', '.opus', '.wav', '.flac']);
  const fromUrl = path.extname(url.pathname).toLowerCase();
  if (allowed.has(fromUrl)) return fromUrl;
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  const extensions = {
    'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a',
    'audio/aac': '.aac', 'audio/ogg': '.ogg', 'audio/opus': '.opus',
    'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/flac': '.flac',
    'video/mp4': '.m4a', 'application/octet-stream': '.mp3',
  };
  return extensions[type] || '.mp3';
};

const requestMedia = (value, signal, redirects = 0) => new Promise((resolve, reject) => {
  let url;
  try {
    url = validateUrl(value);
  } catch (error) {
    reject(error);
    return;
  }
  const client = url.protocol === 'https:' ? https : http;
  const request = client.get(url, {
    headers: { 'User-Agent': 'PodbbangUnofficial/0.1', Accept: 'audio/*,application/octet-stream;q=0.9,*/*;q=0.1' },
  }, response => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      signal.removeEventListener('abort', abort);
      const location = response.headers.location;
      response.resume();
      if (!location || redirects >= MAX_REDIRECTS) {
        reject(new Error('The audio server returned too many redirects.'));
        return;
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, url).toString();
        validateUrl(nextUrl);
      } catch {
        reject(new Error('The audio server redirected to an unsupported address.'));
        return;
      }
      requestMedia(nextUrl, signal, redirects + 1).then(resolve, reject);
      return;
    }
    response.once('close', () => signal.removeEventListener('abort', abort));
    resolve({ response, url });
  });
  const abort = () => request.destroy(new Error('Download canceled.'));
  if (signal.aborted) abort();
  else signal.addEventListener('abort', abort, { once: true });
  request.setTimeout(30000, () => request.destroy(new Error('The audio server stopped responding.')));
  request.once('error', error => {
    signal.removeEventListener('abort', abort);
    reject(error);
  });
});

class DownloadManager {
  constructor({ app, dialog, shell, getWindow, onChange }) {
    this.app = app;
    this.dialog = dialog;
    this.shell = shell;
    this.getWindow = getWindow;
    this.onChange = onChange;
    this.jobs = [];
    this.active = new Map();
    this.folder = path.join(app.getPath('downloads'), 'Podbbang Unofficial');
    this.revision = 0;
    this.writeChain = Promise.resolve();
    this.closing = false;
  }

  get stateFile() { return path.join(this.app.getPath('userData'), 'downloads.json'); }
  get backupFile() { return `${this.stateFile}.bak`; }

  async initialize() {
    await fs.promises.mkdir(this.app.getPath('userData'), { recursive: true });
    let saved;
    try {
      saved = JSON.parse(await fs.promises.readFile(this.stateFile, 'utf8'));
    } catch (primaryError) {
      try {
        saved = JSON.parse(await fs.promises.readFile(this.backupFile, 'utf8'));
        this.onChange({ type: 'recovery', message: 'The last saved download history was restored.' });
      } catch (backupError) {
        if (primaryError.code !== 'ENOENT' || backupError.code !== 'ENOENT') {
          this.onChange({ type: 'recovery', message: 'Download history could not be read. A new history file will be created.' });
        }
      }
    }
    if (saved && typeof saved === 'object') {
      if (typeof saved.folder === 'string' && path.isAbsolute(saved.folder)) this.folder = saved.folder;
      if (Array.isArray(saved.jobs)) {
        this.jobs = saved.jobs.filter(job => job && typeof job.id === 'string' && typeof job.episodeKey === 'string')
          .map(job => ({
            ...job,
            status: job.status === 'downloading' ? 'interrupted' : job.status,
            queuedAt: job.queuedAt || job.createdAt,
            bytesReceived: Number(job.bytesReceived) || 0,
            totalBytes: Number(job.totalBytes) || 0,
          }))
          .slice(-500);
      }
    }
    for (const job of this.jobs) {
      job.controller = undefined;
      job.speedBytesPerSecond = 0;
      if (job.status === 'interrupted') {
        const partPath = path.join(job.folder || this.folder, `.podbbang-${job.id}.part`);
        await fs.promises.rm(partPath, { force: true }).catch(() => {});
      }
      if (job.status === 'completed' && job.filePath) {
        try { await fs.promises.access(job.filePath); }
        catch { job.fileMissing = true; }
      }
    }
    this.publish('snapshot');
    await this.persist();
    this.pump();
  }

  publicJob(job) {
    const { controller, cancelRequested, partPath, ...visible } = job;
    return visible;
  }

  snapshot() {
    return {
      revision: this.revision,
      folder: this.folder,
      maxParallel: MAX_PARALLEL_DOWNLOADS,
      jobs: this.jobs.map(job => this.publicJob(job)),
    };
  }

  publish(type = 'update', extra = {}) {
    this.revision += 1;
    this.onChange({ type, revision: this.revision, ...extra, state: this.snapshot() });
  }

  async persist() {
    const snapshot = JSON.stringify({ version: 1, folder: this.folder, jobs: this.jobs.map(job => this.publicJob(job)) });
    const tempFile = `${this.stateFile}.${process.pid}.tmp`;
    this.writeChain = this.writeChain.catch(() => {}).then(async () => {
      await fs.promises.mkdir(path.dirname(this.stateFile), { recursive: true });
      await fs.promises.writeFile(tempFile, snapshot, 'utf8');
      await fs.promises.copyFile(this.stateFile, this.backupFile).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
      await fs.promises.rename(tempFile, this.stateFile).catch(async error => {
        if (error.code === 'EEXIST' || error.code === 'EPERM') {
          await fs.promises.rm(this.stateFile, { force: true });
          try {
            await fs.promises.rename(tempFile, this.stateFile);
          } catch (replaceError) {
            await fs.promises.copyFile(this.backupFile, this.stateFile).catch(() => {});
            throw replaceError;
          }
          return;
        }
        throw error;
      });
    });
    return this.writeChain;
  }

  async changeState(job, status, error = null) {
    job.status = status;
    job.error = error;
    job.updatedAt = new Date().toISOString();
    this.publish('update');
    await this.persist();
  }

  findJob(jobId) { return this.jobs.find(job => job.id === jobId); }

  findByEpisodeKey(episodeKey) {
    return this.jobs.filter(job => job.episodeKey === episodeKey)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  }

  async enqueue(input) {
    const [job] = await this.enqueueMany([input]);
    return job;
  }

  async enqueueMany(inputs) {
    if (!Array.isArray(inputs) || inputs.length > 500) throw new Error('The selected episode list is invalid.');
    const prepared = inputs.map(input => {
      if (!input || typeof input !== 'object') throw new Error('Episode details are missing.');
      const url = validateUrl(input.mediaUrl);
      const episodeId = cleanText(input.episodeId, '', 100);
      const channelId = cleanText(input.channelId, '', 100);
      if (!episodeId || !channelId) throw new Error('The episode or channel ID is missing.');
      return { input, url: url.toString(), episodeId, channelId, episodeKey: `${channelId}:${episodeId}` };
    });

    const result = [];
    let changed = false;
    for (const item of prepared) {
      const { input, url, episodeId, channelId, episodeKey } = item;
      const existing = this.findByEpisodeKey(episodeKey);
      if (existing && ['queued', 'downloading', 'completed'].includes(existing.status) && !existing.fileMissing) {
        if (existing.status === 'completed') {
          try { await fs.promises.access(existing.filePath); }
          catch { existing.fileMissing = true; }
        }
        if (!existing.fileMissing) {
          result.push(this.publicJob(existing));
          continue;
        }
      }

      const job = existing && ['failed', 'canceled', 'interrupted', 'completed'].includes(existing.status)
        ? existing
        : { id: crypto.randomUUID(), episodeKey, createdAt: new Date().toISOString() };
      Object.assign(job, {
        episodeKey,
        episodeId,
        channelId,
        title: cleanText(input.title, 'Untitled episode'),
        channelTitle: cleanText(input.channelTitle, 'Podbbang'),
        image: cleanText(input.image, '', 2000) || '',
        mediaUrl: url,
        status: 'queued',
        folder: this.folder,
        bytesReceived: 0,
        totalBytes: 0,
        speedBytesPerSecond: 0,
        error: null,
        filePath: null,
        fileMissing: false,
        updatedAt: new Date().toISOString(),
        queuedAt: new Date().toISOString(),
      });
      if (!existing || job !== existing) this.jobs.push(job);
      result.push(this.publicJob(job));
      changed = true;
    }

    if (!changed) return result;
    const terminal = this.jobs.filter(item => ['completed', 'failed', 'canceled'].includes(item.status))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const keep = new Set(terminal.slice(0, 500).map(item => item.id));
    this.jobs = this.jobs.filter(item => !['completed', 'failed', 'canceled'].includes(item.status) || keep.has(item.id));
    this.publish('update');
    await this.persist();
    this.pump();
    return result.map(job => {
      const current = this.findJob(job.id);
      return current ? this.publicJob(current) : job;
    });
  }

  async chooseFolder() {
    const window = this.getWindow();
    const result = await this.dialog.showOpenDialog(window, {
      title: 'Choose download folder',
      defaultPath: this.folder,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths?.[0]) return this.snapshot();
    const nextFolder = path.resolve(result.filePaths[0]);
    await fs.promises.mkdir(nextFolder, { recursive: true });
    const probe = path.join(nextFolder, `.podbbang-write-check-${crypto.randomUUID()}`);
    try {
      await fs.promises.writeFile(probe, 'ok', { flag: 'wx' });
    } finally {
      await fs.promises.rm(probe, { force: true }).catch(() => {});
    }
    this.folder = nextFolder;
    this.publish('folder');
    await this.persist();
    return this.snapshot();
  }

  async cancel(jobId) {
    const job = this.findJob(jobId);
    if (!job || !['queued', 'downloading'].includes(job.status)) return this.snapshot();
    job.cancelRequested = true;
    if (job.status === 'queued') {
      await this.changeState(job, 'canceled');
      this.pump();
      return this.snapshot();
    }
    const active = this.active.get(jobId);
    if (active) active.abortController.abort();
    await this.changeState(job, 'canceled');
    return this.snapshot();
  }

  async retry(jobId) {
    const job = this.findJob(jobId);
    const missingCompletedFile = job?.status === 'completed' && job.fileMissing;
    if (!job || (!['failed', 'canceled', 'interrupted'].includes(job.status) && !missingCompletedFile)) return this.snapshot();
    const folder = job.folder || this.folder;
    try { await fs.promises.mkdir(folder, { recursive: true }); }
    catch { throw new Error('The saved download folder is unavailable. Choose a new folder and retry.'); }
    if (job.partPath) await fs.promises.rm(job.partPath, { force: true }).catch(() => {});
    job.folder = folder;
    job.bytesReceived = 0;
    job.totalBytes = 0;
    job.error = null;
    if (missingCompletedFile) job.filePath = null;
    job.cancelRequested = false;
    job.queuedAt = new Date().toISOString();
    await this.changeState(job, 'queued');
    this.pump();
    return this.snapshot();
  }

  async showFile(jobId) {
    const job = this.findJob(jobId);
    if (!job || job.status !== 'completed' || !job.filePath) throw new Error('The downloaded file is unavailable.');
    try { await fs.promises.access(job.filePath); }
    catch { job.fileMissing = true; this.publish('update'); await this.persist(); throw new Error('The downloaded file was moved or deleted.'); }
    this.shell.showItemInFolder(job.filePath);
    return this.snapshot();
  }

  async clearFinished() {
    this.jobs = this.jobs.filter(job => !['completed', 'failed', 'canceled'].includes(job.status));
    this.publish('update');
    await this.persist();
    return this.snapshot();
  }

  getPendingCount() {
    return this.jobs.filter(job => ['queued', 'downloading'].includes(job.status)).length;
  }

  pump() {
    if (this.closing) return;
    while (this.active.size < MAX_PARALLEL_DOWNLOADS) {
      const job = this.jobs
        .filter(item => item.status === 'queued' && !this.active.has(item.id))
        .sort((a, b) => String(a.queuedAt || a.createdAt).localeCompare(String(b.queuedAt || b.createdAt)))[0];
      if (!job) return;
      const abortController = new AbortController();
      this.active.set(job.id, { abortController });
      job.cancelRequested = false;
      job.status = 'downloading';
      job.updatedAt = new Date().toISOString();
      this.publish('update');
      this.persist().catch(() => {});
      this.run(job, abortController.signal);
    }
  }

  async reserveFile(job, extension) {
    await fs.promises.mkdir(job.folder, { recursive: true });
      const base = `${sanitizeFilename(job.channelTitle, 'Podbbang', 48)} - ${sanitizeFilename(job.title, 'Episode', 70)} [${sanitizeFilename(job.episodeId, 'episode', 32)}]`;
    let candidate = path.join(job.folder, `${base}${extension}`);
    let suffix = 2;
    while (true) {
      try { await fs.promises.access(candidate); candidate = path.join(job.folder, `${base} (${suffix++})${extension}`); }
      catch (error) { if (error.code === 'ENOENT') return candidate; throw error; }
    }
  }

  async run(job, signal) {
    try {
      job.partPath = path.join(job.folder, `.podbbang-${job.id}.part`);
      await fs.promises.mkdir(job.folder, { recursive: true });
      await fs.promises.rm(job.partPath, { force: true });
      const { response, url } = await requestMedia(job.mediaUrl, signal);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        const error = new Error(`The audio server returned HTTP ${response.statusCode}.`);
        error.statusCode = response.statusCode;
        throw error;
      }
      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        response.resume();
        throw new Error('The audio server returned a web page instead of an audio file. The link may have expired.');
      }
      const declaredLength = Number(response.headers['content-length']);
      job.totalBytes = Number.isFinite(declaredLength) && declaredLength > 0 ? declaredLength : 0;
      job.bytesReceived = 0;
      job.speedBytesPerSecond = 0;
      const finalPath = await this.reserveFile(job, chooseExtension(url, contentType));
      const output = fs.createWriteStream(job.partPath, { flags: 'wx' });
      let lastPublish = 0;
      let lastSpeedAt = Date.now();
      let lastSpeedBytes = 0;
      const meter = new Transform({
        transform: (chunk, encoding, callback) => {
          job.bytesReceived += chunk.length;
          const now = Date.now();
          if (now - lastSpeedAt >= 1000) {
            job.speedBytesPerSecond = Math.round(((job.bytesReceived - lastSpeedBytes) * 1000) / (now - lastSpeedAt));
            lastSpeedAt = now;
            lastSpeedBytes = job.bytesReceived;
          }
          if (now - lastPublish >= PROGRESS_INTERVAL_MS) {
            lastPublish = now;
            this.publish('progress');
            if (now % 2000 < PROGRESS_INTERVAL_MS) this.persist().catch(() => {});
          }
          callback(null, chunk);
        },
      });
      await pipelineAsync(response, meter, output);
      if (signal.aborted || job.cancelRequested) throw new Error('Download canceled.');
      if (job.bytesReceived === 0) throw new Error('The audio server returned an empty file.');
      if (job.totalBytes && job.bytesReceived !== job.totalBytes) {
        throw new Error('The download ended before the full audio file arrived.');
      }
      let committed = false;
      let collisionPath = finalPath;
      let suffix = 2;
      while (!committed) {
        try {
          await fs.promises.link(job.partPath, collisionPath);
          committed = true;
        } catch (error) {
          if (NO_HARD_LINK_CODES.has(error.code)) {
            try {
              await fs.promises.copyFile(job.partPath, collisionPath, fs.constants.COPYFILE_EXCL);
              committed = true;
            } catch (copyError) {
              if (copyError.code !== 'EEXIST') throw copyError;
            }
          } else if (error.code !== 'EEXIST') {
            throw error;
          }
          if (committed) break;
          const extension = path.extname(finalPath);
          const stem = finalPath.slice(0, -extension.length);
          collisionPath = `${stem} (${suffix++})${extension}`;
        }
      }
      await fs.promises.rm(job.partPath, { force: true });
      job.partPath = null;
      job.filePath = collisionPath;
      job.fileMissing = false;
      job.bytesReceived = job.bytesReceived;
      job.speedBytesPerSecond = 0;
      await this.changeState(job, 'completed');
    } catch (error) {
      if (job.partPath) await fs.promises.rm(job.partPath, { force: true }).catch(() => {});
      job.partPath = null;
      job.speedBytesPerSecond = 0;
      if (this.closing && job.status === 'interrupted') {
        // Shutdown preserves the interrupted state for an explicit restart.
      } else if (job.cancelRequested || signal.aborted) {
        if (job.status !== 'canceled') await this.changeState(job, 'canceled');
      } else {
        await this.changeState(job, 'failed', userFacingDownloadError(error));
      }
    } finally {
      this.active.delete(job.id);
      this.publish('update');
      await this.persist().catch(() => {});
      this.pump();
    }
  }

  async shutdown() {
    if (this.shutdownPromise) return this.shutdownPromise;
    this.closing = true;
    for (const job of this.jobs) {
      if (job.status === 'downloading') {
        job.status = 'interrupted';
        job.updatedAt = new Date().toISOString();
      }
    }
    for (const { abortController } of this.active.values()) abortController.abort();
    this.shutdownPromise = (async () => {
      await Promise.allSettled(Array.from(this.active.keys(), id => this.waitForJob(id)));
      await this.persist();
    })();
    return this.shutdownPromise;
  }

  waitForJob(jobId) {
    if (!this.active.has(jobId)) return Promise.resolve();
    return new Promise(resolve => {
      const check = () => this.active.has(jobId) ? setTimeout(check, 25) : resolve();
      check();
    });
  }
}

module.exports = { DownloadManager, MAX_PARALLEL_DOWNLOADS };
