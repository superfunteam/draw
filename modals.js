// modals.js

// Store all initialized modal instances to handle global events like Escape key
const initializedModals = [];

/**
 * Initializes a modal with open/close functionality and animations.
 * @param {string} modalId - The ID of the main modal container element.
 * @param {string} openTriggerSelector - A CSS selector for the element(s) that should open this modal.
 * @param {object} [options={}] - Optional configuration for animations.
 */
function initializeModal(modalId, openTriggerSelector, options = {}) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.error(`Modal with ID ${modalId} not found.`);
        return null;
    }

    const backdropElement = modalElement.querySelector('.modal-backdrop');
    const panelElement = modalElement.querySelector('.modal-panel');
    const closeButtons = modalElement.querySelectorAll('[data-modal-action="close"]');

    if (!backdropElement || !panelElement) {
        console.error(`Modal ${modalId} is missing required .modal-backdrop or .modal-panel child elements.`);
        return null;
    }

    // Define animation classes based on options or defaults (Tailwind specific)
    // These assume Tailwind JIT is active or these specific utility combinations are generated.
    const enterDuration = options.enterDuration || 'duration-300';
    const leaveDuration = options.leaveDuration || 'duration-200';
    const easeOut = options.easeOut || 'ease-out';
    const easeIn = options.easeIn || 'ease-in';

    // Initial "from" states (should match what's in the HTML for the hidden modal)
    const backdropInitialClasses = ['opacity-0'];
    const panelInitialClasses = ['opacity-0', 'translate-y-12', 'sm:translate-y-12', 'sm:scale-95']; // Example values

    // Target "to" states for opening
    const backdropOpenTargetClasses = ['opacity-100'];
    const panelOpenTargetClasses = ['opacity-100', 'translate-y-0', 'sm:scale-100'];


    function openModal() {
        modalElement.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // --- Backdrop Enter ---
        // Remove any "leave" transition classes and ensure "from" state
        backdropElement.classList.remove(...backdropInitialClasses, easeIn, leaveDuration);
        backdropElement.classList.add(...backdropInitialClasses); // Ensure it's starting from hidden

        // Add "enter" transition classes and trigger reflow for animation
        backdropElement.classList.add(easeOut, enterDuration);
        requestAnimationFrame(() => {
            backdropElement.classList.remove(...backdropInitialClasses);
            backdropElement.classList.add(...backdropOpenTargetClasses);
        });

        // --- Panel Enter ---
        // Remove any "leave" transition classes and ensure "from" state
        panelElement.classList.remove(...panelOpenTargetClasses, easeIn, leaveDuration);
        panelElement.classList.add(...panelInitialClasses);

        // Add "enter" transition classes and trigger reflow for animation
        panelElement.classList.add(easeOut, enterDuration);
        requestAnimationFrame(() => {
            panelElement.classList.remove(...panelInitialClasses);
            panelElement.classList.add(...panelOpenTargetClasses);
        });
        
        // Clean up enter transition classes after animation
        setTimeout(() => {
            backdropElement.classList.remove(easeOut, enterDuration);
            panelElement.classList.remove(easeOut, enterDuration);
        }, parseInt(enterDuration.replace('duration-', '')));
    }

    function closeModal() {
        document.body.style.overflow = ''; // Restore background scrolling

        // --- Backdrop Leave ---
        backdropElement.classList.remove(...backdropOpenTargetClasses, easeOut, enterDuration); // Remove "to" state
        backdropElement.classList.add(easeIn, leaveDuration); // Add "leave" transition
        backdropElement.classList.add(...backdropInitialClasses); // Animate to "from" state

        // --- Panel Leave ---
        panelElement.classList.remove(...panelOpenTargetClasses, easeOut, enterDuration); // Remove "to" state
        panelElement.classList.add(easeIn, leaveDuration); // Add "leave" transition
        panelElement.classList.add(...panelInitialClasses); // Animate to "from" state
        
        setTimeout(() => {
            modalElement.classList.add('hidden');
            // Clean up leave transition classes
            backdropElement.classList.remove(easeIn, leaveDuration);
            panelElement.classList.remove(easeIn, leaveDuration);
            // Ensure elements are reset to their initial state (redundant if classes are correct but safe)
            backdropElement.classList.add(...backdropInitialClasses);
            panelElement.classList.add(...panelInitialClasses);
            panelElement.classList.remove(...panelOpenTargetClasses);


        }, parseInt(leaveDuration.replace('duration-', '')));
    }

    // Attach open trigger(s)
    const openTriggerElements = document.querySelectorAll(openTriggerSelector);
    if (openTriggerElements.length > 0) {
        openTriggerElements.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        });
    } else {
        console.warn(`No open trigger(s) found with selector "${openTriggerSelector}" for modal "${modalId}".`);
    }

    // Attach close triggers for buttons with data-modal-action="close"
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Attach close trigger for backdrop click
    backdropElement.addEventListener('click', closeModal);
    
    const modalInstance = { id: modalId, open: openModal, close: closeModal, element: modalElement };
    initializedModals.push(modalInstance);
    return modalInstance;
}

// Global Escape key listener for all initialized modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Find the topmost (last opened and still visible) modal
        for (let i = initializedModals.length - 1; i >= 0; i--) {
            const modal = initializedModals[i];
            if (!modal.element.classList.contains('hidden')) {
                modal.close();
                return; // Close only one modal per Escape press
            }
        }
        // Fallback for lightbox if no generic modals were open and handled
        const lightboxModal = document.getElementById('lightbox-modal');
        if (lightboxModal && !lightboxModal.classList.contains('hidden') && typeof closeLightbox === 'function') {
            closeLightbox();
        }
    }
}); 