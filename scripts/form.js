document.addEventListener('DOMContentLoaded', () => {
  const quizForm = document.getElementById('quiz-form');
  const resultSection = document.querySelector('.result-section');
  const quizContainer = document.querySelector('.quiz-container');
  const soulTattooOutput = document.getElementById('soul-tattoo');
  const soulTattooDesc = document.getElementById('tattoo-description');
  const startForm = document.getElementById('start-form');

  const tattoos = [
    {
      name: 'A toaster with cat ears floating in space',
      desc: "Because you're breakfast and drama."
    },
    {
      name: 'A pink Care Bear eating a TV remote',
      desc: "Controlling the vibe from your soul."
    },
    {
      name: 'An opossum reading a romance novel',
      desc: "Trashy. Tender. Secretly emotional."
    },
    {
      name: 'A dancing mushroom with a tiny knife',
      desc: "Stabby, but cute."
    },
    {
      name: 'A snail wearing fishnets and smoking a bubble pipe',
      desc: "You. Are. The. Moment."
    },
    {
      name: 'A frog in space yelling at the void',
      desc: "Existential chic."
    },
    {
      name: 'A haunted croissant',
      desc: "You flake. In French."
    },
    {
      name: 'A glittery eyeball crying confetti',
      desc: "It hurts, but make it sparkle."
    },
    {
      name: 'A plush duck on fire riding a skateboard',
      desc: "Chaotic. Feathered. Fast."
    }
  ];

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ✅ We keep this for the quiz (not the contact form)

    quizContainer.style.display = 'none';
    resultSection.style.display = 'block';

    const loadingText = document.getElementById('loading-text');
    const resultArea = document.querySelector('.result-output');

    const loadingMessages = [
      "Analyzing your vibe...",
      "June is looking deep in your soul...",
      "Sheesh... what did you EAT?",
      "Reviewing your browser history 👀",
      "Looking at all your intrusive thoughts...",
      "Analyzing your guilty pleasures...",
      "Asking the snails what they think...",
      "Judging your aura in Comic Sans...",
      "Running chaotic compatibility matrix...",
      "Checking your vibes against the moon cycles..."
    ];

    // Shuffle for randomness
    const shuffledMessages = loadingMessages
      .map(msg => ({ msg, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ msg }) => msg);

    let index = 0;
    resultArea.style.display = 'none';

    const interval = setInterval(() => {
      loadingText.textContent = shuffledMessages[index % shuffledMessages.length];
      index++;
    }, 1400);

    setTimeout(() => {
      clearInterval(interval);
      loadingText.style.display = 'none';
      resultArea.style.display = 'block';

      const tattoo = tattoos[Math.floor(Math.random() * tattoos.length)];
      soulTattooOutput.textContent = tattoo.name;
      soulTattooDesc.textContent = tattoo.desc;

      // Reveal the contact form
      startForm.style.display = 'block';
    }, 4600);
  });

// Handle the contact form submission (let Formspree do its thing)
const contactForm = document.querySelector('.weird-form');

if (contactForm) {
  contactForm.addEventListener('submit', () => {
    // No preventDefault here!
    // Let Formspree handle the submission and redirect
  });
}


});
