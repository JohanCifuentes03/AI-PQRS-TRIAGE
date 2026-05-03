declare module 'json2csv' {
  export function parse<T extends object>(data: T[], opts?: { fields?: string[] }): string;
}

declare module 'pdfkit' {
  type TextOptions = {
    width?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
  };

  export default class PDFDocument {
    constructor(options?: { margin?: number; size?: string; bufferPages?: boolean });
    page: { width: number; height: number };
    y: number;
    on(event: 'data', listener: (chunk: Buffer | string) => void): this;
    on(event: 'end' | 'error', listener: (error?: Error) => void): this;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    text(text: string, options?: TextOptions): this;
    moveDown(lines?: number): this;
    font(name: string): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    strokeColor(color: string): this;
    fillColor(color: string): this;
    addPage(): this;
    end(): void;
    switchToPage(pageNumber: number): this;
    bufferedPageRange(): { start: number; count: number };
    heightOfString(text: string, options?: TextOptions): number;
  }
}
