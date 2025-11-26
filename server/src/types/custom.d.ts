declare module "multer" {
  import { RequestHandler } from "express";
  namespace multer {
    interface DiskStorageOptions {
      destination?: (
        req: any,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void
      ) => void;
      filename?: (
        req: any,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void
      ) => void;
    }

    interface Multer {
      single(name: string): RequestHandler;
    }

    function diskStorage(options: DiskStorageOptions): StorageEngine;
    interface StorageEngine {}
  }

  function multer(options?: { storage?: multer.StorageEngine }): multer.Multer;
  export = multer;
}

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}

declare module "pdfkit" {
  class PDFDocument {
    constructor(options?: any);
    pipe(destination: NodeJS.WritableStream): NodeJS.WritableStream;
    fontSize(size: number): this;
    text(text: string, options?: any): this;
    moveDown(lines?: number): this;
    image(src: string, options?: any): this;
    fillColor(color: string): this;
    end(): void;
  }

  export = PDFDocument;
}
