export interface HarnessResponse {
  chunk: number;
  mode: 'auto' | 'manual';
  stopOnFailure: boolean;
  retries: number;
  timeout: number;
}