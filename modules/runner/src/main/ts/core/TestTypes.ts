export interface TestData {
  readonly filePath: string;
  readonly name: string;
  readonly test: (success: () => void, failure: (e: any) => void) => void;
}