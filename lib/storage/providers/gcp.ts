import { Storage } from "@google-cloud/storage";
import { StorageService } from "../storage-services";

export class GcpStorage implements StorageService {
  private storage: Storage;
  private bucketName: string;
  
  constructor(config: any,bucketName:string,_credentials:Record<string,string>) {
    const _config = {...config,"credentials":_credentials};
    console.log(_config)
    this.storage = new Storage(_config);
    this.bucketName = bucketName;
  }

  async upload(file: Buffer, path: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileUpload = bucket.file(path);

    console.log(fileUpload);
    // await fileUpload.save(file);
    return `gcp://${this.bucketName}/${path}`;
  }

  async download(path: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileDownload = bucket.file(path);
    console.log(fileDownload);
    const [content] = await fileDownload.download();
    return content;
  }

  async delete(path: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileDelete = bucket.file(path);

    await fileDelete.delete();
    console.log(`GCP deleted: ${path}`);
  }

  async update(file: Buffer, path: string): Promise<string> {
    // Same as upload for overwrite
    return this.upload(file, path);
  }

  async batchUpload(files: Buffer[], paths: string[]): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const uploadPromises = files.map((file, index) => {
      const fileUpload = bucket.file(paths[index]);
      return fileUpload.save(file).then(() => `gcp://${this.bucketName}/${paths[index]}`);
    });
    return Promise.all(uploadPromises);
  }

  async batchDownload(paths: string[]): Promise<Buffer[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const downloadPromises = paths.map((path) => {
      const fileDownload = bucket.file(path);
      return fileDownload.download().then(([content]) => content);
    });
    return Promise.all(downloadPromises);
  }

  async batchDelete(paths: string[]): Promise<any[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const deletePromises = paths.map((path) => {
      const fileDelete = bucket.file(path);
      return fileDelete.delete();
    });
    return Promise.all(deletePromises);
  }

  async batchUpdate(files: Buffer[], paths: string[]): Promise<string[]> {
    return this.batchUpload(files, paths);
  }
}
