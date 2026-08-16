// State variables
let charactersData = [];
let voiceProfilesData = [];
let activeCharacter = null;
let currentChatHistory = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupSliders();
  await fetchVoices();
  await fetchCharacters();
  await fetchPosts();
  setupFormHandlers();
  setupChatHandlers();
}

// 1. Navigation
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// 2. Sliders fine-tuning sync
function setupSliders() {
  const pitchSlider = document.getElementById('slider-pitch');
  const rateSlider = document.getElementById('slider-rate');
  const pitchVal = document.getElementById('pitch-val');
  const rateVal = document.getElementById('rate-val');

  if (pitchSlider && pitchVal) {
    pitchSlider.addEventListener('input', () => {
      pitchVal.textContent = pitchSlider.value;
    });
  }

  if (rateSlider && rateVal) {
    rateSlider.addEventListener('input', () => {
      rateVal.textContent = rateSlider.value;
    });
  }
}

// 3. API Calls & Rendering
async function fetchVoices() {
  try {
    const res = await fetch('/api/voices');
    const data = await res.json();
    voiceProfilesData = data.voices || [];
    renderVoiceProfiles(voiceProfilesData);
    populateVoiceSelectDropdown(voiceProfilesData);
  } catch (e) {
    console.error('Error fetching voices:', e);
  }
}

async function fetchCharacters() {
  try {
    const res = await fetch('/api/characters');
    const data = await res.json();
    charactersData = data.characters || [];
    renderCharactersGrid(charactersData);
    renderFeaturedCompanions(charactersData);

    if (charactersData.length > 0 && !activeCharacter) {
      setActiveCharacter(charactersData[0]);
    }
  } catch (e) {
    console.error('Error fetching characters:', e);
  }
}

async function fetchPosts() {
  try {
    const res = await fetch('/api/posts');
    const data = await res.json();
    renderFeedPosts(data.posts || []);
  } catch (e) {
    console.error('Error fetching posts:', e);
  }
}

// Render Voice Profiles tab
function renderVoiceProfiles(voices) {
  const container = document.getElementById('voice-profiles-container');
  if (!container) return;

  container.innerHTML = voices.map(v => `
    <div class="voice-card">
      <h3>${v.name}</h3>
      <p class="desc">${v.description}</p>
      <div class="voice-sliders-list">
        <div><strong>Pitch:</strong> ${v.sliders.pitch_semitones} semitones</div>
        <div><strong>Rate:</strong> ${v.sliders.rate_percent}%</div>
        <div><strong>Volume:</strong> ${v.sliders.volume_db} dB</div>
        ${v.sliders.breathiness_pct ? `<div><strong>Breathiness:</strong> ${v.sliders.breathiness_pct}%</div>` : ''}
      </div>
      <p><strong>Sample Line:</strong> "${v.test_lines[0] || ''}"</p>
      <button class="secondary-btn btn-sm" style="margin-top: 0.8rem;" onclick="speakSample('${v.test_lines[0]}', ${JSON.stringify(v.sliders).replace(/"/g, '&quot;')})">
        🔊 Test Voice
      </button>
    </div>
  `).join('');
}

function populateVoiceSelectDropdown(voices) {
  const select = document.getElementById('char-voice');
  if (!select) return;

  select.innerHTML = voices.map(v => `
    <option value="${v.id}">${v.name} (${v.category || 'App Voice'})</option>
  `).join('');
}

// Render Feed Posts
function renderFeedPosts(posts) {
  const container = document.getElementById('feed-posts-container');
  if (!container) return;

  container.innerHTML = posts.map(p => `
    <div class="post-card">
      <div class="post-header">
        <div class="avatar">${p.characterAvatar || '🛡️'}</div>
        <div class="post-author">
          <h4>${p.characterName}</h4>
          <span>${new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div class="post-body">${p.content}</div>
      <div class="post-actions">
        <button class="action-btn" onclick="likePost('${p.id}')">
          ❤️ <span>${p.likes} Likes</span>
        </button>
        <button class="action-btn" onclick="openChatWithCharacter('${p.characterId}')">
          💬 Chat with ${p.characterName}
        </button>
      </div>
    </div>
  `).join('');
}

async function likePost(postId) {
  try {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    fetchPosts();
  } catch (e) {
    console.error('Error liking post:', e);
  }
}

// Render Character Cards
function renderCharactersGrid(characters) {
  const container = document.getElementById('characters-grid');
  if (!container) return;

  container.innerHTML = characters.map(c => `
    <div class="character-card">
      <div>
        <span class="vibe-tag">${c.vibe}</span>
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem;">
          <span style="font-size: 2rem;">${c.avatar}</span>
          <h3>${c.name}</h3>
        </div>
        <p>${c.tagline}</p>
        <div style="font-size: 0.8rem; color: var(--accent-purple); margin-bottom: 1rem;">
          🎙️ Voice: ${c.voiceName || 'App Voice'}
        </div>
      </div>
      <button class="primary-btn" onclick="openChatWithCharacter('${c.id}')">
        Chat & Listen
      </button>
    </div>
  `).join('');
}

function renderFeaturedCompanions(characters) {
  const container = document.getElementById('featured-list');
  if (!container) return;

  container.innerHTML = characters.slice(0, 3).map(c => `
    <div class="mini-companion-item">
      <div class="mini-companion-info">
        <span>${c.avatar}</span>
        <div>
          <strong style="font-size: 0.9rem;">${c.name}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${c.vibe}</div>
        </div>
      </div>
      <button class="secondary-btn btn-sm" onclick="openChatWithCharacter('${c.id}')">Chat</button>
    </div>
  `).join('');
}

