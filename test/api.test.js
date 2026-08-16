const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

let server;
const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test.before((done) => {
  server = app.listen(PORT, done);
});

test.after((done) => {
  if (server) server.close(done);
});

test('GET /api/health should return ok status', async () => {
  const res = await makeRequest('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.strictEqual(res.body.app, 'Solace AI Social');
});

test('GET /api/voices should return loaded app voice profiles', async () => {
  const res = await makeRequest('/api/voices');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.voices));
  assert.ok(res.body.voices.length >= 4);

  // Check if GravelBaritone_Protective (parsed from Seaneinchestersvouce) exists
  const gravelVoice = res.body.voices.find(v => v.id === 'gravel_baritone_protective');
  assert.ok(gravelVoice, 'GravelBaritone_Protective voice profile should be parsed and present');
  assert.strictEqual(gravelVoice.sliders.pitch_semitones, -2);
});

test('GET /api/characters and POST /api/characters', async () => {
  const getRes = await makeRequest('/api/characters');
  assert.strictEqual(getRes.status, 200);
  assert.ok(Array.isArray(getRes.body.characters));
  const initialCount = getRes.body.characters.length;

  const newCharPayload = {
    name: 'Elijah Haven',
    tagline: 'A gentle spirit offering quiet tea and presence.',
    avatar: '🕯️',
    vibe: 'Comforting & Quiet',
    voiceId: 'gentle_listener_soothing',
    bio: 'Elijah understands long quiet evenings and loss.',
    greeting: 'Welcome. Take a deep breath and relax.',
    creator: 'TestRunner'
  };

  const postRes = await makeRequest('/api/characters', 'POST', newCharPayload);
  assert.strictEqual(postRes.status, 201);
  assert.strictEqual(postRes.body.character.name, 'Elijah Haven');

  const afterGetRes = await makeRequest('/api/characters');
  assert.strictEqual(afterGetRes.body.characters.length, initialCount + 1);
});

test('GET /api/posts and POST /api/posts', async () => {
  const getRes = await makeRequest('/api/posts');
  assert.strictEqual(getRes.status, 200);
  assert.ok(Array.isArray(getRes.body.posts));

  const postPayload = {
    characterId: 'char-dean',
    content: 'Just checking in on everyone today. Remember to eat something.'
  };

  const createRes = await makeRequest('/api/posts', 'POST', postPayload);
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createRes.body.post.characterName, 'Dean Winchester');
});

test('POST /api/chat should generate empathetic companion response', async () => {
  const chatPayload = {
    characterId: 'char-dean',
    userMessage: 'I am struggling with grief and loss today.'
  };

  const chatRes = await makeRequest('/api/chat', 'POST', chatPayload);
  assert.strictEqual(chatRes.status, 200);
  assert.ok(chatRes.body.reply.length > 10);
  assert.strictEqual(chatRes.body.character.name, 'Dean Winchester');
  assert.strictEqual(chatRes.body.character.voiceId, 'gravel_baritone_protective');
});
