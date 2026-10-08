import test from 'node:test';
import assert from 'node:assert/strict';
import { truncate, renderTelegram, telegramById } from './telegram.js';

test('truncate: potong + ellipsis', () => {
  assert.equal(truncate('abcdef', 3), 'abc…');
});

test('truncate: cutAt >= panjang → apa adanya', () => {
  assert.equal(truncate('abc', 10), 'abc');
  assert.equal(truncate('abc', 0), 'abc');
});

test('renderTelegram: item cut → terpotong; biasa → utuh', () => {
  const cut = telegramById('cut');
  assert.match(renderTelegram(cut, 3), /…$/);
  const welcome = telegramById('welcome');
  assert.equal(renderTelegram(welcome), welcome.jp);
});

test('renderTelegram: item null → string kosong', () => {
  assert.equal(renderTelegram(null), '');
});