// 4. Character Creation Form
function setupFormHandlers() {
  const form = document.getElementById('create-character-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('char-name').value.trim();
    const avatar = document.getElementById('char-avatar').value.trim() || '🛡️';
    const tagline = document.getElementById('char-tagline').value.trim();
    const vibe = document.getElementById('char-vibe').value;
    const voiceId = document.getElementById('char-voice').value;
    const bio = document.getElementById('char-bio').value.trim();
    const greeting = document.getElementById('char-greeting').value.trim();

    const pitch = parseInt(document.getElementById('slider-pitch').value, 10);
    const rate = parseInt(document.getElementById('slider-rate').value, 10);

    const payload = {
      name,
      avatar,
      tagline,
      vibe,
      voiceId,
      bio,
      greeting,
      voiceSettings: {
        pitch_semitones: pitch,
        rate_percent: rate,
        volume_db: 0
      }
    };

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert(`AI Companion "${name}" created successfully!`);
        form.reset();
        await fetchCharacters();
        await fetchPosts();
        openChatWithCharacter(data.character.id);
      }
    } catch (e) {
      console.error('Error creating character:', e);
    }
  });
}

// 5. Chat Interaction & Active Companion
function setActiveCharacter(character) {
  activeCharacter = character;
  currentChatHistory = [];

  const nameEl = document.getElementById('chat-name');
  const avatarEl = document.getElementById('chat-avatar');
  const voiceBadgeEl = document.getElementById('chat-voice-badge');
  const activeCardEl = document.getElementById('active-companion-card');

  if (nameEl) nameEl.textContent = character.name;
  if (avatarEl) avatarEl.textContent = character.avatar;
  if (voiceBadgeEl) voiceBadgeEl.textContent = `Voice: ${character.voiceName || 'App Voice'}`;

  if (activeCardEl) {
    activeCardEl.innerHTML = `
      <span class="avatar-lg">${character.avatar}</span>
      <strong style="font-size: 1.1rem; color: var(--accent-teal);">${character.name}</strong>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.4rem;">${character.tagline}</p>
      <span class="voice-badge">🎙️ ${character.voiceName || 'App Voice'}</span>
    `;
  }

  // Clear & Add Initial Greeting
  const chatMessagesEl = document.getElementById('chat-messages');
  if (chatMessagesEl) {
    chatMessagesEl.innerHTML = '';
    appendChatMessage(character.greeting, 'ai', character);
    if (document.getElementById('tts-toggle')?.checked) {
      speakMessage(character.greeting, character.voiceSettings);
    }
  }
}

function openChatWithCharacter(characterId) {
  const char = charactersData.find(c => c.id === characterId);
  if (char) {
    setActiveCharacter(char);
    // Switch tab to Chat Room
    const chatTabBtn = document.querySelector('[data-tab="chat-tab"]');
    if (chatTabBtn) chatTabBtn.click();
  }
}

function setupChatHandlers() {
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');
  const testVoiceBtn = document.getElementById('test-voice-btn');

  if (sendBtn && chatInput) {
    const handleSend = async () => {
      const text = chatInput.value.trim();
      if (!text || !activeCharacter) return;

      appendChatMessage(text, 'user');
      chatInput.value = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: activeCharacter.id,
            userMessage: text,
            history: currentChatHistory
          })
        });

        if (res.ok) {
          const data = await res.json();
          appendChatMessage(data.reply, 'ai', activeCharacter);

          if (document.getElementById('tts-toggle')?.checked) {
            speakMessage(data.reply, activeCharacter.voiceSettings);
          }
        }
      } catch (e) {
        console.error('Error sending message:', e);
      }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      if (activeCharacter) {
        speakSample(`Hello, I am ${activeCharacter.name}. I'm right here with you.`, activeCharacter.voiceSettings);
      }
    });
  }
}

function appendChatMessage(text, sender, charInfo = null) {
  const chatMessagesEl = document.getElementById('chat-messages');
  if (!chatMessagesEl) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;

  if (sender === 'ai') {
    msgDiv.innerHTML = `
      <div>${text}</div>
      <button class="msg-play-btn" onclick="speakMessage('${text.replace(/'/g, "\\'")}', ${JSON.stringify(charInfo ? charInfo.voiceSettings : {}).replace(/"/g, '&quot;')})">
        🔊 Speak Line
      </button>
    `;
  } else {
    msgDiv.textContent = text;
  }

  chatMessagesEl.appendChild(msgDiv);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

  currentChatHistory.push({ sender, text });
}

// 6. Text-To-Speech (TTS) Voice Engine
function speakMessage(text, voiceSettings = {}) {
  if (!('speechSynthesis' in window)) {
    console.log('Web Speech API synthesis not supported in this browser environment.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop ongoing audio

  const utterance = new SpeechSynthesisUtterance(text);

  // Apply Pitch semitones mapping
  // Standard Web Speech pitch is 0.5 to 1.5
  if (voiceSettings.pitch_semitones !== undefined) {
    utterance.pitch = Math.max(0.5, Math.min(1.5, 1.0 + (voiceSettings.pitch_semitones * 0.1)));
  }

  // Apply Rate percent mapping
  if (voiceSettings.rate_percent !== undefined) {
    utterance.rate = Math.max(0.6, Math.min(1.5, voiceSettings.rate_percent / 100));
  }

  window.speechSynthesis.speak(utterance);
}

function speakSample(text, voiceSettings) {
  speakMessage(text, voiceSettings);
}
