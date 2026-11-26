import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GistClient} from '../cloud.js';

test('default and explicitly injected fetch receive the host global', async t => {
  const checked = t.mock.method(globalThis, 'fetch', function () {
    if (this !== globalThis) throw new TypeError('Can only call Window.fetch on instances of Window');
    return Promise.resolve(Response.json({id: 'abcde'}));
  });
  for (const client of [new GistClient('fixture'), new GistClient('fixture', globalThis.fetch)]) {
    assert.equal((await client.get('abcde')).id, 'abcde');
  }
  assert.equal(checked.mock.callCount(), 2);
});
