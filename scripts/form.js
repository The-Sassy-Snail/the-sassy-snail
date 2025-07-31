document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.weird-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // TODO: Connect to actual backend/email service
    // For now, simulate submission
    alert(`💌 Message sent!\n\nYou're now emotionally linked to June.`);

    form.reset();
  });
});
