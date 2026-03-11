import { StorageService } from "../storage-services";
import fs from "fs/promises";
import path from "path";

export class FsStorage implements StorageService {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private getFullPath(filePath: string): string {
    return path.join(this.baseDir, filePath);
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    const fullPath = this.getFullPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file);
    return `fs://${fullPath}`;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    await fs.unlink(fullPath);
  }

  async update(file: Buffer, filePath: string): Promise<string> {
    return this.upload(file, filePath);
  }

  async batchUpload(files: Buffer[], paths: string[]): Promise<string[]> {
    return Promise.all(files.map((file, i) => this.upload(file, paths[i])));
  }

  async batchDownload(paths: string[]): Promise<Buffer[]> {
    return Promise.all(paths.map((p) => this.download(p)));
  }

  async batchDelete(paths: string[]): Promise<void[]> {
    return Promise.all(paths.map((p) => this.delete(p)));
  }

  async batchUpdate(files: Buffer[], paths: string[]): Promise<string[]> {
    return Promise.all(files.map((file, i) => this.update(file, paths[i])));
  }
}
