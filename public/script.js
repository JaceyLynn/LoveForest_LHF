document.addEventListener('DOMContentLoaded', () => {
    const messageBox = document.getElementById('messageBox');
    const textContainer = document.getElementById('textContainer');
    const cursor = document.getElementById('cursor');
    const eraseBtn = document.getElementById('eraseBtn');
    const submitBtn = document.getElementById('submitBtn');
    const hintElement = document.querySelector('.hint');
    
    // Store letter elements
    let letters = [];
    
    // Typing rhythm tracking
    let lastKeyTime = 0;
    const MIN_DELAY = 0.1;  // seconds
    const MAX_DELAY = 1.0;  // seconds
    const DEFAULT_DELAY = 0.3;  // seconds
    const PAUSE_THRESHOLD = 10000;  // ms - if pause is longer than this, use max delay
    
    // Focus the message box on click
    messageBox.addEventListener('click', () => {
        messageBox.focus();
    });
    
    // Auto-focus on load
    messageBox.focus();
    
    // Erase all button
    eraseBtn.addEventListener('click', () => {
        eraseAll();
        messageBox.focus();
    });
    
    // Submit button
    submitBtn.addEventListener('click', () => {
        submitMessage();
    });
    
    // Submit message function
    async function submitMessage() {
        const currentText = getCurrentText();
        if (!currentText.trim()) {
            hintElement.textContent = 'Write something first...';
            return;
        }
        
        submitBtn.disabled = true;
        hintElement.textContent = 'Sending...';        
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: currentText })
            });
            
            const data = await response.json();
            if (data.success) {
                submitBtn.classList.add('success');
                hintElement.textContent = 'Message sent! Taking you to the forest...';
                
                // Redirect to showcase page after a moment
                setTimeout(() => {
                    window.location.href = '/showcase.html';
                }, 1500);
            } else {
                hintElement.textContent = 'Failed to send, try again...';
            }
        } catch (error) {
            console.error('Submit error:', error);
            hintElement.textContent = 'Failed to send, try again...';
        }
        
        submitBtn.disabled = false;
    }
    
    // Get current text content
    function getCurrentText() {
        return letters
            .filter(l => !l.isBreak)
            .map(l => l.crossedOut ? `~~${l.element.textContent}~~` : l.element.textContent)
            .join('');
    }
    
    // Handle keydown events
    messageBox.addEventListener('keydown', (e) => {
        // Handle backspace - draw squiggle instead of deleting
        if (e.key === 'Backspace') {
            e.preventDefault();
            crossOutLastLetter();
            return;
        }
        
        // Handle Enter key
        if (e.key === 'Enter') {
            e.preventDefault();
            addLineBreak();
            return;
        }
        
        // Handle Tab, Escape, and other control keys - ignore them
        if (e.key === 'Tab' || e.key === 'Escape' || e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
        
        // Handle regular character input (single character keys)
        if (e.key.length === 1) {
            e.preventDefault();
            addLetter(e.key);
        }
    });
    
    function addLetter(char) {
        const now = Date.now();
        const timeSinceLastKey = now - lastKeyTime;
        lastKeyTime = now;
        
        // Calculate delay based on typing rhythm
        let delay;
        if (timeSinceLastKey === now) {
            // First keystroke
            delay = DEFAULT_DELAY;
        } else if (timeSinceLastKey >= PAUSE_THRESHOLD) {
            // Long pause - use max delay
            delay = MAX_DELAY;
        } else {
            // Map the time since last key to a delay
            // Shorter gaps = shorter delay, longer gaps = longer delay
            const ratio = Math.min(timeSinceLastKey / PAUSE_THRESHOLD, 1);
            delay = MIN_DELAY + (MAX_DELAY - MIN_DELAY) * ratio;
        }
        
        console.log(`Delay: ${delay.toFixed(3)}s | Time since last key: ${timeSinceLastKey}ms`);
        
        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.style.opacity = '0';
        letterSpan.style.transition = `opacity ${delay}s ease-in`;
        
        if (char === ' ') {
            letterSpan.classList.add('space');
            letterSpan.innerHTML = '&nbsp;';
        } else {
            letterSpan.textContent = char;
        }
        
        // Insert before cursor
        textContainer.insertBefore(letterSpan, cursor);
        
        // Force a reflow to ensure opacity:0 is applied first, then transition to 1
        letterSpan.offsetHeight; // This forces the browser to compute styles
        letterSpan.style.opacity = '1';
        
        letters.push({
            element: letterSpan,
            crossedOut: false
        });
    }
    
    function addLineBreak() {
        const br = document.createElement('br');
        textContainer.insertBefore(br, cursor);
        
        letters.push({
            element: br,
            crossedOut: false,
            isBreak: true
        });
    }
    
    function eraseAll() {
        // Get the message box position
        const boxRect = messageBox.getBoundingClientRect();
        
        // Create new paper overlay
        const newPaper = document.createElement('div');
        newPaper.className = 'new-paper';
        document.body.appendChild(newPaper);
        
        // Start position: top right corner of window
        const startX = window.innerWidth + 50;
        const startY = -450;
        
        // End position: over the message box
        const endX = boxRect.left;
        const endY = boxRect.top;
        
        // Set initial position
        newPaper.style.left = `${startX}px`;
        newPaper.style.top = `${startY}px`;
        newPaper.style.transition = 'left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Trigger the slide animation
        requestAnimationFrame(() => {
            newPaper.classList.add('sliding');
            newPaper.style.left = `${endX}px`;
            newPaper.style.top = `${endY}px`;
        });
        
        // After animation completes, remove letters and the overlay
        setTimeout(() => {
            // Remove all letter elements
            letters.forEach(letterData => {
                if (letterData.element && letterData.element.parentNode) {
                    letterData.element.remove();
                }
            });
            letters = [];
            
            // Remove the overlay
            newPaper.remove();
            
            // Reset hint
            hintElement.textContent = originalHint;
        }, 600);
    }
    
    function crossOutLastLetter() {
        // Find the last letter that isn't already crossed out
        for (let i = letters.length - 1; i >= 0; i--) {
            const letterData = letters[i];
            
            // Skip line breaks
            if (letterData.isBreak) {
                continue;
            }
            
            if (!letterData.crossedOut) {
                drawSquiggle(letterData.element);
                letterData.crossedOut = true;
                return;
            }
        }
    }
    
    function drawSquiggle(letterElement) {
        // Get the width of the letter
        const width = letterElement.offsetWidth || 12;
        
        // Create SVG squiggle
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'squiggle');
        svg.setAttribute('viewBox', `0 0 ${width} 24`);
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Generate two random squiggly paths
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const squigglePath1 = generateSquigglePath(width, 8);  // Upper line
        path1.setAttribute('d', squigglePath1);
        
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const squigglePath2 = generateSquigglePath(width, 16); // Lower line
        path2.setAttribute('d', squigglePath2);
        
        svg.appendChild(path1);
        svg.appendChild(path2);
        letterElement.appendChild(svg);
        
        // Add a slight random rotation for more handwritten feel
        const rotation = (Math.random() - 0.5) * 10;
        svg.style.transform = `translateY(-50%) rotate(${rotation}deg)`;
    }
    
    function generateSquigglePath(width, yCenter = 12) {
        // Create a wavy/squiggly line path
        const segments = Math.max(3, Math.floor(width / 4));
        const segmentWidth = width / segments;
        
        let path = `M 0 ${yCenter}`;
        
        for (let i = 0; i < segments; i++) {
            const x1 = i * segmentWidth + segmentWidth * 0.5;
            const x2 = (i + 1) * segmentWidth;
            
            // Alternate between going up and down with some randomness
            const yOffset = (i % 2 === 0 ? -1 : 1) * (2 + Math.random() * 3);
            const y1 = yCenter + yOffset;
            const y2 = yCenter + (Math.random() - 0.5) * 2;
            
            // Add some horizontal jitter
            const jitterX1 = x1 + (Math.random() - 0.5) * 2;
            const jitterX2 = x2 + (Math.random() - 0.5) * 1;
            
            path += ` Q ${jitterX1} ${y1}, ${jitterX2} ${y2}`;
        }
        
        return path;
    }
});
