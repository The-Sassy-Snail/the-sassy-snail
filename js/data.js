// Default routine template. Users can edit this from within the app (Settings);
// their edited copy is what actually gets stored in Firestore. This file only
// seeds a brand new account.

export const RUN_DAYS = [0, 2, 4]; // Sunday, Tuesday, Thursday (JS getDay())

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function item(label, starred = false) {
  return { id: slugify(label), label, starred };
}

function section(id, emoji, title, condition, items, note) {
  return { id, emoji, title, condition, note: note || null, items };
}

// condition: 'always' | 'notRunday' | 'runday' | 'tomorrowRunday' | 'sunday'

export function defaultTemplate() {
  return {
    sections: [
      section('wake', '☀️', 'Wake up', 'always', [
        item('Wake up'),
        item('Turn off alarm'),
        item('Open curtains/blinds'),
        item('Drink water'),
        item('Bathroom'),
        item('Make bed', true),
        item('Brush teeth', true),
        item('Skincare', true),
        item('Hair care', true),
        item('Get dressed'),
        item('Deodorant'),
        item('Fragrance'),
        item('Jewelry/accessories'),
        item('Medication/supplements, if applicable'),
      ]),
      section('dog-morning', '🐕', 'Dog', 'always', [
        item('Morning dog walk', true),
        item('Feed dog'),
        item('Refresh water'),
        item('Quick paws/coat check if needed'),
      ]),
      section('breakfast-prep', '🍳', 'Breakfast & work prep', 'always', [
        item('Breakfast'),
        item('Coffee/tea'),
        item('Pack lunch'),
        item('Pack snacks'),
        item('Fill water bottle'),
        item('Pack work bag'),
        item('Check keys'),
        item('Check wallet'),
        item('Check phone'),
        item('Check anything needed for the day'),
        item('Check weather'),
        item('Check calendar/schedule'),
      ]),
      section('morning-extras', '🧘', 'Optional morning extras', 'always', [
        item('Stretching'),
        item('Mobility'),
        item('Meditation'),
        item('Journaling'),
        item('Read'),
        item('Music'),
        item('Podcast'),
        item('Sit and enjoy coffee'),
        item('Write 3 priorities for the day'),
        item('Quick bedroom tidy'),
      ]),
      section('before-leaving', '🚪', 'Before leaving', 'always', [
        item('Final bathroom check'),
        item('Shoes/coat'),
        item('Dog has everything they need'),
        item('Lights/appliances checked'),
        item('Keys/phone/wallet'),
        item('Leave by 7:30 AM', true),
      ]),

      section('home-reset', '🏠', 'Home reset', 'notRunday', [
        item('Dishes', true),
        item('Load/unload dishwasher'),
        item('Wipe kitchen counters'),
        item('Quick kitchen reset'),
        item('Put things back where they belong'),
        item('Put laundry away'),
        item('Take rubbish out if needed'),
        item('5–10 minute general tidy'),
        item('Quick living-room reset'),
        item('Prepare anything needed for tomorrow'),
      ]),
      section('dog-evening', '🐕', 'Dog care', 'notRunday', [
        item('Evening dog walk'),
        item('Feed dog'),
        item('Refresh water'),
        item("Brush dog's teeth", true),
        item("Brush dog's coat", true),
        item('Check paws'),
        item('Quick coat/skin check'),
        item('Refill treats'),
        item('Refill poop bags'),
        item('Prep anything dog-related needed for tomorrow'),
      ]),
      section('tomorrow-prep', '👗', 'Tomorrow prep', 'notRunday', [
        item("Prepare tomorrow's clothes", true),
        item('Prepare underwear'),
        item('Prepare socks'),
        item('Prepare shoes'),
        item('Pack work bag'),
        item('Prepare lunch'),
        item('Prepare snacks'),
        item('Fill water bottle'),
        item('Put keys/wallet somewhere visible'),
        item("Check tomorrow's schedule"),
        item('Check weather'),
        item('Set alarms', true),
        item('Charge phone'),
        item('Charge watch'),
        item('Charge headphones'),
        item('Put anything needed tomorrow somewhere visible'),
      ]),
      section(
        'tomorrow-run-prep',
        '🏃',
        'If tomorrow is a run day',
        'tomorrowRunday',
        [
          item('Put out running clothes', true),
          item('Put out running socks'),
          item('Put running shoes somewhere ready'),
          item('Put headphones somewhere ready'),
          item('Prepare any running accessories'),
          item('Check running route/workout if relevant'),
        ],
        "So you're not waking up thinking “oh god, I have to run today.” You're waking up to: my running clothes are already there. Cool."
      ),
      section('evening-personal-care', '🧴', 'Evening personal care', 'notRunday', [
        item('Shower'),
        item('Brush teeth'),
        item('Floss'),
        item('Skincare', true),
        item('Hair care', true),
        item('Body lotion'),
        item('Deodorant'),
        item('Pajamas'),
        item('Lip balm'),
        item('Other personal care'),
      ]),
      section('wind-down', '🌙', 'Wind-down', 'notRunday', [
        item('Dim lights'),
        item('Reduce screens'),
        item('Put phone on charge'),
        item('Read'),
        item('Journal'),
        item('Brain dump'),
        item('Review tomorrow'),
        item("Write tomorrow's priorities"),
        item('Gentle stretching'),
        item('Meditation/breathing'),
        item('Relax with boyfriend'),
        item('Watch something'),
        item('Get into bed'),
        item('Sleep'),
      ]),

      section('run-before', '🏃', 'Before the run', 'runday', [
        item('Put on running clothes'),
        item('Bathroom'),
        item('Water'),
        item('Snack if needed'),
        item('Running shoes'),
        item('Headphones'),
        item('Any running accessories'),
        item('Run 🏃‍♀️'),
      ]),
      section(
        'run-after',
        '🏃',
        'After the run',
        'runday',
        [
          item('Cool down'),
          item('Water'),
          item('Shower'),
          item('Dinner'),
          item('Dishes'),
          item("Brush dog's teeth", true),
          item("Brush dog's coat", true),
          item('Skincare', true),
          item('Hair care', true),
          item('Prepare clothes', true),
          item('Pack work bag/lunch'),
          item('Set alarms', true),
          item('Brush teeth'),
          item('Minimal tidy'),
          item('Relax'),
          item('Bed'),
        ],
        "Run-night rule: minimum cleanup only. You ran, you're tired — dishes + essentials is enough."
      ),

      section('weekly-plan', '📅', 'Plan the week', 'sunday', [
        item('Check calendar'),
        item('Check work schedule'),
        item("Check boyfriend's schedule"),
        item('Identify early mornings'),
        item('Plan runs'),
        item('Plan other exercise'),
        item('Check appointments'),
        item('Check errands'),
        item('Check upcoming commitments'),
        item('Plan anything unusual for the week'),
      ]),
      section('weekly-food', '🥗', 'Food', 'sunday', [
        item('Check fridge/freezer'),
        item('Make grocery list'),
        item('Grocery shop/order'),
        item('Plan basic meals'),
        item('Prep anything that makes weekdays easier'),
        item('Prepare breakfast options'),
        item('Prepare snacks'),
      ]),
      section('weekly-laundry', '👚', 'Laundry & clothes', 'sunday', [
        item('Laundry'),
        item('Put laundry away'),
        item('Change bedding'),
        item('Change towels'),
        item('Check work clothes'),
        item('Plan a few outfits'),
        item('Check running clothes'),
      ]),
      section('weekly-home', '🏠', 'Home', 'sunday', [
        item('General tidy'),
        item('Vacuum'),
        item('Dust'),
        item('Bathroom'),
        item('Kitchen'),
        item('Take rubbish out'),
        item('Restock household supplies'),
      ]),
      section('weekly-dog', '🐕', 'Dog', 'sunday', [
        item('Check dog food'),
        item('Restock treats'),
        item('Restock poop bags'),
        item('Wash bowls'),
        item('Check grooming supplies'),
        item('Check anything needed for the week'),
      ]),
      section('weekly-personal', '🧴', 'Personal', 'sunday', [
        item('Restock toiletries'),
        item('Hair-care reset'),
        item('Longer skincare/self-care'),
        item("Anything you don't want to squeeze into weekdays"),
      ]),
    ],
  };
}

export { slugify };
