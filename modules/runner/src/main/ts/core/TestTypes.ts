export interface TestData {
  filePath: string;
  name: string;
  test: (success: () => void, failure: (e: any) => void) => void;
}