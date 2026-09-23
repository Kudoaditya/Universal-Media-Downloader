const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

class QueueManager {
  constructor(binaryManager, getMainWindow, instagramAuth = null) {
    this.binaryManager = binaryManager;
    this.getMainWindow = getMainWindow;
    this.instagramAuth = instagramAuth;
    this.queue = [];
    this.activeProcesses = new Map(); // taskId -> childProcess
    this.maxConcurrent = 2;
  }

  emit(channel, data) {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }

  emitQueueUpdate() {
    this.emit('queue:updated', this.getItems());
  }

  getItems() {
    return this.queue.map(item => ({
      id: item.id,
      url: item.url,
      platform: item.platform,
      platformName: item.platformName,
      title: item.title,
      thumbnail: item.thumbnail,
      durationSec: item.durationSec,
      durationText: item.durationText,
      status: item.status,
      progress: item.progress,
      downloadedSize: item.downloadedSize,
      totalSize: item.totalSize,
      speed: item.speed,
      eta: item.eta,
      downloadDir: item.downloadDir,
      config: item.config,
      error: item.error,
      description: item.description,
      tags: item.tags,
      uploader: item.uploader,
      carousel: item.carousel || [],
      requiresInstagramAuth: item.requiresInstagramAuth || false,
    }));
  }


  addItem(data) {
    const taskId = data.id || `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const task = {
      id: taskId,
      url: data.url,
      platform: data.platform || 'auto',
      platformName: data.platformName || 'Web Media',
      title: data.title || `Media Ingestion: ${data.url.slice(0, 48)}...`,
      thumbnail: data.thumbnail || null,
      durationSec: data.durationSec || 180,
      durationText: data.durationText || '03:00',
      status: 'queued',
      progress: 0,
      downloadedSize: '0 MB',
      totalSize: 'Calculating',
      speed: '',
      eta: 'Ready to Download',
      downloadDir: data.downloadDir || path.join(require('os').homedir(), 'Downloads'),
      config: {
        trimStart: data.config?.trimStart || 0,
        trimEnd: data.config?.trimEnd || 0,
        format: data.config?.format || 'video_audio',
        resolution: data.config?.resolution || '1080p',
        audioBitrate: data.config?.audioBitrate || '320k',
      },
      error: null,
      description: null,
      tags: [],
      uploader: null,
      carousel: [],
    };

    // Instant YouTube detection & fast-path preview
    const ytMatch = task.url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
    if (ytMatch && ytMatch[1] && ytMatch[1].length >= 11) {
      const vidId = ytMatch[1];
      task.thumbnail = `https://i.ytimg.com/vi/${vidId}/maxresdefault.jpg`;
      task.platform = 'youtube';
      task.platformName = 'YouTube';

      // Fast oEmbed retrieval (under 200ms)
      this.fetchFastOEmbed(task, vidId);
    }

