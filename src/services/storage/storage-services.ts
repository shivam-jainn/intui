export interface StorageService {
    upload(file: Buffer, path: string): Promise<string>;
    download(path: string): Promise<Buffer>;
    delete(path: string): Promise<void>;
    update(file: Buffer, path: string): Promise<string>;
    batchUpload(files: Buffer[], paths: string[]): Promise<string[]>;
    batchDownload(paths: string[]): Promise<Buffer[]>;
    batchDelete(paths: string[]): Promise<void[]>;
    batchUpdate(files: Buffer[], paths: string[]): Promise<string[]>;
}