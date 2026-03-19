document.addEventListener('DOMContentLoaded', async () => {
    const forestContainer = document.getElementById('forestContainer');
    
    // Configuration
    const COLUMNS = 20;
    const ROWS = 14;
    const ROW_OFFSET = 2; // Skip first 2 rows of images (start from row 3)
    const CARDS_PER_TREE = COLUMNS * ROWS; // 280 cards per tree
    
    // Load messages from MongoDB via API
    let messages = [];
    try {
        const response = await fetch('/api/messages');
        messages = await response.json();
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
    
    // Calculate how many trees we need
    const numTrees = Math.max(1, Math.ceil(messages.length / CARDS_PER_TREE));
    
    // Create trees
    for (let treeNum = 1; treeNum <= numTrees; treeNum++) {
        const tree = createTree(treeNum, messages, COLUMNS, ROWS);
        forestContainer.appendChild(tree);
    }
    
    // Create overlay for expanded cards
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.id = 'cardOverlay';
    document.body.appendChild(overlay);
    
    // Close overlay when clicking on background
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeExpandedCard();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeExpandedCard();
        }
    });
});

// Helper function to check if a card should be hidden
function shouldBeHidden(imageRow, gridCol) {
    return (
        // row 3-4 columns 1-5
        ((imageRow === 3 || imageRow === 4) && gridCol >= 1 && gridCol <= 5) ||
        // row 5 column 2-5
        (imageRow === 5 && gridCol >= 2 && gridCol <= 5) ||
        // row 6-8 column 4
        (imageRow >= 6 && imageRow <= 8 && gridCol === 4) ||
        // row 3-10 column 10
        (imageRow >= 3 && imageRow <= 10 && gridCol === 10) ||
        // row 3-4 column 11-18
        ((imageRow === 3 || imageRow === 4) && gridCol >= 11 && gridCol <= 18) ||
        // row 5-11 column 16
        (imageRow >= 5 && imageRow <= 11 && gridCol === 16) ||
        // row 3 column 9
        (imageRow === 3 && gridCol === 9) ||
        // row 5 column 13-15
        (imageRow === 5 && gridCol >= 13 && gridCol <= 15) ||
        // row 6-8 column 15
        (imageRow >= 6 && imageRow <= 8 && gridCol === 15) ||
        // row 3 column 19-20
        (imageRow === 3 && gridCol >= 19 && gridCol <= 20) ||
        // row 4 column 20
        (imageRow === 4 && gridCol === 20) ||
        // row 5 column 17-18
        (imageRow === 5 && gridCol >= 17 && gridCol <= 18) ||
        // row 5 column 11
        (imageRow === 5 && gridCol === 11) ||
        // row 6 column 17
        (imageRow === 6 && gridCol === 17)
    );
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createTree(treeNum, messages, columns, rows) {
    const tree = document.createElement('div');
    tree.className = 'tree';
    tree.id = `tree-${treeNum}`;
    
    // First, collect all valid (non-hidden) card positions
    const validPositions = [];
    for (let gridRow = 1; gridRow <= rows; gridRow++) {
        for (let gridCol = 1; gridCol <= columns; gridCol++) {
            const imageRow = gridRow + 2;
            if (!shouldBeHidden(imageRow, gridCol)) {
                validPositions.push({ gridRow, gridCol, imageRow });
            }
        }
    }
    
    // Shuffle valid positions and assign messages randomly
    const shuffledPositions = shuffleArray(validPositions);
    const messageMap = new Map();
    
    // Assign messages to random positions (up to the number of messages available)
    const messagesToAssign = messages.slice(0, shuffledPositions.length);
    messagesToAssign.forEach((message, index) => {
        const pos = shuffledPositions[index];
        const key = `${pos.gridRow}-${pos.gridCol}`;
        messageMap.set(key, message);
    });
    
    // Create all card slots for the grid
    for (let gridRow = 1; gridRow <= rows; gridRow++) {
        for (let gridCol = 1; gridCol <= columns; gridCol++) {
            const imageRow = gridRow + 2;
            const isHidden = shouldBeHidden(imageRow, gridCol);
            
            // Get message from the random assignment map
            const key = `${gridRow}-${gridCol}`;
            const message = isHidden ? null : (messageMap.get(key) || null);
            
            // Create the flip card
            const card = createFlipCard(treeNum, imageRow, gridCol, message, isHidden);
            
            // Hide specific cells
            if (isHidden) {
                card.style.visibility = 'hidden';
            }
            
            // Set grid position
            card.style.gridRow = gridRow;
            card.style.gridColumn = gridCol;
            
            tree.appendChild(card);
        }
    }
    
    return tree;
}

function createFlipCard(treeNum, row, col, message, isHidden) {
    const card = document.createElement('div');
    card.className = 'flip-card';
    
    // Set opacity based on whether card has a message
    if (!message && !isHidden) {
        card.classList.add('empty');
        card.style.opacity = '0.2';
    } else if (message) {
        card.style.opacity = '1';
    }
    
    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';
    
    // Front side - image
    const front = document.createElement('div');
    front.className = 'flip-card-front';
    const img = document.createElement('img');
    img.src = `Tree_Images/Tree_Cutouts_2/row-${row}-column-${col}.webp`;
    img.alt = `Tree ${treeNum} - Row ${row} Column ${col}`;
    img.onerror = () => {
        // If webp doesn't exist, try png
        img.src = `Tree_Images/Tree_Cutouts_2/row-${row}-column-${col}.png`;
        img.onerror = () => {
            // If still no image, try jpg
            img.src = `Tree_Images/Tree_Cutouts_2/row-${row}-column-${col}.jpg`;
            img.onerror = () => {
                // If still no image, hide
                img.style.display = 'none';
            };
        };
    };
    front.appendChild(img);
    
    // Back side - message
    const back = document.createElement('div');
    back.className = 'flip-card-back';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (message) {
        // Parse strikethrough text (~~text~~) and convert to styled spans
        content.innerHTML = parseStrikethrough(message.content);
    } else {
        content.textContent = 'Waiting for your message...';
    }
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    if (message) {
        meta.textContent = `#${message.userIndex} · ${message.timeTag}`;
    }
    
    back.appendChild(content);
    back.appendChild(meta);
    
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    
    // Click to flip card and open overlay
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
        // Mark as colored after first flip
        if (!card.classList.contains('colored')) {
            card.classList.add('colored');
        }
        // Always auto-flip back to front image when opening overlay
        setTimeout(() => {
            card.classList.remove('flipped');
        }, 0);
        openExpandedCard(treeNum, row, col, message);
    });
    
    return card;
}

