const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const BASE_URL = 'http://127.0.0.1:3100';
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/context`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw new Error('Server did not start in time');
}

test.before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '3100' },
    stdio: 'ignore'
  });

  await waitForServer();
});

test.after(() => {
  server.kill();
});

test('GET /api/context returns dashboard data', async () => {
  const response = await fetch(`${BASE_URL}/api/context`);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.company.chapter, '4.1 Contexto de la organización');
  assert.equal(payload.sections.length, 3);
  assert.ok(payload.evidence.includes('Mapa de procesos'));
});

test('POST /api/context/analysis returns recommendations', async () => {
  const response = await fetch(`${BASE_URL}/api/context/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'continue' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.mode, 'continue');
  assert.equal(payload.status, 'ok');
  assert.equal(payload.recommendations.length, 3);
});
