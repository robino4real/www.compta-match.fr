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

  interface MulterOptions {
    storage?: multer.StorageEngine;
    limits?: {
      fileSize?: number;
    };
    fileFilter?: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void
    ) => void;
  }

  function multer(options?: MulterOptions): multer.Multer;
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
    [key: string]: any;
    constructor(options?: any);
    pipe(destination: NodeJS.WritableStream): NodeJS.WritableStream;
    fontSize(size: number): this;
    text(text: string, options?: any): this;
    text(text: string, x: number, y: number, options?: any): this;
    moveDown(lines?: number): this;
    image(src: string | Buffer, options?: any): this;
    image(src: string | Buffer, x: number, y: number, options?: any): this;
    fillColor(color: string): this;
    fill(color?: string): this;
    addPage(options?: any): this;
    rect(x: number, y: number, width: number, height: number): this;
    roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
    heightOfString(text: string, options?: any): number;
    readonly page: {
      width: number;
      height: number;
      margins: { left: number; right: number; top: number; bottom: number };
    };
    y: number;
    end(): void;
  }

  export = PDFDocument;
}