    // Direct Pinterest / Image link detection
    if (task.url.match(/https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.webp)/i) || task.url.includes('pinimg.com')) {
      task.thumbnail = task.url;
      task.platform = 'pinterest';
      task.platformName = 'Pinterest';
      task.durationText = 'Image';
      task.carousel = [
        { id: '1', url: task.url, thumbnail: task.url, isVideo: false, title: 'Original Image', ext: 'jpg' }
      ];
    }

    // Direct Instagram detection
    if (task.url.includes('instagram.com') || task.url.includes('instagr.am')) {
      task.platform = 'instagram';
      task.platformName = 'Instagram';
      if (!task.title || task.title.startsWith('Media Ingestion:')) {
        const shortcodeMatch = task.url.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
        const code = shortcodeMatch ? shortcodeMatch[1] : '';
        task.title = code ? `Instagram Post [${code}]` : 'Instagram Media Ingestion';
      }
    }


    this.queue.unshift(task);
    this.emitQueueUpdate();

    // Deep metadata fetching in background (description, tags, exact duration, carousels)
    this.fetchDeepMetadata(task);

    // NOTE: We do NOT auto-start download here!
    // The user selects a part (trim) or full version, configures options, then clicks Download.
    return task;
  }

  fetchFastOEmbed(task, vidId) {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`;
    https.get(oembedUrl, (res) => {
      if (res.statusCode !== 200) return;
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const info = JSON.parse(raw);
          if (info.title && task.title.startsWith('Media Ingestion:')) {
            task.title = info.title;
          }
          if (info.author_name) {
            task.uploader = info.author_name;
          }
          this.emitQueueUpdate();
        } catch (_) {}
      });
    }).on('error', () => {});
  }

  async fetchPinterestMetadata(task) {
    return new Promise((resolve) => {
      const getOptions = (urlStr) => {
        const u = new URL(urlStr);
        return {
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          }
        };
      };

      const handleReq = (urlStr) => {
        https.get(getOptions(urlStr), (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return handleReq(res.headers.location);
          }
          let html = '';
          res.on('data', d => html += d);
          res.on('end', () => {
            try {
              const ogImage = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1]
                || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i)?.[1];
              const ogTitle = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1]
                || html.match(/<title>([^<]+)<\/title>/i)?.[1];
              const ogDesc = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];

              // Extract all clean pinimg image candidates
              const pinImages = Array.from(new Set(
                (html.match(/https:\/\/i\.pinimg\.com\/(?:originals|[0-9]+x)\/[a-zA-Z0-9_\-\/]+\.(?:jpg|jpeg|png|webp)/gi) || [])
              ));

              if (ogTitle && task.title.startsWith('Media Ingestion:')) {
                task.title = ogTitle.replace(/\s*\|\s*Pinterest.*$/i, '').trim();
              }
              if (ogDesc) task.description = ogDesc;

              // Deduplicate by unique hash path:
              // Pinterest pages contain multiple resolution folders (170x, 236x, 474x, 564x, 736x, originals)
              // of the exact SAME image. We collapse each unique image path to its highest-quality /originals/ URL.
              const uniqueImageMap = new Map();

              if (ogImage) {
                const m = ogImage.match(/https:\/\/i\.pinimg\.com\/(?:originals|[0-9]+x)\/(.+?\.(?:jpg|jpeg|png|webp))/i);
                if (m) {
                  uniqueImageMap.set(m[1].toLowerCase(), `https://i.pinimg.com/originals/${m[1]}`);
                } else {
                  uniqueImageMap.set(ogImage.toLowerCase(), ogImage);
                }
              }

              for (const rawUrl of pinImages) {
                const m = rawUrl.match(/https:\/\/i\.pinimg\.com\/(?:originals|[0-9]+x)\/(.+?\.(?:jpg|jpeg|png|webp))/i);
                if (m) {
                  uniqueImageMap.set(m[1].toLowerCase(), `https://i.pinimg.com/originals/${m[1]}`);
                }
              }

              const validImages = Array.from(uniqueImageMap.values());

              if (validImages.length > 0) {
                task.thumbnail = validImages[0];
                task.carousel = validImages.map((u, i) => ({
                  id: String(i + 1),
                  url: u,
                  thumbnail: u,
                  isVideo: false,
                  title: validImages.length > 1 ? `Slide ${i + 1}` : 'Original Pin Image',
                  ext: u.endsWith('.png') ? 'png' : 'jpg',
                }));
                task.durationText = task.carousel.length > 1 ? `${task.carousel.length} Images` : 'Image';
                this.emitQueueUpdate();
              }
            } catch (_) {}
            resolve();
          });
        }).on('error', () => resolve());
      };

      try {
        handleReq(task.url);
      } catch (_) {
        resolve();
      }
    });
  }

  async fetchInstagramMetadata(task) {
    return new Promise((resolve) => {
      try {
        const u = new URL(task.url);
        const req = https.get({
          hostname: 'www.instagram.com',
          path: u.pathname,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }, (res) => {
          let html = '';
          res.on('data', d => html += d);
          res.on('end', () => {
            try {
              const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
              const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
              const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];

              if (ogTitle && (!task.title || task.title.startsWith('Media Ingestion:') || task.title.startsWith('Instagram Post ['))) {
                task.title = ogTitle.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s*\|\s*Instagram.*$/i, '').trim();
              }
              if (ogDesc && !task.description) {
                task.description = ogDesc.replace(/&quot;/g, '"').replace(/&#039;/g, "'");
              }
              if (ogImage && !task.thumbnail) {
                const cleanImg = ogImage.replace(/&amp;/g, '&');
                task.thumbnail = cleanImg;
                if (!task.carousel || task.carousel.length === 0) {
                  task.carousel = [
                    { id: '1', url: cleanImg, thumbnail: cleanImg, isVideo: false, title: 'Cover Slide', ext: 'jpg' }
                  ];
                  task.durationText = '1 Slide';
                }
              }
              this.emitQueueUpdate();
            } catch (_) {}
            resolve();
          });
        });
        req.on('error', () => resolve());
      } catch (_) {
        resolve();
      }
    });
  }

  async fetchDeepMetadata(task) {
    // If Pinterest pin or direct link, run specialized Pinterest scraper
    if (task.url.includes('pinterest.com') || task.url.includes('pin.it')) {
      await this.fetchPinterestMetadata(task);
    }

    // If Instagram post or reel, run fast mobile scraper first
    if (task.platform === 'instagram' || task.url.includes('instagram.com') || task.url.includes('instagr.am')) {
      await this.fetchInstagramMetadata(task);
    }

    const paths = this.binaryManager.getBinaryPaths();
    if (!paths.ytdlp || !fs.existsSync(paths.ytdlp)) return;

    try {
      const args = [
        '--dump-json',
        '--skip-download',
        '--no-warnings',
      ];

      // Pass Instagram session cookies if available
      const isInstagram = task.platform === 'instagram' || task.url.includes('instagram.com') || task.url.includes('instagr.am');
      if (isInstagram) {
        args.push('--yes-playlist');
        const igCookies = this.instagramAuth ? this.instagramAuth.getCookiesPath() : null;
        if (igCookies) {
          args.push('--cookies', igCookies);
        }
      }

      args.push(task.url);

      const proc = spawn(paths.ytdlp, args, {
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0 && stdout) {
          try {
            // Check for multiple JSON lines (Instagram Carousel / Multi-item gallery)
            const lines = stdout.split('\n').filter(l => l.trim().startsWith('{'));
            if (lines.length > 1) {
              const carouselItems = [];
              for (let i = 0; i < lines.length; i++) {
                try {
                  const entry = JSON.parse(lines[i]);
                  const imgUrl = entry.thumbnail || entry.url || (entry.thumbnails && entry.thumbnails[entry.thumbnails.length - 1]?.url);
                  if (imgUrl) {
                    carouselItems.push({
                      id: entry.id || String(i + 1),
                      url: entry.url || imgUrl,
                      thumbnail: imgUrl,
                      title: entry.title || `Slide ${i + 1}`,
                      isVideo: entry.ext === 'mp4' || entry.vcodec !== 'none',
                      ext: entry.ext || (entry.vcodec !== 'none' ? 'mp4' : 'jpg'),
                      width: entry.width,
                      height: entry.height,
                    });
                  }
                } catch (_) {}
              }
              // Deduplicate by entry.id or URL to avoid duplicate resolutions of the same slide
              const seenSlideKeys = new Set();
              const uniqueCarousel = [];
              for (const c of carouselItems) {
                const key = c.id || c.url || c.thumbnail;
                if (!seenSlideKeys.has(key)) {
                  seenSlideKeys.add(key);
                  uniqueCarousel.push(c);
                }
              }

              if (uniqueCarousel.length > 1) {
                task.carousel = uniqueCarousel;
                task.thumbnail = uniqueCarousel[0].thumbnail;
                task.durationText = `${uniqueCarousel.length} Slides`;
                if (!task.title || task.title.startsWith('Media Ingestion:')) {
                  task.title = `Instagram Carousel (${uniqueCarousel.length} items)`;
                }
              } else if (uniqueCarousel.length === 1 && !uniqueCarousel[0].isVideo) {
                task.carousel = uniqueCarousel;
                task.thumbnail = uniqueCarousel[0].thumbnail;
              }
            } else if (lines.length === 1) {
              const info = JSON.parse(lines[0]);
              if (info.title) task.title = info.title;
              if (info.thumbnail) task.thumbnail = info.thumbnail;
              if (info.description) task.description = info.description;
              if (info.tags && Array.isArray(info.tags)) task.tags = info.tags;
              if (info.uploader) task.uploader = info.uploader;
              if (info.duration) {
                task.durationSec = Math.round(info.duration);
                const m = Math.floor(task.durationSec / 60);
                const s = task.durationSec % 60;
                task.durationText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                if (task.config.trimEnd === 0 || task.config.trimEnd === 180) {
                  task.config.trimEnd = task.durationSec;
                }
              }

              // Check if entries or formats has carousel items
              if (info.entries && Array.isArray(info.entries)) {
                const seenEntries = new Set();
                const validEntries = [];
                for (let idx = 0; idx < info.entries.length; idx++) {
                  const entry = info.entries[idx];
                  const key = entry.id || entry.url || entry.thumbnail;
                  if (!seenEntries.has(key)) {
                    seenEntries.add(key);
                    validEntries.push({
                      id: entry.id || String(idx + 1),
                      url: entry.url || entry.thumbnail,
                      thumbnail: entry.thumbnail || entry.url,
                      title: entry.title || `Slide ${validEntries.length + 1}`,
                      isVideo: entry.ext === 'mp4',
                      ext: entry.ext || 'jpg',
                    });
                  }
                }
                if (validEntries.length > 1) {
                  task.carousel = validEntries;
                  task.durationText = `${validEntries.length} Slides`;
                  task.requiresInstagramAuth = false;
                  task.error = null;
                }
              }
            }
            this.emitQueueUpdate();
          } catch (_) {}
        } else {
          if (task.platform === 'instagram' && (stderr.includes('empty media response') || stderr.includes('API is not granting access') || stderr.includes('HTTP Error 400') || stderr.includes('login'))) {
            task.requiresInstagramAuth = true;
            task.error = 'Instagram login required to view all carousel slides. Click "Connect Instagram" above.';
            this.emitQueueUpdate();
          }
        }
      });
    } catch (_) {}
  }

  processQueue() {
    const activeCount = Array.from(this.activeProcesses.keys()).length;
    if (activeCount >= this.maxConcurrent) return;

    const nextTask = this.queue.find(item => item.status === 'queued');
    if (nextTask) {
      this.startDownload(nextTask);
    }
  }

  buildYtDlpArgs(task) {
    const paths = this.binaryManager.getBinaryPaths();
    const args = [];
    const fmt = task.config.format;
    const destDir = task.downloadDir || path.join(require('os').homedir(), 'Downloads');

    // Special pipeline: Thumbnail Only
    if (fmt === 'thumbnail_only') {
      args.push('--skip-download');
      args.push('--write-thumbnail');
      args.push('--convert-thumbnails', 'jpg');
      args.push('-o', path.join(destDir, '%(title)s [%(id)s] - Thumbnail.%(ext)s'));
      args.push(task.url);
      return args;
    }

    // Special pipeline: Metadata Only (Description & Info JSON)
    if (fmt === 'metadata_only') {
      args.push('--skip-download');
      args.push('--write-description');
      args.push('--write-info-json');
      args.push('-o', path.join(destDir, '%(title)s [%(id)s].%(ext)s'));
      args.push(task.url);
      return args;
    }

    // General high-performance flags
    args.push('--newline');
    if (task.platform === 'instagram') {
      args.push('--yes-playlist');
      const igCookies = this.instagramAuth ? this.instagramAuth.getCookiesPath() : null;
      if (igCookies) {
        args.push('--cookies', igCookies);
      }
    } else {
      args.push('--no-playlist');
    }
    args.push('--continue');
    args.push('--no-mtime');
    args.push('--concurrent-fragments', '16');
    args.push('--buffer-size', '16k');

    // Ffmpeg location
    if (paths.ffmpeg && fs.existsSync(paths.ffmpeg)) {
      args.push('--ffmpeg-location', path.dirname(paths.ffmpeg));
    }

    // Check if trimming is requested (STRICTLY for YouTube only)
    const { trimStart, trimEnd } = task.config;
    const isTrimmed = task.platform === 'youtube' && trimEnd > 0 && trimEnd > trimStart && (trimStart > 0 || (task.durationSec > 0 && trimEnd < task.durationSec));

    if (isTrimmed) {
      const formatTimecode = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };
      // Stream-copy trimming: fast seeking without slow re-encoding!
      args.push('--download-sections', `*${formatTimecode(trimStart)}-${formatTimecode(trimEnd)}`);
      // Note: do NOT pass aria2c or --force-keyframes-at-cuts when trimming, to ensure instant stream-copy and prevent stalls
    } else {
      // For full downloads, if aria2c exists, accelerate direct HTTP connections
      if (paths.aria2c && fs.existsSync(paths.aria2c)) {
        args.push('--downloader', 'http:aria2c');
        args.push('--downloader-args', 'aria2c:-x 16 -s 16 -k 1M --file-allocation=none');
      }
    }

    // Format selection:
    const res = task.config.resolution;
    const heightLimit = res === '4k' ? 2160 : res === '1080p' ? 1080 : res === '720p' ? 720 : 480;

    if (fmt === 'audio_only') {
      args.push('-x');
      const audioFmt = task.config.audioBitrate === 'flac' ? 'flac' : 'mp3';
      args.push('--audio-format', audioFmt);
      if (audioFmt === 'mp3') {
        args.push('--audio-quality', task.config.audioBitrate);
      }
      args.push('-f', 'ba*[protocol^=http]/ba/best');
    } else if (fmt === 'video_only') {
      args.push('-f', `bv*[protocol^=http][height<=${heightLimit}]/bv*[height<=${heightLimit}]/bestvideo`);
    } else if (task.platform === 'instagram') {
      // Instagram posts and carousels contain photos or videos
      args.push('-f', 'bestvideo+bestaudio/best');
    } else {
      // video + audio default (prioritize direct HTTP DASH/progressive over m3u8)
      args.push('-f', `bv*[protocol^=http][height<=${heightLimit}]+ba*[protocol^=http]/bv*[height<=${heightLimit}]+ba*/b[height<=${heightLimit}]/best`);
      args.push('--merge-output-format', 'mp4');
    }

    // Target directory and output template
    if (task.platform === 'instagram' && task.carousel && task.carousel.length > 1) {
      args.push('-o', path.join(destDir, '%(title)s [%(id)s]', '%(playlist_index)s - %(id)s.%(ext)s'));
    } else {
      args.push('-o', path.join(destDir, '%(title)s [%(id)s].%(ext)s'));
    }

    // Target URL
    args.push(task.url);

    return args;
  }

  startDownload(task) {
    const paths = this.binaryManager.getBinaryPaths();
    if (!paths.ytdlp || !fs.existsSync(paths.ytdlp)) {
      task.status = 'error';
      task.error = 'yt-dlp binary not found. Please re-verify runtime.';
      this.emitQueueUpdate();
      return;
    }

    task.status = 'active';
    task.error = null;
    task.speed = 'Connecting...';
    task.eta = 'Starting...';
    this.emitQueueUpdate();

    const args = this.buildYtDlpArgs(task);
    const child = spawn(paths.ytdlp, args, {
      detached: process.platform !== 'win32',
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    this.activeProcesses.set(task.id, child);

    let childStderr = '';

    child.stdout.on('data', (data) => {
      this.parseProgress(task, data.toString());
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      childStderr += text;
      this.parseProgress(task, text);
    });

    child.on('close', (code) => {
      this.activeProcesses.delete(task.id);

      if (task.status === 'paused') {
        this.emitQueueUpdate();
      } else if (code === 0) {
        task.status = 'completed';
        task.progress = 100;
        task.speed = '';
        task.eta = 'Finished';
        task.error = null;
        task.requiresInstagramAuth = false;
        this.emitQueueUpdate();
        this.emit('queue:item-completed', { id: task.id, title: task.title });
      } else {
        task.status = 'error';
        task.speed = '';
        task.eta = 'Failed';
        if (task.platform === 'instagram' && (childStderr.includes('empty media response') || childStderr.includes('API is not granting access') || childStderr.includes('HTTP Error 400') || childStderr.includes('login'))) {
          task.requiresInstagramAuth = true;
          task.error = 'Instagram login required to download this post. Click "Connect Instagram" above.';
        } else {
          task.error = `Download failed with exit code ${code}`;
        }
        this.emitQueueUpdate();
        this.emit('queue:item-error', { id: task.id, error: task.error });
      }

      this.processQueue();
    });


    child.on('error', (err) => {
      this.activeProcesses.delete(task.id);
      task.status = 'error';
      task.error = err.message;
      this.emitQueueUpdate();
      this.processQueue();
    });
  }

  parseProgress(task, rawText) {
    // Split by carriage returns and newlines because CLI tools use \r for animated updates
    const lines = rawText.split(/[\r\n]+/);
    for (const line of lines) {
      if (!line || !line.trim()) continue;

      // 1. Standard yt-dlp download progress:
      // "[download]  14.2% of ~ 141.79MiB at 17.29MiB/s ETA 00:07"
      const ytMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\w+)(?:\s+at\s+([^\s]+(?:\s+[^\s]+)?))?(?:\s+ETA\s+([^\s]+))?/i);
      if (ytMatch) {
        const pct = parseFloat(ytMatch[1]);
        task.progress = Math.min(99, Math.round(pct));
        task.totalSize = ytMatch[2];
        const totalNum = parseFloat(task.totalSize);
        const unit = task.totalSize.replace(/[\d.]+/g, '').trim() || 'MB';
        if (!isNaN(totalNum) && totalNum > 0) {
          task.downloadedSize = ((totalNum * pct) / 100).toFixed(1) + ' ' + unit;
        }
        if (ytMatch[3] && !ytMatch[3].toLowerCase().includes('unknown')) {
          task.speed = ytMatch[3];
        }
        if (ytMatch[4] && !ytMatch[4].toLowerCase().includes('unknown')) {
          task.eta = `${ytMatch[4]} left`;
        } else {
          task.eta = 'Downloading...';
        }
        this.emit('queue:progress', {
          id: task.id,
          status: 'active',
          progress: task.progress,
          downloadedSize: task.downloadedSize,
          totalSize: task.totalSize,
          speed: task.speed,
          eta: task.eta,
        });
        continue;
      }

      // 2. yt-dlp percentage and speed without ETA:
      const ytSimpleMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\w+)(?:\s+at\s+([^\s]+(?:\s+[^\s]+)?))?/i);
      if (ytSimpleMatch) {
        const pct = parseFloat(ytSimpleMatch[1]);
        task.progress = Math.min(99, Math.round(pct));
        task.totalSize = ytSimpleMatch[2];
        const totalNum = parseFloat(task.totalSize);
        const unit = task.totalSize.replace(/[\d.]+/g, '').trim() || 'MB';
        if (!isNaN(totalNum) && totalNum > 0) {
          task.downloadedSize = ((totalNum * pct) / 100).toFixed(1) + ' ' + unit;
        }
        if (ytSimpleMatch[3] && !ytSimpleMatch[3].toLowerCase().includes('unknown')) {
          task.speed = ytSimpleMatch[3];
        }
        task.eta = 'Downloading...';
        this.emit('queue:progress', {
          id: task.id,
          status: 'active',
          progress: task.progress,
          totalSize: task.totalSize,
          downloadedSize: task.downloadedSize,
          speed: task.speed,
          eta: task.eta,
        });
        continue;
      }

      // 3. Ffmpeg stream/trim progress:
      // "size=    1024kB time=00:00:06.00 bitrate=1398.1kbits/s speed=  12x"
      const ffmpegMatch = line.match(/size=\s*(\d+\w*).*?time=\s*([\d:.]+).*?speed=\s*([\d.]+)x/i);
      if (ffmpegMatch) {
        const sizeStr = ffmpegMatch[1];
        const timeStr = ffmpegMatch[2];
        const speedVal = ffmpegMatch[3];

        const parts = timeStr.split(':').map(Number);
        let currentSec = 0;
        if (parts.length === 3) currentSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) currentSec = parts[0] * 60 + parts[1];

        const { trimStart = 0, trimEnd = 0 } = task.config || {};
        const totalDuration = (trimEnd > trimStart) ? (trimEnd - trimStart) : (task.durationSec || 180);
        const percent = Math.min(99, Math.max(1, Math.round((currentSec / (totalDuration || 1)) * 100)));

        task.progress = percent;
        task.downloadedSize = sizeStr;
        task.speed = `${speedVal}x`;
        task.eta = 'Trimming clip...';

        this.emit('queue:progress', {
          id: task.id,
          status: 'active',
          progress: task.progress,
          downloadedSize: task.downloadedSize,
          totalSize: task.totalSize,
          speed: task.speed,
          eta: task.eta,
        });
        continue;
      }

      // 4. aria2c progress
      const ariaMatch = line.match(/\[#\w+\s+([\d.]+\w+)\/([\d.]+\w+)\((\d+)%\).*?DL:([\d.]+\w+).*?ETA:(\w+)\]/i);
      if (ariaMatch) {
        task.downloadedSize = ariaMatch[1];
        task.totalSize = ariaMatch[2];
        task.progress = parseInt(ariaMatch[3], 10);
        task.speed = `${ariaMatch[4]}/s`;
        task.eta = `${ariaMatch[5]} remaining`;
        this.emit('queue:progress', {
          id: task.id,
          status: 'active',
          progress: task.progress,
          downloadedSize: task.downloadedSize,
          totalSize: task.totalSize,
          speed: task.speed,
          eta: task.eta,
        });
        continue;
      }

      // 5. Generic percentage fallback
      const pctMatch = line.match(/\[download\]\s+([\d.]+)%/i);
      if (pctMatch) {
        task.progress = Math.min(99, Math.round(parseFloat(pctMatch[1])));
        this.emit('queue:progress', {
          id: task.id,
          status: 'active',
          progress: task.progress,
          downloadedSize: task.downloadedSize,
          totalSize: task.totalSize,
          speed: task.speed || 'Downloading...',
          eta: task.eta || 'In progress',
        });
      }
    }
  }

  killProcessTree(proc) {
    if (!proc) return;
    const pid = proc.pid;
    if (!pid) return;

    if (process.platform === 'win32') {
      exec(`taskkill /pid ${pid} /T /F`, () => {});
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch (_) {
        try {
          proc.kill('SIGTERM');
        } catch (_) {}
      }
    }
  }

  pauseTask(id) {
    const task = this.queue.find(item => item.id === id);
    if (!task) return;

    task.status = 'paused';
    task.speed = '';
    task.eta = 'Paused';

    const proc = this.activeProcesses.get(id);
    if (proc) {
      this.killProcessTree(proc);
      this.activeProcesses.delete(id);
    }

    this.emitQueueUpdate();
    this.processQueue();
  }

  resumeTask(id) {
    const task = this.queue.find(item => item.id === id);
    if (!task) return;

    // Allow launching queued tasks, paused tasks, or retrying error tasks
    if (task.status === 'paused' || task.status === 'error' || task.status === 'queued') {
      this.startDownload(task);
    }
  }

  startAll() {
    for (const task of this.queue) {
      if (task.status === 'queued' || task.status === 'paused') {
        this.startDownload(task);
      }
    }
  }

  async downloadCarouselItem(taskId, itemIndex = 0) {
    const task = this.queue.find(item => item.id === taskId);
    if (!task || !task.carousel || !task.carousel[itemIndex]) {
      return { success: false, error: 'Carousel item not found' };
    }

    const item = task.carousel[itemIndex];
    const destDir = task.downloadDir || path.join(require('os').homedir(), 'Downloads');
    const safeTitle = (task.title || 'media').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50);
    const fileName = `${safeTitle} - Slide ${itemIndex + 1}.${item.ext || 'jpg'}`;
    const filePath = path.join(destDir, fileName);

    return await this.downloadFile(item.url || item.thumbnail, filePath);
  }

  async downloadAllCarousel(taskId) {
    const task = this.queue.find(item => item.id === taskId);
    if (!task || !task.carousel || task.carousel.length === 0) {
      return { success: false, error: 'No carousel items available' };
    }

    const destDir = task.downloadDir || path.join(require('os').homedir(), 'Downloads');
    const safeTitle = (task.title || 'media').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50);
    const folderPath = path.join(destDir, `${safeTitle} - Carousel`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const results = [];
    for (let i = 0; i < task.carousel.length; i++) {
      const item = task.carousel[i];
      const fileName = `slide_${String(i + 1).padStart(2, '0')}.${item.ext || 'jpg'}`;
      const filePath = path.join(folderPath, fileName);
      try {
        await this.downloadFile(item.url || item.thumbnail, filePath);
        results.push(filePath);
      } catch (err) {
        console.error('Failed downloading carousel slide:', err);
      }
    }
    return { success: true, count: results.length, folderPath };
  }

  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destPath);
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/',
      };

      const req = client.get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(destPath, () => {});
          return resolve(this.downloadFile(res.headers.location, destPath));
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve({ success: true, path: destPath }));
        });
      });
      req.on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  async refreshMetadata(taskId) {
    const task = this.queue.find(item => item.id === taskId);
    if (!task) return false;
    task.error = null;
    task.requiresInstagramAuth = false;
    this.emitQueueUpdate();
    await this.fetchDeepMetadata(task);
    return true;
  }

  refreshAllInstagramTasks() {
    for (const task of this.queue) {
      if (task.platform === 'instagram' && (task.requiresInstagramAuth || task.status === 'error')) {
        this.refreshMetadata(task.id);
      }
    }
  }


  removeTask(id) {
    const proc = this.activeProcesses.get(id);
    if (proc) {
      this.killProcessTree(proc);
      this.activeProcesses.delete(id);
    }

    this.queue = this.queue.filter(item => item.id !== id);
    this.emitQueueUpdate();
    this.processQueue();
  }

  updateTaskConfig(id, newConfig) {
    const task = this.queue.find(item => item.id === id);
    if (!task) return;

    task.config = { ...task.config, ...newConfig };
    this.emitQueueUpdate();
  }

  pauseAll() {
    for (const [id, proc] of this.activeProcesses.entries()) {
      const task = this.queue.find(item => item.id === id);
      if (task) {
        task.status = 'paused';
        task.speed = '';
        task.eta = 'Paused';
      }
      this.killProcessTree(proc);
    }
    this.activeProcesses.clear();

    for (const task of this.queue) {
      if (task.status === 'queued' || task.status === 'active') {
        task.status = 'paused';
        task.speed = '';
        task.eta = 'Paused';
      }
    }

    this.emitQueueUpdate();
  }

  resumeAll() {
    for (const task of this.queue) {
      if (task.status === 'paused') {
        task.status = 'queued';
        task.eta = 'Queued';
      }
    }
    this.emitQueueUpdate();
    this.processQueue();
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'completed');
    this.emitQueueUpdate();
  }

  // Quick 1-Click Feature: Download High-Res Thumbnail directly
  async downloadThumbnailOnly(taskId) {
    const task = this.queue.find(item => item.id === taskId);
    if (!task) throw new Error('Task not found');

    const destDir = task.downloadDir || path.join(require('os').homedir(), 'Downloads');
    const safeTitle = (task.title || 'Thumbnail').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
    const destFile = path.join(destDir, `${safeTitle} - Thumbnail.jpg`);

    // If task has a direct image URL, stream it directly
    if (task.thumbnail && task.thumbnail.startsWith('http')) {
      await this.downloadDirectFile(task.thumbnail, destFile);
      return { success: true, filePath: destFile };
    }

    // Fallback using yt-dlp
    const paths = this.binaryManager.getBinaryPaths();
    return new Promise((resolve, reject) => {
      const proc = spawn(paths.ytdlp, [
        '--skip-download',
        '--write-thumbnail',
        '--convert-thumbnails', 'jpg',
        '-o', path.join(destDir, `${safeTitle} - Thumbnail.%(ext)s`),
        task.url
      ]);
      proc.on('close', code => {
        if (code === 0) resolve({ success: true, filePath: destFile });
        else reject(new Error(`Failed to download thumbnail: code ${code}`));
      });
      proc.on('error', reject);
    });
  }

  // Quick 1-Click Feature: Save Metadata (Description, Tags, Chapters) to TXT or JSON
  async saveMetadataOnly(taskId, type = 'txt') {
    const task = this.queue.find(item => item.id === taskId);
    if (!task) throw new Error('Task not found');

    const destDir = task.downloadDir || path.join(require('os').homedir(), 'Downloads');
    const safeTitle = (task.title || 'Metadata').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);

    if (type === 'json') {
      const destFile = path.join(destDir, `${safeTitle} - Metadata.json`);
      const payload = {
        title: task.title,
        url: task.url,
        uploader: task.uploader,
        durationSeconds: task.durationSec,
        durationText: task.durationText,
        tags: task.tags || [],
        description: task.description || '',
        thumbnail: task.thumbnail,
        exportDate: new Date().toISOString(),
      };
      fs.writeFileSync(destFile, JSON.stringify(payload, null, 2), 'utf8');
      return { success: true, filePath: destFile };
    } else {
      const destFile = path.join(destDir, `${safeTitle} - Description.txt`);
      const content = `TITLE: ${task.title || ''}
UPLOADER: ${task.uploader || ''}
URL: ${task.url}
DURATION: ${task.durationText || ''}

TAGS:
${(task.tags || []).join(', ')}

==================================================
DESCRIPTION:
==================================================
${task.description || 'No description available.'}
`;
      fs.writeFileSync(destFile, content, 'utf8');
      return { success: true, filePath: destFile };
    }
  }

  downloadDirectFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const handleReq = (currUrl) => {
        const client = currUrl.startsWith('https') ? https : http;
        client.get(currUrl, res => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return handleReq(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const file = fs.createWriteStream(destPath);
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve(destPath)));
          file.on('error', reject);
        }).on('error', reject);
      };
      handleReq(url);
    });
  }
}

module.exports = QueueManager;
