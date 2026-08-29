import { WebDAVConfig } from '../types';
import { backend } from './backendAdapter';
import { logger } from './logger';

export class WebDAVService {
  private config: WebDAVConfig;

  constructor(config: WebDAVConfig) {
    this.config = config;
  }

  private useBackendProxy(): boolean {
    return backend.isAvailable && !!this.config.id;
  }

  private requireBackendProxy(): void {
    if (!this.useBackendProxy()) {
      throw new Error(
        'WebDAV 操作需要后端代理。请确认应用已连接后端服务（纯 Web 模式不支持浏览器直连 WebDAV）。',
      );
    }
  }

  /** Path suffix appended to the configured WebDAV base URL on the server. */
  private relativePath(filename = ''): string {
    if (!filename) {
      return this.config.path || '/';
    }
    const basePath = this.config.path.endsWith('/') ? this.config.path : `${this.config.path}/`;
    return `${basePath}${filename}`;
  }

  private async request(
    method: string,
    path: string,
    body?: string,
    headers?: Record<string, string>,
  ): Promise<Response> {
    this.requireBackendProxy();
    return backend.proxyWebDAV(this.config.id, method, path, body, headers, 'text');
  }

  private compressData(content: string): string {
    try {
      const data = JSON.parse(content);
      return JSON.stringify(data);
    } catch (e) {
      logger.warn('webdav', 'JSON压缩失败，使用原始内容', e);
      return content;
    }
  }

  private analyzeFileSize(content: string): { sizeKB: number; isLarge: boolean; suggestions: string[] } {
    const sizeKB = Math.round(content.length / 1024);
    const isLarge = sizeKB > 1024;
    const suggestions: string[] = [];

    if (isLarge) {
      suggestions.push('考虑减少备份数据量');
      if (content.length > 5 * 1024 * 1024) {
        suggestions.push('文件过大，建议启用数据筛选或分片备份');
      }
    }

    return { sizeKB, isLarge, suggestions };
  }

  private async retryUpload<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const errMsg = lastError.message;
        const shouldRetry =
          errMsg.includes('超时')
          || errMsg.includes('timeout')
          || errMsg.includes('NetworkError')
          || errMsg.includes('fetch');

        if (!shouldRetry) {
          throw lastError;
        }

