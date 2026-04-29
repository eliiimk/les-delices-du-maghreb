document.addEventListener("DOMContentLoaded", () => {
    // Adds a very subtle 3D hover effect to the content inside the panels
    const panels = document.querySelectorAll('.split-panel');

    panels.forEach(panel => {
        const content = panel.querySelector('.panel-content');
        
        panel.addEventListener('mousemove', (e) => {
            // Only apply effect on larger screens to avoid issues on mobile
            if (window.innerWidth <= 768) return;

            const rect = panel.getBoundingClientRect();
            // Calculate cursor position relative to the center of the panel
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // subtle translations
            const moveX = x * 0.04;
            const moveY = y * 0.04;

            content.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });

        panel.addEventListener('mouseleave', () => {
            if (window.innerWidth <= 768) return;
            
            // Revert back smoothly
            content.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            content.style.transform = `translate(0px, 0px)`;
            
            // Remove transition after it finished so it doesn't lag mousemove
            setTimeout(() => {
                content.style.transition = ''; 
            }, 600);
        });
        
        panel.addEventListener('mouseenter', () => {
            if (window.innerWidth <= 768) return;
            // Short transition for entering
            content.style.transition = 'transform 0.1s linear';
        });
    });
});
