import { after, Assert, before, describe, it } from '@ephox/bedrock-client';

import { sendMouse } from '../../utils/Utils';

describe('Mouse reset', () => {
  let target: HTMLDivElement;
  let hovered = false;
  let movedAway = false;

  // We can't depend on Waiter here because it's
  const waitFor = async (label: string, predicate: () => boolean): Promise<void> => {
    for (let i = 0; i < 50 && !predicate(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    Assert.eq(label, true, predicate());
  };

  before(() => {
    target = document.createElement('div');
    target.id = 'mouse-reset-target';
    target.style.cssText = 'position: fixed; left: 150px; top: 150px; width: 100px; height: 100px; z-index: 1000;';
    target.addEventListener('mouseover', () => {
      hovered = true;
    });
    target.addEventListener('mouseout', () => {
      movedAway = true;
    });
    document.body.appendChild(target);
  });

  after(() => {
    document.body.removeChild(target);
  });

  // A click is used to park the pointer rather than a move, because Safari reports success for a
  // move without the page ever seeing it
  it('should move the real mouse over an element', async () => {
    await sendMouse('#mouse-reset-target', 'click');
    await waitFor('Target should have been hovered', () => hovered);
  });

  it('should have moved the mouse off the element before this test', async () => {
    await waitFor('Mouse should have left the target between tests', () => movedAway);
  });
});
