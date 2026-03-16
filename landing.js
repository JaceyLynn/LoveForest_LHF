// Landing Page - Card Click Animation
// Opens clicked card as a modal overlay in center of screen

document.addEventListener('DOMContentLoaded', function() {
    const card1 = document.querySelector('.card1');
    const card2 = document.querySelector('.card2');
    const card3 = document.querySelector('.card3');
    const cardsContainer = document.querySelector('.cards-container');
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    cardsContainer.appendChild(overlay);
    
    // Currently expanded card
    let expandedCard = null;
    
    // Store original position
    let originalRect = null;
    
    // Function to expand a card
    function expandCard(card) {
        if (expandedCard === card) return;
        
        // Close any previously expanded card
        if (expandedCard) {
            closeCard();
        }
        
        // Get current position before changing anything
        const rect = card.getBoundingClientRect();
        
        // Store original position for closing animation
        originalRect = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        };
        
        // Set card to fixed position at its current screen location
        card.style.position = 'fixed';
        card.style.top = rect.top + 'px';
        card.style.left = rect.left + 'px';
        card.style.width = rect.width + 'px';
        card.style.height = rect.height + 'px';
        card.style.transform = 'none';
        
        expandedCard = card;
        overlay.classList.add('active');
        
        // Force reflow to ensure the starting position is applied
        card.offsetHeight;
        
        // Now animate to the expanded state
        requestAnimationFrame(() => {
            card.classList.add('expanded');
        });
    }
    
    // Function to close expanded card
    function closeCard() {
        if (expandedCard && originalRect) {
            const card = expandedCard;
            
            // Get current expanded position
            const expandedRect = card.getBoundingClientRect();
            
            // Set inline styles to current expanded position BEFORE removing class
            card.style.position = 'fixed';
            card.style.top = expandedRect.top + 'px';
            card.style.left = expandedRect.left + 'px';
            card.style.width = expandedRect.width + 'px';
            card.style.height = expandedRect.height + 'px';
            card.style.transform = 'none';
            card.style.zIndex = '100';
            
            // Remove expanded class
            card.classList.remove('expanded');
            
            // Force reflow
            card.offsetHeight;
            
            // Animate to original position
            requestAnimationFrame(() => {
                card.style.top = originalRect.top + 'px';
                card.style.left = originalRect.left + 'px';
                card.style.width = originalRect.width + 'px';
                card.style.height = originalRect.height + 'px';
            });
            
            // Reset inline styles after transition completes
            setTimeout(() => {
                card.style.position = '';
                card.style.top = '';
                card.style.left = '';
                card.style.width = '';
                card.style.height = '';
                card.style.transform = '';
                card.style.zIndex = '';
            }, 500); // Match transition duration
            
            expandedCard = null;
            originalRect = null;
        }
        overlay.classList.remove('active');
    }
    
    // Click on cards to expand
    card1.addEventListener('click', function(e) {
        e.stopPropagation();
        expandCard(card1);
    });
    
    card2.addEventListener('click', function(e) {
        e.stopPropagation();
        expandCard(card2);
    });
    
    card3.addEventListener('click', function(e) {
        e.stopPropagation();
        expandCard(card3);
    });
    
    // Click on overlay to close
    overlay.addEventListener('click', function() {
        closeCard();
    });
    
    // Press Escape to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCard();
        }
    });
});