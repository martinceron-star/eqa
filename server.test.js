const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { requestHandler, demoUser } = require('./server');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(requestHandler);
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

test('GET / responde con el HTML del login', async () => {
  const { server, port } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Inicia sesión/);
  } finally {
    server.close();
  }
});

test('POST /api/login valida las credenciales demo', async () => {
  const { server, port } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoUser)
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.user.email, demoUser.email);
  } finally {
    server.close();
  }
});

test('POST /api/login rechaza credenciales inválidas', async () => {
  const { server, port } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'otro@empresa.com',
        password: 'incorrecta'
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.ok, false);
  } finally {
    server.close();
  }
});
