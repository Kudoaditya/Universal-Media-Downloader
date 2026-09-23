const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawn, execSync } = require('child_process');

class BinaryManager {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.binDir = path.join(this.userDataPath, 'binaries');
    this.isWin = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.arch = process.arch; // 'arm64' or 'x64'

    this.binaries = {
      'yt-dlp': {
        filename: this.isWin ? 'yt-dlp.exe' : 'yt-dlp',
        path: path.join(this.binDir, this.isWin ? 'yt-dlp.exe' : 'yt-dlp'),
        url: this.isWin
          ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
          : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        isArchive: false,
      },
      'ffmpeg': {
        filename: this.isWin ? 'ffmpeg.exe' : 'ffmpeg',
        path: path.join(this.binDir, this.isWin ? 'ffmpeg.exe' : 'ffmpeg'),
        url: this.isWin
          ? 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-win-64.zip'
          : 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-osx-64.zip',
        isArchive: true,
        archiveType: 'zip',
      },
      'aria2c': {
        filename: this.isWin ? 'aria2c.exe' : 'aria2c',
        path: path.join(this.binDir, this.isWin ? 'aria2c.exe' : 'aria2c'),
        url: this.isWin
          ? 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip'
          : (this.arch === 'arm64'
              ? 'https://github.com/q741451/aria2c-macos-standalone-binary/releases/download/v1.0.0/aria2c-macos-arm64.tar.gz'
              : 'https://github.com/q741451/aria2c-macos-standalone-binary/releases/download/v1.0.0/aria2c-macos-x86_64.tar.gz'),
        isArchive: true,
        archiveType: this.isWin ? 'zip' : 'tar.gz',
      }
    };

