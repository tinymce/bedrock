export interface HarnessResponse {
  readonly chunk: number;
  readonly mode: 'auto' | 'manual';
  readonly stopOnFailure: boolean;
  readonly retries: number;
  readonly timeout: number;
}