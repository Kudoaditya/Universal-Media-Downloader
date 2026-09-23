const { BrowserWindow, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');

class InstagramAuth {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.cookiesFilePath = path.join(userDataPath, 'instagram_cookies.txt');
    this.authWindow = null;
    this.pollTimer = null;
  }

  getCookiesPath() {
    if (fs.existsSync(this.cookiesFilePath)) {
      const content = fs.readFileSync(this.cookiesFilePath, 'utf8');
      if (content.includes('sessionid') && content.includes('.instagram.com')) {
        return this.cookiesFilePath;
      }
    }
    return null;
  }

  async checkStatus() {
    // 1. Check existing cookie file
    let cookiesPath = this.getCookiesPath();
    
    // 2. If not found, try to auto-sync from Chrome
    if (!cookiesPath) {
      const synced = this.syncFromChrome();
      if (synced) {
        cookiesPath = this.getCookiesPath();
      }
    }

    if (!cookiesPath) {
      return { connected: false, username: null };
    }

    try {
      const content = fs.readFileSync(cookiesPath, 'utf8');
      const dsUserId = content.match(/ds_user_id\t([^\r\n\t]+)/)?.[1];
      return { 
        connected: true, 
        username: dsUserId ? `IG User ${dsUserId}` : 'Instagram Account',
        cookiesPath 
      };
    } catch (_) {
      return { connected: false, username: null };
    }
  }

  /**
   * Directly extract and decrypt Instagram session cookies from user's Google Chrome profiles
   */
  syncFromChrome() {
    try {
      let pw = '';
      if (process.platform === 'darwin') {
        try {
          pw = execSync('security find-generic-password -w -s "Chrome Safe Storage"', { 
            encoding: 'utf8',
            timeout: 5000 
          }).trim();
        } catch (e) {
          console.warn('[InstagramAuth] Could not read Chrome Safe Storage password:', e.message);
          return false;
        }
      } else {
        // Windows/Linux can be extended if needed
        return false;
      }

      if (!pw) return false;

      const salt = 'saltysalt';
      const derivedKey = crypto.pbkdf2Sync(pw, salt, 1003, 16, 'sha1');
      const iv = Buffer.alloc(16, 0x20);

      const chromeDir = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
      if (!fs.existsSync(chromeDir)) return false;

      const entries = fs.readdirSync(chromeDir);
      const candidateProfiles = entries.filter(e => e === 'Default' || e.startsWith('Profile '));
      // Prioritize Profile 1, then Default, then others
      candidateProfiles.sort((a, b) => {
        if (a === 'Profile 1') return -1;
        if (b === 'Profile 1') return 1;
        return a.localeCompare(b);
      });

      let foundCookies = [];

      for (const p of candidateProfiles) {
        const c1 = path.join(chromeDir, p, 'Cookies');
        const c2 = path.join(chromeDir, p, 'Network/Cookies');
        const cPath = fs.existsSync(c1) ? c1 : (fs.existsSync(c2) ? c2 : null);
        if (!cPath) continue;

        const tempDb = path.join(os.tmpdir(), `sync_chrome_${p.replace(/\s+/g, '_')}_${Date.now()}.db`);
        try {
          fs.copyFileSync(cPath, tempDb);
          const sqlOut = execSync(
            `sqlite3 "${tempDb}" "SELECT hex(encrypted_value), name, host_key, path, is_secure, expires_utc FROM cookies WHERE host_key LIKE '%instagram.com%';"`
            , { encoding: 'utf8', timeout: 5000 }
          );
          const lines = sqlOut.trim().split('\n').filter(Boolean);
          const profileCookies = [];

          for (const line of lines) {
            const [hexVal, name, host, pth, isSecure, exp] = line.split('|');
            if (!hexVal) continue;
            const encBuffer = Buffer.from(hexVal, 'hex');
            if (encBuffer.subarray(0, 3).toString() === 'v10') {
              const payload = encBuffer.subarray(3);
              const decipher = crypto.createDecipheriv('aes-128-cbc', derivedKey, iv);
              const dec = Buffer.concat([decipher.update(payload), decipher.final()]);
              // First 32 bytes in Chromium macOS is SHA256 HMAC signature
              const val = dec.subarray(32).toString('utf8');
              profileCookies.push({ name, value: val, host, path: pth, secure: isSecure === '1', expires: exp });
            }
          }

          if (profileCookies.some(c => c.name === 'sessionid' && c.value)) {
            foundCookies = profileCookies;
            console.log(`[InstagramAuth] Found active Instagram session in Chrome profile: ${p}`);
            break;
          }
        } catch (err) {
          console.warn(`[InstagramAuth] Error reading profile ${p}:`, err.message);
        } finally {
          try { fs.unlinkSync(tempDb); } catch (_) {}
        }
      }

      if (foundCookies.length === 0) return false;

      // Format as Netscape cookies.txt
      let netscape = '# Netscape HTTP Cookie File\n';
      netscape += '# Synced from Google Chrome Profile\n\n';

      for (const c of foundCookies) {
        const host = c.host.startsWith('.') ? c.host : `.${c.host}`;
        const flag = host.startsWith('.') ? 'TRUE' : 'FALSE';
        const pth = c.path || '/';
        const sec = c.secure ? 'TRUE' : 'FALSE';
        const expSec = Math.round(Date.now() / 1000) + 86400 * 90;
        netscape += `${host}\t${flag}\t${pth}\t${sec}\t${expSec}\t${c.name}\t${c.value}\n`;
      }

      fs.writeFileSync(this.cookiesFilePath, netscape, 'utf8');
      return true;
    } catch (err) {
      console.error('[InstagramAuth] syncFromChrome failed:', err);
      return false;
    }
  }

  /**
   * Opens Instagram login page in Google Chrome and starts auto-syncing the session
   */
  async openLoginWindow(parentWindow) {
    const loginUrl = 'https://www.instagram.com/accounts/login/';

    // 1. Launch Google Chrome with the login URL
    if (process.platform === 'darwin') {
      exec(`open -a "Google Chrome" "${loginUrl}"`, (err) => {
        if (err) {
          console.warn('[InstagramAuth] Failed to open Google Chrome, falling back to default browser:', err.message);
          shell.openExternal(loginUrl);
        }
      });
    } else if (process.platform === 'win32') {
      exec(`start chrome "${loginUrl}"`, (err) => {
        if (err) shell.openExternal(loginUrl);
      });
    } else {
      shell.openExternal(loginUrl);
    }

    // 2. Check if already logged in in Chrome
    const alreadySynced = this.syncFromChrome();
    if (alreadySynced) {
      const status = await this.checkStatus();
      if (status.connected) {
        return { success: true, ...status, source: 'chrome' };
      }
    }

    // 3. Start polling for login completion in Chrome (checks every 2.5s for up to 60s)
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 24; // 24 * 2.5s = 60s

      if (this.pollTimer) clearInterval(this.pollTimer);

      this.pollTimer = setInterval(async () => {
        attempts++;
        const synced = this.syncFromChrome();
        if (synced) {
          const status = await this.checkStatus();
          if (status.connected) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            if (parentWindow && !parentWindow.isDestroyed()) {
              parentWindow.webContents.send('instagram:status-changed', status);
            }
            resolve({ success: true, ...status, source: 'chrome' });
            return;
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
          const status = await this.checkStatus();
          resolve({ success: status.connected, ...status, source: 'chrome', timeout: true });
        }
      }, 2500);
    });
  }

  async logout() {
    try {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      if (fs.existsSync(this.cookiesFilePath)) {
        fs.unlinkSync(this.cookiesFilePath);
      }
      const ses = session.fromPartition('persist:instagram');
      await ses.clearStorageData({ storages: ['cookies', 'localstorage'] });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = InstagramAuth;
