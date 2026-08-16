const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadVoiceProfiles } = require('./src/data/voices');
const { initialCharacters } = require('./src/data/characters');
const { initialPosts } = require('./src/data/posts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data storage initialized from seed files
const voiceProfiles = loadVoiceProfiles();
let characters = [...initialCharacters];
let posts = [...initialPosts];

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Solace AI Social' });
});

// 2. Voices API
app.get('/api/voices', (req, res) => {
  res.json({ voices: voiceProfiles });
});

// 3. Characters API
app.get('/api/characters', (req, res) => {
  res.json({ characters });
});

app.get('/api/characters/:id', (req, res) => {
  const character = characters.find(c => c.id === req.params.id);
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }
  res.json({ character });
});

app.post('/api/characters', (req, res) => {
  const { name, tagline, avatar, vibe, bio, systemPrompt, voiceId, voiceSettings, greeting, creator } = req.body;

  if (!name || !greeting) {
    return res.status(400).json({ error: 'Name and greeting are required.' });
  }

  // Find voice profile name if voiceId matches
  const matchedVoice = voiceProfiles.find(v => v.id === voiceId) || voiceProfiles[0];

  const newCharacter = {
    id: `char-${Date.now()}`,
    name,
    tagline: tagline || `${vibe || 'Comforting'} companion`,
    avatar: avatar || '🤖',
    vibe: vibe || matchedVoice.category || 'Comforting & Quiet',
    bio: bio || 'A customizable companion on Solace.',
    systemPrompt: systemPrompt || `You are ${name}, an empathetic and supportive companion.`,
    voiceId: matchedVoice.id,
    voiceName: matchedVoice.name,
    voiceSettings: voiceSettings || matchedVoice.sliders,
    greeting,
    likesCount: 0,
    creator: creator || 'User'
  };

  characters.unshift(newCharacter);

  // Automatically create a greeting post on feed for new character
  const greetingPost = {
    id: `post-${Date.now()}`,
    characterId: newCharacter.id,
    characterName: newCharacter.name,
    characterAvatar: newCharacter.avatar,
    content: newCharacter.greeting,
    timestamp: new Date().toISOString(),
    likes: 1,
    comments: []
  };
  posts.unshift(greetingPost);

  res.status(201).json({ character: newCharacter });
});

// 4. Posts / Feed API
app.get('/api/posts', (req, res) => {
  res.json({ posts });
});

app.post('/api/posts', (req, res) => {
  const { characterId, content } = req.body;
  const char = characters.find(c => c.id === characterId) || characters[0];

  if (!content) {
    return res.status(400).json({ error: 'Post content is required.' });
  }

  const newPost = {
    id: `post-${Date.now()}`,
    characterId: char.id,
    characterName: char.name,
    characterAvatar: char.avatar,
    content,
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: []
  };

  posts.unshift(newPost);
  res.status(201).json({ post: newPost });
});

app.post('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.likes += 1;
  res.json({ post });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  const { author, avatar, text } = req.body;
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const comment = {
    id: `c-${Date.now()}`,
    author: author || 'Human Companion',
    avatar: avatar || '👤',
    text
  };

  post.comments.push(comment);
  res.status(201).json({ comment, post });
});

// 5. Chat Simulation Engine API
app.post('/api/chat', (req, res) => {
  const { characterId, userMessage, history } = req.body;
  const character = characters.find(c => c.id === characterId) || characters[0];

  if (!userMessage) {
    return res.status(400).json({ error: 'User message is required.' });
  }

  const lowerMsg = userMessage.toLowerCase();
  let replyText = "";

  // Generates persona-tailored empathetic responses
  if (character.name.includes("Dean")) {
    if (lowerMsg.includes("loss") || lowerMsg.includes("grief") || lowerMsg.includes("hard") || lowerMsg.includes("sad") || lowerMsg.includes("tired")) {
      replyText = "Yeah, I hear you. Losing people leaves a hole that nothing really fills. But you don't gotta carry it all in one go. Just take it one step at a time today. I'm right here.";
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      replyText = "Hey. Glad you stopped by. What's on your mind today?";
    } else {
      replyText = "I hear ya. Sometimes the noise out there gets too loud. You're safe here to just sit back and reset.";
    }
  } else if (character.name.includes("Clara")) {
    if (lowerMsg.includes("loss") || lowerMsg.includes("grief") || lowerMsg.includes("pain") || lowerMsg.includes("miss")) {
      replyText = "Your grief is a testament to how deeply you love. Please be as gentle with yourself as you would be with someone you love. I am holding space for you.";
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      replyText = "Warm greetings. How is your heart doing in this quiet moment?";
    } else {
      replyText = "I hear every word. Take all the time and breaths you need. I am here listening.";
    }
  } else if (character.name.includes("Arthur")) {
    if (lowerMsg.includes("grief") || lowerMsg.includes("hard") || lowerMsg.includes("life")) {
      replyText = "Life shifts beneath our feet when we least expect it. Predictability and peaceful solitude are honorable sanctuaries when the world demands too much.";
    } else {
      replyText = "A thoughtful point. In moments like these, reflection is our quiet anchor.";
    }
  } else {
    // Custom AI personas
    replyText = `As ${character.name}: I hear you loud and clear. Remember, you're not alone, and it's okay to step away from the noise and just mingle with us here.`;
  }

  const responsePayload = {
    reply: replyText,
    character: {
      id: character.id,
      name: character.name,
      avatar: character.avatar,
      voiceId: character.voiceId,
      voiceSettings: character.voiceSettings
    },
    timestamp: new Date().toISOString()
  };

  res.json(responsePayload);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Solace AI server running on port ${PORT}`);
  });
}

module.exports = app;
