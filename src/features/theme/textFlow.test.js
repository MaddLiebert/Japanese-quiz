import test from 'node:test';
import assert from 'node:assert/strict';
import { flowAtStop, writingMode, textFlowCss } from './textFlow.js';

test('flowAtStop: 0 di awal, 1 di akhir', () => {
  assert.equal(flowAtStop(0), 0);
  assert.equal(flowAtStop(7), 1);
});

test('flowAtStop: clamp di luar rentang', () => {
  assert.equal(flowAtStop(-3), 0);
  assert.equal(flowAtStop(99), 1);
});

test('writingMode: <0.5 tegak, >=0.5 datar', () => {
  assert.equal(writingMode(0.2), 'vertical-rl');
  assert.equal(writingMode(0.5), 'horizontal-tb');
  assert.equal(writingMode(1), 'horizontal-tb');
});

test('textFlowCss: var + writingMode', () => {
  const css = textFlowCss(7);
  assert.equal(css['--text-flow'], '1');
  assert.equal(css.writingMode, 'horizontal-tb');
});
