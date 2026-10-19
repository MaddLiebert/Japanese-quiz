import test from 'node:test';
import assert from 'node:assert/strict';
import {
  broadcastReady, broadcastSwitchTeam, broadcastStartGame,
  broadcastAnswer, broadcastEmote, broadcastMatchEnd, broadcastPause,
} from './multiplayerApi.js';

// Mock Channel
function createMockChannel() {
  const sent = [];
  return {
    sent,
    send(msg) {
      sent.push(msg);
    },
  };
}

test('broadcastReady: kirim payload isReady', () => {
  const ch = createMockChannel();
  broadcastReady(ch, 'p1', true);
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'player_ready');
  assert.deepEqual(ch.sent[0].payload, { playerId: 'p1', isReady: true });
});

test('broadcastSwitchTeam: kirim targetTeam', () => {
  const ch = createMockChannel();
  broadcastSwitchTeam(ch, 'p1', 'blue');
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'switch_team');
  assert.deepEqual(ch.sent[0].payload, { playerId: 'p1', targetTeam: 'blue' });
});

test('broadcastStartGame: kirim seed dan startedAt', () => {
  const ch = createMockChannel();
  broadcastStartGame(ch, { seed: 12345, startedAt: 1000 });
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'game_start');
  assert.deepEqual(ch.sent[0].payload, { seed: 12345, startedAt: 1000 });
});

test('broadcastAnswer: kirim poin dan kebenaran', () => {
  const ch = createMockChannel();
  broadcastAnswer(ch, { playerId: 'p1', team: 'red', qIndex: 2, isCorrect: true, points: 88 });
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'player_answer');
  assert.deepEqual(ch.sent[0].payload, { playerId: 'p1', team: 'red', qIndex: 2, isCorrect: true, points: 88 });
});

test('broadcastEmote: kirim kanji emote', () => {
  const ch = createMockChannel();
  broadcastEmote(ch, 'p1', '炎');
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'send_emote');
  assert.deepEqual(ch.sent[0].payload, { playerId: 'p1', emote: '炎' });
});

test('broadcastMatchEnd: kirim finalScores ke channel', () => {
  const ch = createMockChannel();
  const finalScores = { red: 120, blue: 90, perPlayer: { p1: 60 } };
  broadcastMatchEnd(ch, { finalScores });
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'match_end');
  assert.deepEqual(ch.sent[0].payload, { finalScores });
});

test('broadcastPause: kirim status jeda', () => {
  const ch = createMockChannel();
  broadcastPause(ch, { paused: true, by: 'p1', role: 'spectator' });
  assert.equal(ch.sent.length, 1);
  assert.equal(ch.sent[0].event, 'pause');
  assert.deepEqual(ch.sent[0].payload, { paused: true, by: 'p1', role: 'spectator' });
});

test('broadcast helper aman saat channel null (fail-open)', () => {
  assert.doesNotThrow(() => {
    broadcastReady(null, 'p1', true);
    broadcastSwitchTeam(null, 'p1', 'red');
    broadcastStartGame(null, {});
    broadcastAnswer(null, {});
    broadcastEmote(null, 'p1', '笑');
    broadcastMatchEnd(null, {});
    broadcastPause(null, {});
  });
});
