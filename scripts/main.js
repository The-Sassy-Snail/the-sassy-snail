document.addEventListener('DOMContentLoaded', () => {
  const postFeed = document.getElementById('post-feed');
  const tags = document.querySelectorAll('.tag');

  // Load posts from JSON
  fetch('content/posts.json')
    .then(response => response.json())
    .then(posts => {
      displayPosts(posts);

      // Tag filtering
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
    });

  // Function to display posts
  function displayPosts(posts) {
    postFeed.innerHTML = ''; // clear existing posts

    posts.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'post';
      postEl.innerHTML = `
        <img src="${post.image}" alt="${post.title}" />
        <p class="date">${post.date}</p>
        <p class="title">${post.title}</p>
      `;
      postFeed.appendChild(postEl);
    });
  }
});