    this.status = {
      isReady: false,
      details: {
        'yt-dlp': { ready: false, path: null, error: null, progress: 0 },
        'ffmpeg': { ready: false, path: null, error: null, progress: 0 },
        'aria2c': { ready: false, path: null, error: null, progress: 0 },
      }
    };
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  checkBinaryExistsAndExecutable(binName) {
    const binInfo = this.binaries[binName];
    if (fs.existsSync(binInfo.path)) {
      try {
        if (!this.isWin) {
          fs.chmodSync(binInfo.path, 0o755);
        }
        return true;
      } catch (e) {
        console.error(`Failed to verify permissions for ${binName}:`, e);
        return false;
      }
    }

    // Check system PATH as an immediate alternative
    try {
      const checkCmd = this.isWin ? `where ${binInfo.filename}` : `which ${binInfo.filename}`;
      const sysPath = execSync(checkCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split('\n')[0];
      if (sysPath && fs.existsSync(sysPath)) {
        binInfo.path = sysPath;
        return true;
      }
    } catch (_) {}

    return false;
  }

  downloadFileWithRedirects(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const handleRequest = (currentUrl, redirectsRemaining = 5) => {
        if (redirectsRemaining <= 0) {
          return reject(new Error(`Too many redirects downloading ${url}`));
        }

        const client = currentUrl.startsWith('https') ? https : http;
        const req = client.get(currentUrl, {
          headers: {
            'User-Agent': 'Universal-Media-Downloader-Setup/2.4',
            'Accept': '*/*'
          }
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith('http')) {
              const urlObj = new URL(currentUrl);
              nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
            }
            return handleRequest(nextUrl, redirectsRemaining - 1);
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`Server returned HTTP ${res.statusCode}: ${res.statusMessage}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let receivedBytes = 0;
          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0 && onProgress) {
              const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              onProgress(percent, receivedBytes, totalBytes);
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => resolve(destPath));
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        });

        req.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      };

      handleRequest(url);
    });
  }

  async extractArchive(archivePath, extractDir, type, targetBinaryName) {
    this.ensureDirectoryExists(extractDir);

    return new Promise((resolve, reject) => {
      let proc;
      if (type === 'zip') {
        if (this.isWin) {
          proc = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            `Expand-Archive -Path "${archivePath}" -DestinationPath "${extractDir}" -Force`
          ]);
        } else {
          proc = spawn('unzip', ['-o', archivePath, '-d', extractDir]);
        }
      } else if (type === 'tar.gz') {
        proc = spawn('tar', ['-xzf', archivePath, '-C', extractDir]);
      } else {
        return reject(new Error(`Unsupported archive type: ${type}`));
      }

      proc.on('close', (code) => {
        if (code === 0) {
          // If the extracted binary is nested inside a subfolder, locate it and move to root of binDir
          try {
            const foundPath = this.findFileRecursively(extractDir, targetBinaryName);
            if (foundPath && foundPath !== path.join(extractDir, targetBinaryName)) {
              fs.copyFileSync(foundPath, path.join(extractDir, targetBinaryName));
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Extraction failed with exit code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  findFileRecursively(dir, targetFilename) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = this.findFileRecursively(fullPath, targetFilename);
        if (found) return found;
      }
    }
    return null;
  }

  async setupBinary(binName, onProgress) {
    const binInfo = this.binaries[binName];
    this.ensureDirectoryExists(this.binDir);

    if (this.checkBinaryExistsAndExecutable(binName)) {
      this.status.details[binName] = {
        ready: true,
        path: binInfo.path,
        error: null,
        progress: 100
      };
      if (onProgress) onProgress({ name: binName, percent: 100, status: 'ready' });
      return binInfo.path;
    }

    if (onProgress) onProgress({ name: binName, percent: 0, status: 'downloading' });

    const tempFileName = `temp_${binName}_${Date.now()}` + (binInfo.isArchive ? (binInfo.archiveType === 'zip' ? '.zip' : '.tar.gz') : '');
    const tempFilePath = path.join(this.binDir, tempFileName);

    try {
      await this.downloadFileWithRedirects(binInfo.url, tempFilePath, (percent) => {
        this.status.details[binName].progress = percent;
        if (onProgress) onProgress({ name: binName, percent, status: 'downloading' });
      });

      if (binInfo.isArchive) {
        if (onProgress) onProgress({ name: binName, percent: 95, status: 'extracting' });
        await this.extractArchive(tempFilePath, this.binDir, binInfo.archiveType, binInfo.filename);
        try { fs.unlinkSync(tempFilePath); } catch (_) {}
      } else {
        fs.renameSync(tempFilePath, binInfo.path);
      }

      if (!this.isWin) {
        fs.chmodSync(binInfo.path, 0o755);
      }

      this.status.details[binName] = {
        ready: true,
        path: binInfo.path,
        error: null,
        progress: 100
      };
      if (onProgress) onProgress({ name: binName, percent: 100, status: 'ready' });
      return binInfo.path;
    } catch (err) {
      console.error(`Failed to setup ${binName}:`, err);
      try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (_) {}
      this.status.details[binName] = {
        ready: false,
        path: null,
        error: err.message,
        progress: 0
      };
      if (onProgress) onProgress({ name: binName, percent: 0, status: 'error', error: err.message });
      throw err;
    }
  }

  async init(onProgress) {
    this.ensureDirectoryExists(this.binDir);
    const names = ['yt-dlp', 'ffmpeg', 'aria2c'];

    for (const name of names) {
      try {
        await this.setupBinary(name, onProgress);
      } catch (err) {
        console.warn(`Could not install ${name}:`, err.message);
      }
    }

    const allReady = Object.values(this.status.details).every(b => b.ready);
    this.status.isReady = allReady;
    return this.getStatus();
  }

  getStatus() {
    return {
      isReady: Object.values(this.status.details).every(b => b.ready),
      binDir: this.binDir,
      details: this.status.details,
      platform: process.platform,
      arch: process.arch
    };
  }

  getBinaryPaths() {
    return {
      ytdlp: this.binaries['yt-dlp'].path,
      ffmpeg: this.binaries['ffmpeg'].path,
      aria2c: this.binaries['aria2c'].path,
    };
  }
}

module.exports = BinaryManager;
