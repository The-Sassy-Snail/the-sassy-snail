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

// Randomly trigger glitch effect every 20-40 seconds
function triggerGlitch() {
  const glitchOverlay = document.querySelector('.glitch-overlay');
  glitchOverlay.classList.add('glitch-active');

  setTimeout(() => {
    glitchOverlay.classList.remove('glitch-active');
  }, 600); // Matches duration of CSS animation
}

// Random interval
function randomGlitchInterval() {
  const interval = Math.floor(Math.random() * (40000 - 20000 + 1)) + 20000;
  setTimeout(() => {
    triggerGlitch();
    randomGlitchInterval();
  }, interval);
}

// Start glitch effect
randomGlitchInterval();

    
});
