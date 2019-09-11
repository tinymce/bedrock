declare module 'xml-writer' {
  type Content = string | number | (() => string) | XMLWriter;

  class XMLWriter {
    name_regex: RegExp;
    indent: boolean;
    indentString: string;
    output: string;
    stack: any[];
    tags: number;
    attributes: number;
    attribute: number;
    texts: number;
    comment: number;
    dtd: number;
    root: number;
    pi: number;
    cdata: number;
    started_write: boolean;
    writer: (content: string, encoding: string) => void;
    writer_encoding: string;

    constructor(indent: boolean, callback?: (content: string, encoding: string) => void);

    toString(): string;
    indenter(): void;
    write(): void;
    flush(): void;
    startDocument(version?: string, encoding?: string, standalone?: boolean): this;
    endDocument(): this;
    writeElement(name: string, content: Content): this;
    writeElementNS(prefix: string, name: string, uri: string, content: Content): this;
    startElement(name: string): this;
    startElementNS(prefix: string, name: string, uri: string): this;
    endElement(): this;
    writeAttribute(name: string, content?: Content | boolean): this;
    writeAttributeNS(prefix: string, name: string, uri: string, content?: Content | boolean): this;
    startAttributes(): this;
    endAttributes(): this;
    startAttribute(name: string): this;
    startAttributeNS(prefix: string, name: string, uri: string): this;
    endAttribute(): this;
    text(content: Content): this;
    writeComment(content: Content): this;
    startComment(): this;
    endComment(): this;
    writeDocType(name: string, pubid?: string, sysid?: string, subset?: string): this;
    startDocType(name: string, pubid?: string, sysid?: string, subset?: string): this
    endDocType(): this;
    writePI(name: string, content: Content): this;
    startPI(name: string): this;
    endPI(): this;
    writeCData(content: Content): this;
    startCData(): this;
    endCData(): this;
    writeRaw(content: Content): this;
  }

  export = XMLWriter;
}