import { Tests } from '@ephox/bedrock-common';

export interface RootSuite extends Tests.Suite {
  readonly filePath: string;
}