document.addEventListener('DOMContentLoaded', () => {
  const results = [
    {
      title: "The Soft Chaos Romantic™",
      tattoo: "A goldfish on a therapist’s couch whispering, “I remember everything.”"
    },
    {
      title: "The Flaming Breadcrumb",
      tattoo: "A pair of cherries with brass knuckles and intimacy issues."
    },
    {
      title: "Emotionally Spicy but Lovable™",
      tattoo: "A gravestone that says “She Tried xoxo” with Hello Kitty graffiti."
    },
    {
      title: "The Art Goblin Supreme",
      tattoo: "A pink Care Bear chain-smoking under a “Live Laugh Lobotomy” banner."
    },
    {
      title: "The Secret Lurker™",
      tattoo: "A snail mid-breakdown, holding a knife and a love letter."
    },
    {
      title: "High-Functioning Disaster in Lip Gloss",
      tattoo: "An alien DJing your insecurities at a rave for pigeons."
    },
    {
      title: "Certified Feelings Hoarder™",
      tattoo: "A brain with a “Back in 5 mins” sign taped to it, surrounded by anime sparkles."
    },
    {
      title: "The Tender Cryptid",
      tattoo: "A full moon crying into a martini glass while reading your old texts."
    },
    {
      title: "Main Character in Someone Else’s Breakdown",
      tattoo: "A VHS tape labeled “DON’T WATCH” with lipstick marks and teeth prints."
    },
    {
      title: "Unstable but Fashionable™",
      tattoo: "A pig in fishnets holding a “Legalize Chaos” protest sign."
    },
    {
      title: "Emotional Raccoon in a Ball Gown",
      tattoo: "A disco ball with trust issues and tiny fangs."
    },
    {
      title: "Just Happy to Be Here (but armed)",
      tattoo: "A juice box with a knife and a sticker that says “not emotionally refundable.”"
    },
    {
      title: "Soft Baddie in Recovery™",
      tattoo: "A burning heart texting “u up?” to no one."
    },
    {
      title: "Witchy Bitch with WiFi",
      tattoo: "A crystal ball buffering forever while screaming in lowercase."
    }
  ];

  const random = results[Math.floor(Math.random() * results.length)];

  // Fake glitch delay
  const resultContainer = document.getElementById('result');
  const loader = document.getElementById('loader');

  setTimeout(() => {
    loader.style.display = 'none';
    resultContainer.innerHTML = `
      <h2>✨ Personality Analysis Complete ✨</h2>
      <p class="result-title">🧠 You are: <strong>${random.title}</strong></p>
      <p class="result-tattoo">💉 Tattoo this on your soul:<br><em>"${random.tattoo}"</em></p>
      <p class="tiny">*This was determined using a deeply flawed yet spiritually correct method.</p>
    `;
  }, 2500);
});
