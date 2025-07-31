document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quiz-form');
  const resultSection = document.getElementById('quiz-result');
  const loadingLine = document.getElementById('loading-line');
  const soulTattoo = document.getElementById('soul-tattoo');
  const tattooImg = document.getElementById('tattoo-img');
  const tattooDesc = document.getElementById('tattoo-desc');
  const revealForm = document.getElementById('reveal-form');
  const contactForm = document.getElementById('contact-form');

  const loadingPhrases = [
    'Analyzing your vibe...',
    'June is looking deep into your soul...',
    'Evaluating your browser history...',
    'Looking at all your intrusive thoughts...',
    'Running background check on your childhood...',
    'Measuring chaos energy levels...',
    'Detecting cursed item compatibility...',
    'Tasting your aura through the screen...',
    'Judging you. Lovingly.',
  ];

  const tattoos = [
    {
      src: 'assets/images/tattoos/sticker-toaster-cat.png',
      desc: 'A toaster with cat ears floating in space. Because you’re breakfast and drama.'
    },
    {
      src: 'assets/images/tattoos/sticker-carebear-pipe.png',
      desc: 'A Care Bear smoking a pipe, staring into the void. You’re a contradiction with fur.'
    },
    {
      src: 'assets/images/tattoos/sticker-screaming-mushroom.png',
      desc: 'A screaming mushroom in fishnets. Screaming like you do internally.'
    },
    {
      src: 'assets/images/tattoos/sticker-snail-knife.png',
      desc: 'A snail wielding a tiny knife. You’re soft, but you bite.'
    },
    {
      src: 'assets/images/tattoos/sticker-glitchy-heart.png',
      desc: 'A glitching heart that says "buffering..." because emotional stability is loading.'
    }
  ];

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    document.getElementById('quiz-gate').classList.add('hidden');
    resultSection.classList.remove('hidden');
    soulTattoo.classList.add('hidden');

    // Simulate scanning with phrases
    let index = 0;
    const interval = setInterval(() => {
      loadingLine.textContent = loadingPhrases[index % loadingPhrases.length];
      index++;
      if (index > 5) {
        clearInterval(interval);

        // Show soul tattoo result
        const result = tattoos[Math.floor(Math.random() * tattoos.length)];
        tattooImg.src = result.src;
        tattooDesc.textContent = result.desc;

        soulTattoo.classList.remove('hidden');
      }
    }, 1200);
  });

  revealForm.addEventListener('click', () => {
    contactForm.classList.remove('hidden');
    resultSection.classList.add('hidden');
  });
});
