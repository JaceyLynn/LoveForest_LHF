document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            cards.forEach((item) => item.classList.remove('is-selected'));
            card.classList.add('is-selected');
        });
    });
});