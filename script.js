
// --- 1. PARTICLE SYSTEM ---
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// --- 2. IMAGE PHYSICS ENGINE ("BOOM" EFFECT) ---
const images = document.querySelectorAll('.bg-float');

// Store physics properties for each image
const physicsData = [];

function initImages() {
    images.forEach((img, index) => {
        // Random Size
        const size = 120 + Math.random() * 80;
        img.style.width = size + 'px';
        img.style.height = size + 'px';

        // Initial Position (try to spread them out)
        let x = Math.random() * (window.innerWidth - size);
        let y = Math.random() * (window.innerHeight - size);

        // Initial Velocity (Speed and Direction)
        // Speed between 1 and 3 pixels per frame
        let vx = (Math.random() - 0.5) * 4; 
        let vy = (Math.random() - 0.5) * 4;

        physicsData.push({
            element: img,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            width: size,
            height: size,
            radius: size / 2
        });
    });
    
    animateImages();
}

function animateImages() {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // Update each image
    for (let i = 0; i < physicsData.length; i++) {
        let p1 = physicsData[i];

        // 1. Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // 2. Wall Collision (Bounce off screen edges)
        if (p1.x <= 0 || p1.x + p1.width >= containerW) {
            p1.vx *= -1; // Reverse X direction
            // Keep inside bounds
            if(p1.x <= 0) p1.x = 0;
            if(p1.x + p1.width >= containerW) p1.x = containerW - p1.width;
        }

        if (p1.y <= 0 || p1.y + p1.height >= containerH) {
            p1.vy *= -1; // Reverse Y direction
            // Keep inside bounds
            if(p1.y <= 0) p1.y = 0;
            if(p1.y + p1.height >= containerH) p1.y = containerH - p1.height;
        }

        // 3. Object Collision ("Boom" - Bounce off each other)
        for (let j = i + 1; j < physicsData.length; j++) {
            let p2 = physicsData[j];

            // Calculate center points
            let c1x = p1.x + p1.radius;
            let c1y = p1.y + p1.radius;
            let c2x = p2.x + p2.radius;
            let c2y = p2.y + p2.radius;

            // Calculate distance
            let dx = c2x - c1x;
            let dy = c2y - c1y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // If distance is smaller than sum of radii, they are touching
            if (distance < p1.radius + p2.radius) {
                // Simple Elastic Collision: Swap Velocities
                // This creates the "Boom" bounce effect
                let tempVx = p1.vx;
                let tempVy = p1.vy;
                
                p1.vx = p2.vx;
                p1.vy = p2.vy;
                
                p2.vx = tempVx;
                p2.vy = tempVy;

                // Push them apart slightly so they don't get stuck
                let overlap = (p1.radius + p2.radius) - distance;
                let angle = Math.atan2(dy, dx);
                
                p1.x -= Math.cos(angle) * (overlap / 2);
                p1.y -= Math.sin(angle) * (overlap / 2);
                p2.x += Math.cos(angle) * (overlap / 2);
                p2.y += Math.sin(angle) * (overlap / 2);
            }
        }

        // Apply new position to DOM
        p1.element.style.transform = `translate(${p1.x}px, ${p1.y}px)`;
    }

    requestAnimationFrame(animateImages);
}

// --- 3. PAGE LOGIC ---
function startCompetition() {
    document.querySelector('.intro-container').style.transition = 'opacity 0.8s';
    document.querySelector('.intro-container').style.opacity = '0';
    setTimeout(() => {
        window.location.href = '/main/main.html';
    }, 1000);
}

window.addEventListener('load', () => {
    createParticles();
    initImages();
});

// Handle resize so images don't get lost
window.addEventListener('resize', () => {
    // Re-center images if window shrinks
    physicsData.forEach(p => {
        if(p.x > window.innerWidth) p.x = window.innerWidth - p.width;
        if(p.y > window.innerHeight) p.y = window.innerHeight - p.height;
    });
});

