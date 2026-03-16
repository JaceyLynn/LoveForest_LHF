// Landing Page - Card Click Animation
// Allows switching between cards with slide animations

document.addEventListener('DOMContentLoaded', function() {
    const card1 = document.querySelector('.card1');
    const card2 = document.querySelector('.card2');
    const card3 = document.querySelector('.card3');
    
    // Current active card (0 = card1, 1 = card2, 2 = card3)
    let activeCard = 0;
    
    // Click on Card 1 - show card 1, reset others
    card1.addEventListener('click', function() {
        if (activeCard !== 0) {
            activeCard = 0;
            card1.classList.remove('hidden-down');
            card2.classList.remove('hidden-left');
        }
    });
    
    // Click on Card 2 - hide card 1 down, show card 2
    card2.addEventListener('click', function() {
        if (activeCard === 0) {
            // Coming from card 1
            activeCard = 1;
            card1.classList.add('hidden-down');
        } else if (activeCard === 2) {
            // Coming from card 3
            activeCard = 1;
            card2.classList.remove('hidden-left');
        }
    });
    
    // Click on Card 3 - hide card 1 down, hide card 2 left
    card3.addEventListener('click', function() {
        if (activeCard !== 2) {
            activeCard = 2;
            card1.classList.add('hidden-down');
            card2.classList.add('hidden-left');
        }
    });
});