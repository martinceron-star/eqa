const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { createServer, dataFile, writeOrganizations } = require('../server');

let server;
let baseUrl;

test.before(async () => {
  writeOrganizations([]);
  server = createServer().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  fs.writeFileSync(dataFile, '[]', 'utf8');
});

test('GET /api/catalog returns seed data', async () => {
  const response = await fetch(`${baseUrl}/api/catalog`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.countries.length > 0);
  assert.ok(data.industries.includes('Tecnología'));
});

test('POST /api/organizations stores a valid organization', async () => {
  const response = await fetch(`${baseUrl}/api/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Acme Corp',
      country: 'México',
      industry: 'Tecnología',
      employees: '11 - 50',
      selectedProcesses: ['Gestión documental']
    })
  });

  assert.equal(response.status, 201);
  const data = await response.json();
  assert.equal(data.organization.companyName, 'Acme Corp');

  const listResponse = await fetch(`${baseUrl}/api/organizations`);
  const organizations = await listResponse.json();
  assert.equal(organizations.length, 1);
});

test('POST /api/organizations validates required fields', async () => {
  const response = await fetch(`${baseUrl}/api/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName: '' })
  });

  assert.equal(response.status, 400);
});