function openExpandedCard(treeNum, row, col, message) {
    const overlay = document.getElementById('cardOverlay');
    
    // Clear any existing expanded card
    overlay.innerHTML = '';
    
    // Create expanded card
    const expandedCard = document.createElement('div');
    expandedCard.className = 'expanded-card';

    // Store reference to the original card for auto-unflip
    expandedCard.dataset.treeNum = treeNum;
    expandedCard.dataset.row = row;
    expandedCard.dataset.col = col;
    
    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';
    
    // Front side - image
    const front = document.createElement('div');
    front.className = 'flip-card-front';
    const img = document.createElement('img');
    img.src = `Tree_Images/Tree_Cutouts_2/row-${row}-column-${col}.webp`;
    img.alt = `Tree ${treeNum} - Row ${row} Column ${col}`;
    front.appendChild(img);
    
    // Back side - message
    const back = document.createElement('div');
    back.className = 'flip-card-back';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (message) {
        content.innerHTML = parseStrikethrough(message.content);
    } else {
        content.textContent = 'No message yet...';
    }
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    if (message) {
        meta.textContent = `#${message.userIndex} · ${message.timeTag}`;
    }
    
    back.appendChild(content);
    back.appendChild(meta);
    
    inner.appendChild(front);
    inner.appendChild(back);
    expandedCard.appendChild(inner);
    
    // Click expanded card to flip it
    expandedCard.addEventListener('click', (e) => {
        e.stopPropagation();
        expandedCard.classList.toggle('flipped');
    });
    
    overlay.appendChild(expandedCard);
    
    // Activate overlay and flip after a short delay
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        // Auto-flip to show message after expand animation
        setTimeout(() => {
            expandedCard.classList.add('flipped');
        }, 400);
    });
}

function closeExpandedCard() {
    const overlay = document.getElementById('cardOverlay');
    const expandedCard = overlay.querySelector('.expanded-card');

    // Remove flipped from expanded card (for animation)
    if (expandedCard) {
        expandedCard.classList.remove('flipped');
    }

    // Also auto-unflip the original card
    if (expandedCard && expandedCard.dataset.treeNum && expandedCard.dataset.row && expandedCard.dataset.col) {
        const treeNum = expandedCard.dataset.treeNum;
        const row = expandedCard.dataset.row;
        const col = expandedCard.dataset.col;
        const card = document.querySelector(`#tree-${treeNum} .flip-card[style*='row: ${parseInt(row)-2};'][style*='column: ${col};']`);
        if (card && card.classList.contains('flipped')) {
            card.classList.remove('flipped');
        }
    }

    overlay.classList.remove('active');

    // Clear after animation
    setTimeout(() => {
        overlay.innerHTML = '';
    }, 400);
}

function parseStrikethrough(text) {
    // Replace ~~text~~ with <span class="strikethrough">text</span>
    return text.replace(/~~([^~]+)~~/g, '<span class="strikethrough">$1</span>');
}
