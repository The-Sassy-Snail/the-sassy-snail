document.addEventListener('DOMContentLoaded', () => {
  const postFeed = document.getElementById('post-feed');
  const tags = document.querySelectorAll('.tag');

  fetch('content/posts.json')
    .then(response => response.json())
    .then(posts => {
      displayPosts(posts);

      tags.forEach(tag => {
        tag.addEventListener('click', () => {
          document.querySelector('.tag.active').classList.remove('active');
          tag.classList.add('active');
          const tagFilter = tag.textContent.trim().toLowerCase();
          const filteredPosts = tagFilter === 'all'
            ? posts
            : posts.filter(post => post.tags.includes(tagFilter));
          displayPosts(filteredPosts);
        });
      });

      function displayPosts(posts) {
        postFeed.innerHTML = '';

        posts.forEach(post => {
          const postEl = document.createElement('div');
          postEl.className = 'post';
          postEl.innerHTML = `
            <img src="${post.image}" alt="${post.title}" />
            <p class="date">${post.date}</p>
            <p class="title">${post.title}</p>
          `;
          postEl.addEventListener('click', () => openPost(post));
          postFeed.appendChild(postEl);
        });
      }

      function openPost(post) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <img src="${post.image}" alt="${post.title}" />
            <h2>${post.title}</h2>
            <p class="date">${post.date}</p>
          </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close').onclick = () => modal.remove();
        window.onclick = (e) => { if (e.target == modal) modal.remove(); };
      }
    });

document.addEventListener('mousemove', (e) => {
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
});


// Trigger glitch effect
function triggerGlitch() {
  const glitchOverlay = document.querySelector('.glitch-overlay');
  glitchOverlay.classList.add('glitch-active');

  setTimeout(() => {
    glitchOverlay.classList.remove('glitch-active');
  }, 600); // Match CSS animation duration
}

function triggerGlitch() {
  const glitchOverlay = document.querySelector('.glitch-overlay');
  const glitchAudio = document.getElementById('glitch-audio');

  // Visual effect
  glitchOverlay.classList.add('glitch-active');
  setTimeout(() => {
    glitchOverlay.classList.remove('glitch-active');
  }, 600);

  // Audio effect
  if (glitchAudio) {
    glitchAudio.currentTime = 0;
    glitchAudio.play();
  }
}

// Random glitch interval (15–30s)
function randomGlitchInterval() {
  const interval = Math.floor(Math.random() * (12000 - 5000 + 1)) + 5000;
  setTimeout(() => {
    triggerGlitch();
    randomGlitchInterval();
  }, interval);
}

// Start glitch effect loop
randomGlitchInterval();

// Subtle page distortion based on mouse movement
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 4;
  const y = (e.clientY / window.innerHeight - 0.5) * 4;

  document.body.style.transform = `skew(${x}deg, ${y}deg)`;
  document.body.style.transition = 'transform 0.2s ease';
});

document.addEventListener('mouseleave', () => {
  document.body.style.transform = 'none';
});

const whispers = [
  'hello.',
  'you good?',
  'who sent you?',
  'Yes, I am watching you',
  'Do you even remember?',
  'art is a threat',
  'leave. or don’t.',
  'don’t click it.',
  'this isn’t real',
  'stay weird.',
  'what even is this?'
];

setInterval(() => {
  const w = document.createElement('div');
  w.className = 'whisper';
  w.textContent = whispers[Math.floor(Math.random() * whispers.length)];

  // Random screen position (within safe bounds)
  const x = Math.floor(Math.random() * (window.innerWidth - 150));
  const y = Math.floor(Math.random() * (window.innerHeight - 50));
  w.style.left = `${x}px`;
  w.style.top = `${y}px`;

  document.body.appendChild(w);
  setTimeout(() => w.remove(), 2000);
}, 12000); // every ~12s




});
