import { AwsStorage } from "./providers/aws";
import { GcpStorage } from "./providers/gcp";
import { StorageService } from "./storage-services";

type CommonConfig = {
  config?: any; 
  bucketName: string;
}

type AwsConfig = CommonConfig & {
  provider: "aws";

};

type GcpConfig = CommonConfig & {
  provider: "gcp";
  credentials : Record<string,string>;
};

type StorageConfig = AwsConfig | GcpConfig;

export class Storage {
  private storageService: StorageService;

  constructor(config: StorageConfig) {

    if(!('provider' in config)){
      throw new Error(`Provide Provider in Config`);
    }

    if (config.provider === "aws") {
      this.storageService = new AwsStorage(); 
    } else if (config.provider === "gcp") {
      if (!config.bucketName) {
        throw new Error("Bucket name is required for GCP.");
      }
      this.storageService = new GcpStorage(config.config, config.bucketName,config.credentials);
    } else {
      throw new Error(`Unsupported storage provider: ${config}`);
    }
  }

  // CRUD Operations:
  upload(file: Buffer, path: string): Promise<string> {
    return this.storageService.upload(file, path);
  }

  download(path: string): Promise<Buffer> {
    return this.storageService.download(path);
  }

  delete(path: string): Promise<void> {
    return this.storageService.delete(path);
  }

  update(file: Buffer, path: string): Promise<string> {
    return this.storageService.update(file, path);
  }

  // Batch Operations:
  batchUpload(files: Buffer[], paths: string[]): Promise<string[]> {
    return this.storageService.batchUpload(files, paths);
  }

  batchDownload(paths: string[]): Promise<Buffer[]> {
    return this.storageService.batchDownload(paths);
  }

  batchDelete(paths: string[]): Promise<void[]> {
    return this.storageService.batchDelete(paths);
  }

  batchUpdate(files: Buffer[], paths: string[]): Promise<string[]> {
    return this.storageService.batchUpdate(files, paths);
  }
}
