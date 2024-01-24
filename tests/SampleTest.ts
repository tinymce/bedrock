import { expect } from "chai";
import { describe, it } from "@ephox/bedrock-client";

const MAX_REPS = 60;

const delay = (s: number) => new Promise(res => setTimeout(res, s * 1000));

describe('Testing Sample', () => {
    for(let i = 0; i < MAX_REPS; i++) {

        it('should pass for True', async () => {
            await delay(1);
            expect(true).to.be.true;
        });

    }
});