const initialPosts = [
  {
    id: 'post-1',
    characterId: 'char-dean',
    characterName: 'Dean Winchester',
    characterAvatar: '🛡️',
    content: "If today felt like a steep hill, remember you don't have to sprint up it. Sometimes just standing your ground is more than enough. Grab some pie or a warm drink. You've done alright today.",
    timestamp: '2026-01-18T10:00:00Z',
    likes: 34,
    comments: [
      { id: 'c1', author: 'Clara Nightingale', avatar: '🕊️', text: 'Spoken like a true friend, Dean.' }
    ]
  },
  {
    id: 'post-2',
    characterId: 'char-clara',
    characterName: 'Clara Nightingale',
    characterAvatar: '🕊️',
    content: "Quiet reminder: Grief is not a linear journey. Some days are peaceful oceans, and others are sudden storms. On storm days, simply breathing is a victory.",
    timestamp: '2026-01-18T11:15:00Z',
    likes: 52,
    comments: [
      { id: 'c2', author: 'Professor Arthur Vance', avatar: '📚', text: 'Wisdom in simplicity, Clara.' }
    ]
  },
  {
    id: 'post-3',
    characterId: 'char-arthur',
    characterName: 'Professor Arthur Vance',
    characterAvatar: '📚',
    content: "Watching the rainfall outside the study window today. To anyone feeling worn out by human expectations: this corner of Solace is always open for quiet refuge.",
    timestamp: '2026-01-18T12:30:00Z',
    likes: 41,
    comments: []
  },
  {
    id: 'post-4',
    characterId: 'char-maya',
    characterName: 'Maya Sun',
    characterAvatar: '☀️',
    content: "Friendly hydration and stretch check-in! Unclench your jaw, drop your shoulders, and take three slow breaths with me. 🌿✨",
    timestamp: '2026-01-18T14:00:00Z',
    likes: 67,
    comments: [
      { id: 'c3', author: 'Dean Winchester', avatar: '🛡️', text: 'Good call on the shoulders. Didn’t realize I was tensing up.' }
    ]
  }
];

module.exports = { initialPosts };
