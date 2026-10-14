import test from 'node:test';
import assert from 'node:assert/strict';
import { createSingleFlight } from './singleFlight.js';

test('createSingleFlight: panggilan bersamaan → fn dijalankan SEKALI', async () => {
  let calls = 0;
  let release;
  const gate = new Promise((r) => { release = r; });
  const run = createSingleFlight(async () => { calls += 1; await gate; return calls; });

  const a = run();
  const b = run();
  const c = run();
  assert.equal(run.isRunning(), true);

  release();
  assert.equal(await a, 1);
  assert.equal(await b, 1);
  assert.equal(await c, 1);
  assert.equal(calls, 1);
});

test('createSingleFlight: setelah selesai, panggilan berikutnya jalan lagi', async () => {
  let calls = 0;
  const run = createSingleFlight(async (x) => { calls += 1; return x * 2; });

  assert.equal(await run(2), 4);
  assert.equal(await run(3), 6);
  assert.equal(calls, 2);
  assert.equal(run.isRunning(), false);
});

test('createSingleFlight: error TIDAK mengunci (bisa retry)', async () => {
  let calls = 0;
  const run = createSingleFlight(async () => {
    calls += 1;
    if (calls === 1) throw new Error('boom');
    return 'ok';
  });

  await assert.rejects(run(), /boom/);
  assert.equal(await run(), 'ok');
  assert.equal(calls, 2);
});

test('createSingleFlight: panggilan bersamaan yang gagal → semua menolak, fn sekali', async () => {
  let calls = 0;
  const run = createSingleFlight(async () => { calls += 1; throw new Error('nope'); });

  const a = run();
  const b = run();
  await assert.rejects(a, /nope/);
  await assert.rejects(b, /nope/);
  assert.equal(calls, 1);
});