        logger.warn('webdav', `上传失败，第${attempt}次重试`, { attempt, errMsg, delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw lastError!;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.url.startsWith('http://') && !this.config.url.startsWith('https://')) {
      throw new Error('WebDAV URL必须以 http:// 或 https:// 开头');
    }

    this.requireBackendProxy();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headResponse = await this.request('HEAD', this.relativePath());
      clearTimeout(timeoutId);
      if (headResponse.ok) return true;

      const propfindResponse = await this.request(
        'PROPFIND',
        this.relativePath(),
        `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/></D:prop></D:propfind>`,
        { Depth: '0', 'Content-Type': 'application/xml' },
      );

      return propfindResponse.ok || propfindResponse.status === 207;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('连接超时。请检查WebDAV服务器是否可访问。');
      }
      throw error;
    }
  }

  async uploadFile(filename: string, content: string): Promise<boolean> {
    if (!this.config.url.startsWith('http://') && !this.config.url.startsWith('https://')) {
      throw new Error('WebDAV URL必须以 http:// 或 https:// 开头');
    }

    const fileAnalysis = this.analyzeFileSize(content);
    const compressedContent = this.compressData(content);

    if (fileAnalysis.isLarge) {
      logger.warn('webdav', '大文件备份', { sizeKB: fileAnalysis.sizeKB, suggestions: fileAnalysis.suggestions });
    }

    await this.ensureDirectoryExists();

    const finalSizeKB = Math.round(compressedContent.length / 1024);
    const dynamicTimeout = Math.max(60000, Math.min(300000, finalSizeKB * 100));

    const uploadOperation = async (): Promise<boolean> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), dynamicTimeout);
      const startTime = Date.now();

      try {
        const response = await this.request(
          'PUT',
          this.relativePath(filename),
          compressedContent,
          { 'Content-Type': 'application/json' },
        );

        clearTimeout(timeoutId);

        if (logger.isDebugMode()) {
          logger.debug('webdav', 'WebDAV request', {
            method: 'PUT',
            path: this.relativePath(filename),
            status: response.status,
            durationMs: Date.now() - startTime,
          });
        }

        if (!response.ok) {
          if (response.status === 401) throw new Error('身份验证失败。请检查用户名和密码。');
          if (response.status === 403) throw new Error('访问被拒绝。请检查指定路径的权限。');
          if (response.status === 404) throw new Error('路径未找到。请验证WebDAV URL和路径是否正确。');
          if (response.status === 507) throw new Error('服务器存储空间不足。');
          throw new Error(`上传失败，HTTP状态码 ${response.status}: ${response.statusText}`);
        }

        return true;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        if ((fetchError as Error).name === 'AbortError') {
          throw new Error(`上传超时 (${finalSizeKB}KB文件，${dynamicTimeout / 1000}秒限制)。建议检查网络连接或联系管理员优化服务器配置。`);
        }
        throw fetchError;
      }
    };

    return this.retryUpload(uploadOperation);
  }

  private async ensureDirectoryExists(): Promise<void> {
    if (!this.config.path || this.config.path === '/') return;

    const cleanedPath = this.config.path.replace(/\/+$/, '');
    const segments = cleanedPath.split('/').filter(Boolean);

    for (let i = 0; i < segments.length; i++) {
      const dirPath = `/${segments.slice(0, i + 1).join('/')}`;
      try {
        const res = await this.request('MKCOL', dirPath);
        if (!res.ok && res.status !== 405 && res.status !== 409) {
          logger.warn('webdav', '无法创建目录', { dirPath, status: res.status });
          break;
        }
      } catch (e) {
        logger.warn('webdav', '创建目录发生异常', { dirPath, error: e });
        break;
      }
    }
  }

  async downloadFile(filename: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const startTime = Date.now();

    try {
      const response = await this.request('GET', this.relativePath(filename));
      clearTimeout(timeoutId);

      if (logger.isDebugMode()) {
        logger.debug('webdav', 'WebDAV request', {
          method: 'GET',
          path: this.relativePath(filename),
          status: response.status,
          durationMs: Date.now() - startTime,
        });
      }

      if (response.ok) {
        return await response.text();
      }

      if (response.status === 404) return null;
      if (response.status === 401) throw new Error('身份验证失败。请检查用户名和密码。');
      throw new Error(`下载失败，HTTP状态码 ${response.status}: ${response.statusText}`);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('下载超时。请检查网络连接。');
      }
      throw error;
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const response = await this.request('HEAD', this.relativePath(filename));
      return response.ok;
    } catch (error) {
      logger.error('webdav', 'WebDAV文件检查失败', error);
      return false;
    }
  }

  async listFiles(): Promise<string[]> {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
            <D:propfind xmlns:D="DAV:">
              <D:prop>
                <D:displayname/>
                <D:getlastmodified/>
                <D:getcontentlength/>
              </D:prop>
            </D:propfind>`;

    const response = await this.request(
      'PROPFIND',
      this.relativePath(),
      propfindBody,
      { Depth: '1', 'Content-Type': 'application/xml' },
    );

    if (response.ok || response.status === 207) {
      const xmlText = await response.text();
      const collectionPath = this.relativePath('');

      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'application/xml');
        const responses = Array.from(xml.getElementsByTagNameNS('DAV:', 'response'));
        const results: string[] = [];

        for (const res of responses) {
          const hrefEl = res.getElementsByTagNameNS('DAV:', 'href')[0];
          if (!hrefEl?.textContent) continue;
          let href = hrefEl.textContent;
          const normalizedCollection = collectionPath.replace(/^https?:\/\//, '').replace(/\/+$/, '/');
          const normalizedHref = href.replace(/^https?:\/\//, '');
          if (normalizedHref.endsWith(normalizedCollection)) continue;

          href = href.replace(/\/+$/, '');
          const parts = href.split('/').filter(Boolean);
          if (parts.length === 0) continue;
          const last = decodeURIComponent(parts[parts.length - 1]);
          if (last.toLowerCase().endsWith('.json')) {
            results.push(last.trim());
          }
        }

        if (results.length > 0) return results;
      } catch {
        const namesFromDisplay = (xmlText.match(/<D:displayname>([^<]+)<\/D:displayname>/gi) || [])
          .map((m) => m.replace(/<\/?D:displayname>/gi, ''))
          .map((s) => s.trim())
          .filter((name) => name.toLowerCase().endsWith('.json'));

        if (namesFromDisplay.length > 0) return namesFromDisplay;

        const namesFromHref = (xmlText.match(/<D:href>([^<]+)<\/D:href>/gi) || [])
          .map((m) => m.replace(/<\/?D:href>/gi, ''))
          .map((s) => s.replace(/\/+$/, ''))
          .map((s) => decodeURIComponent(s.split('/').filter(Boolean).pop() || ''))
          .map((s) => s.trim())
          .filter((name) => name.toLowerCase().endsWith('.json'));

        if (namesFromHref.length > 0) return namesFromHref;
      }
    } else if (response.status === 401) {
      throw new Error('身份验证失败。请检查用户名和密码。');
    } else {
      throw new Error(`列出文件失败，HTTP状态码 ${response.status}: ${response.statusText}`);
    }

    return [];
  }

  static validateConfig(config: Partial<WebDAVConfig>): string[] {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('WebDAV URL是必需的');
    } else if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      errors.push('WebDAV URL必须以 http:// 或 https:// 开头');
    }

    if (!config.username) errors.push('用户名是必需的');
    if (!config.password) errors.push('密码是必需的');
    if (!config.path) {
      errors.push('路径是必需的');
    } else if (!config.path.startsWith('/')) {
      errors.push('路径必须以 / 开头');
    }

    return errors;
  }

  async getServerInfo(): Promise<{ server?: string; davLevel?: string }> {
    try {
      const response = await this.request('OPTIONS', '/');
      if (response.ok) {
        return {
          server: response.headers.get('Server') || undefined,
          davLevel: response.headers.get('DAV') || undefined,
        };
      }
    } catch (error) {
      logger.warn('webdav', '无法获取服务器信息', error);
    }

    return {};
  }
}
