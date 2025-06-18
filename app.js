// Auth state management
let currentUser = null;

// Load auth state from localStorage
function loadAuthState() {
    const stored = localStorage.getItem('superfun_auth');
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
            updateAuthUI();
        } catch (e) {
            localStorage.removeItem('superfun_auth');
        }
    }
}

// Save auth state to localStorage
function saveAuthState(user) {
    currentUser = user;
    localStorage.setItem('superfun_auth', JSON.stringify(user));
    updateAuthUI();
}

// Clear auth state
function clearAuthState() {
    currentUser = null;
    localStorage.removeItem('superfun_auth');
    updateAuthUI();
}

// Format large numbers (e.g., 1,250,000 -> "1.25m", 354,000 -> "354k")
// FRONTEND DISPLAY ONLY - Database always stores/uses real integers
function formatTokenCount(tokens) {
    if (tokens >= 1000000) {
        const millions = tokens / 1000000;
        // Always show 2 decimals for millions (e.g., 1.37m, 2.00m)
        return `${millions.toFixed(2)}m`;
    } else if (tokens >= 1000) {
        const thousands = tokens / 1000;
        return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1).replace(/\.?0+$/, '')}k`;
    } else {
        return tokens.toString();
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const tokenContainers = document.querySelectorAll('.tokens');
    
    tokenContainers.forEach(container => {
        const buyBtn = container.querySelector('.token-buy-btn');
        const authBtn = container.querySelector('.token-auth-btn');
        
        if (currentUser && currentUser.tokens !== undefined) {
            // User is logged in - show formatted token count with icon in auth button
            const formattedTokens = formatTokenCount(currentUser.tokens);
            authBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                    <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
                    <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
                    <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
                    <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
                </svg>
                ${formattedTokens}
            `;
            authBtn.onclick = () => {
                alert(`You have ${currentUser.tokens.toLocaleString()} tokens remaining.`);
            };
            
            // Update buy button text to "Buy" when logged in with icon
            buyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                    <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
                    <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
                    <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
                    <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
                </svg>
                Buy
            `;
        } else {
            // User not logged in - show login button with icon and "Buy Tokens" text for buy button
            authBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                    <path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" />
                </svg>
                Login
            `;
            authBtn.onclick = () => {
                showModal('login-modal');
            };
            
            // Update buy button text to "Buy Tokens" when logged out with icon
            buyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                    <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
                    <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
                    <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
                    <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
                </svg>
                Buy Tokens
            `;
        }
        
        // Buy button always opens the tokens modal
        buyBtn.onclick = () => {
            showModal('tokens-modal');
        };
    });
}

// Check for auth code in URL on page load
function checkUrlAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('auth');
    
    if (authCode) {
        // Remove auth code from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Auto-login directly without showing auth code modal
        setTimeout(() => {
            loginWithAuthCode(authCode);
        }, 500); // Small delay to ensure DOM is ready
    }
}

// Login with auth code
async function loginWithAuthCode(authCode) {
    try {
        const response = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authCode })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            saveAuthState(data.user);
            
            // Refresh token balance from database to ensure sync (especially for database logins)
            if (data.user.email && !data.user.email.includes('example.com')) {
                // Only refresh for real users (not fallback/test users)
                setTimeout(() => refreshTokensFromDB(), 1000);
                // Start periodic token validation
                setTimeout(() => startTokenValidation(), 2000);
            }
            
            // Show welcome modal instead of alert
            showWelcomeModal(data.user.tokens);
        } else {
            // Show error in auth code modal if it's open, otherwise alert for now
            const authModal = document.getElementById('auth-code-modal');
            if (authModal && !authModal.classList.contains('hidden')) {
                // TODO: Add error display in auth code modal
                alert(data.error || 'Invalid or expired login code');
            } else {
                alert(data.error || 'Invalid or expired login code');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Failed to log in. Please try again.');
    }
}

// Check if user has sufficient tokens, show modal if not
function checkTokensBeforeDraw() {
    if (!currentUser) {
        // Not logged in, show buy tokens modal
        showModal('tokens-modal');
        return false;
    }
    
    if (currentUser.tokens <= 0) {
        // No tokens left, show buy tokens modal
        showModal('tokens-modal');
        return false;
    }
    
    return true;
}

// Refresh token balance from database to ensure sync
async function refreshTokensFromDB() {
    if (!currentUser || !currentUser.email) {
        console.log('No user logged in, cannot refresh tokens');
        return false;
    }
    
    try {
        console.log('Refreshing token balance from database...');
        const response = await fetch('/.netlify/functions/get-user-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            const previousTokens = currentUser.tokens;
            currentUser.tokens = data.tokens;
            saveAuthState(currentUser);
            
            if (previousTokens !== data.tokens) {
                console.log(`Token balance synced: ${previousTokens} -> ${data.tokens}`);
            }
            return true;
        } else {
            console.error('Failed to refresh token balance:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Error refreshing tokens:', error);
        return false;
    }
}

// Deduct tokens after successful API call
async function deductTokens(tokensUsed) {
    if (!currentUser || !currentUser.email) {
        return false;
    }
    
    try {
        const response = await fetch('/.netlify/functions/deduct-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                tokensUsed
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Update local state and UI
            currentUser.tokens = data.newBalance;
            saveAuthState(currentUser); // This calls updateAuthUI() already
            
            console.log(`Deducted ${tokensUsed} tokens. New balance: ${data.newBalance}`);
            return true;
        } else {
            console.error('Failed to deduct tokens:', data.error);
            // Refresh tokens from database if deduction failed (may be stale data)
            setTimeout(() => refreshTokensFromDB(), 500);
            return false;
        }
    } catch (error) {
        console.error('Token deduction error:', error);
        // Refresh tokens from database if network error (may be out of sync)
        setTimeout(() => refreshTokensFromDB(), 500);
        return false;
    }
}

// Validate token sync periodically (every 30 seconds)
function startTokenValidation() {
    if (!currentUser || !currentUser.email || currentUser.email.includes('example.com')) {
        return; // Skip validation for test users
    }
    
    setInterval(async () => {
        if (currentUser && currentUser.email && !currentUser.email.includes('example.com')) {
            const success = await refreshTokensFromDB();
            if (!success) {
                console.warn('Token validation failed - database may be unavailable');
            }
        }
    }, 30000); // Every 30 seconds
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAuthState();
    
    // Start token validation for logged-in users
    if (currentUser) {
        setTimeout(() => startTokenValidation(), 5000); // Start after 5 seconds
    }
    checkUrlAuth();
});

// Mobile menu functionality
const mobileMenuButton = document.querySelector('button.menu');
const mobileMenu = document.querySelector('.relative.z-50.lg\\:hidden');
const closeMenuButton = document.querySelector('button.close');
const mobileMenuBackdrop = mobileMenu?.querySelector('.fixed.inset-0');
const mobileMenuPanel = mobileMenu?.querySelector('.relative.mr-16');

// Function to toggle mobile menu
function toggleMobileMenu() {
    const isHidden = mobileMenu.classList.contains('hidden');
    
    if (isHidden) {
        // Show menu
        mobileMenu.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Add transition classes
        mobileMenuBackdrop?.classList.add('opacity-100');
        mobileMenuBackdrop?.classList.remove('opacity-0');
        mobileMenuPanel?.classList.add('translate-x-0');
        mobileMenuPanel?.classList.remove('-translate-x-full');
    } else {
        // Hide menu
        mobileMenuBackdrop?.classList.remove('opacity-100');
        mobileMenuBackdrop?.classList.add('opacity-0');
        mobileMenuPanel?.classList.remove('translate-x-0');
        mobileMenuPanel?.classList.add('-translate-x-full');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

// Add click event listeners for mobile menu
mobileMenuButton?.addEventListener('click', toggleMobileMenu);
closeMenuButton?.addEventListener('click', toggleMobileMenu);

// User dropdown menu functionality
const userMenuButton = document.getElementById('user-menu-button');
const userMenu = document.querySelector('[role="menu"]');

// Function to toggle user dropdown
function toggleUserMenu() {
    const isExpanded = userMenuButton.getAttribute('aria-expanded') === 'true';
    userMenuButton.setAttribute('aria-expanded', !isExpanded);
    
    if (isExpanded) {
        userMenu.classList.add('hidden');
    } else {
        userMenu.classList.remove('hidden');
    }
}

// Add click event listener for user menu
userMenuButton?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserMenu();
});

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    if (userMenu && !userMenuButton?.contains(e.target) && !userMenu.contains(e.target)) {
        userMenuButton?.setAttribute('aria-expanded', 'false');
        userMenu.classList.add('hidden');
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu && !mobileMenuButton?.contains(e.target) && !mobileMenuPanel?.contains(e.target)) {
        if (!mobileMenu.classList.contains('hidden')) {
            toggleMobileMenu();
        }
    }
});

// Handle escape key for both menus
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            toggleMobileMenu();
        }
        
        // Close user menu
        if (userMenu && !userMenu.classList.contains('hidden')) {
            userMenuButton?.setAttribute('aria-expanded', 'false');
            userMenu.classList.add('hidden');
        }
    }
});

// Store the template draw group
let drawGroupTemplate = null;

document.addEventListener('DOMContentLoaded', () => {
    const firstDrawGroup = document.querySelector('.draw-group');
    if (firstDrawGroup) {
        drawGroupTemplate = firstDrawGroup.cloneNode(true);

        // Clean the template thoroughly
        // Reset ID - new ones will be assigned by createDrawGroup
        drawGroupTemplate.id = ''; 
        const canvas = drawGroupTemplate.querySelector('.canvas');
        if (canvas) {
            canvas.id = ''; // Reset canvas ID
            // Clear any existing image and show empty/loader state
            const existingApiImg = canvas.querySelector('img.api-image');
            if (existingApiImg) existingApiImg.remove();
            const errorDiv = canvas.querySelector('.text-red-500'); // Remove potential error message
            if (errorDiv) errorDiv.remove();
            
            const emptyMessage = canvas.querySelector('.empty');
            const loader = canvas.querySelector('.loader');
            if (emptyMessage) emptyMessage.classList.remove('hidden');
            if (loader) loader.classList.add('hidden');
        }

        const textarea = drawGroupTemplate.querySelector('textarea');
        if (textarea) {
            textarea.value = '';
        }

        const imageActions = drawGroupTemplate.querySelector('.image-actions');
        if (imageActions) {
            imageActions.classList.add('hidden');
        }

        // Reset image prompt previews in the template
        const imagePromptContainer = drawGroupTemplate.querySelector('.image-prompt');
        if (imagePromptContainer) {
            drawGroupTemplate.dataset.nextPasteSlotIndex = '1';
            const previews = imagePromptContainer.querySelectorAll('.prompt-image-preview');
            previews.forEach((preview, index) => {
                preview.style.backgroundImage = '';
                delete preview.dataset.pastedImageUrl;
                const plusIcon = preview.querySelector('.plus-icon');
                if (index === 0) { // First slot
                    preview.classList.remove('hidden');
                    if (plusIcon) plusIcon.classList.remove('hidden');
                } else { // Other slots
                    preview.classList.add('hidden');
                    if (plusIcon) plusIcon.classList.add('hidden');
                }
            });
        }
         // Remove event listeners from buttons in the template if any were captured during cloning
        const templateButtons = drawGroupTemplate.querySelectorAll('button');
        templateButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });

        console.log('Draw group template captured and cleaned.');
    } else {
        console.error('Initial .draw-group not found to create a template.');
    }

    // Initial attachment of button listeners to existing groups on the page
    document.querySelectorAll('.draw-group').forEach(group => {
        attachButtonListeners(group);
    });
});

// Function to attach button listeners to a draw group
function attachButtonListeners(drawGroup) {
    const drawButton = drawGroup.querySelector('.actions .draw');
    const aiButton = drawGroup.querySelector('.actions .ai');
    const textarea = drawGroup.querySelector('textarea');
    const imagePromptContainer = drawGroup.querySelector('.image-prompt');
    const imageActionsContainer = drawGroup.querySelector('.image-actions');

    // Initialize image prompt previews for this group
    drawGroup.dataset.nextPasteSlotIndex = '1';
    if (imagePromptContainer) {
        // Ensure container is visible by default (it might be hidden if cloned from a hidden template initially)
        // However, index.html now starts .image-prompt without 'hidden', so this might not be strictly necessary
        // imagePromptContainer.classList.remove('hidden'); 

        const previews = imagePromptContainer.querySelectorAll('.prompt-image-preview');
        previews.forEach((preview, index) => {
            const plusIcon = preview.querySelector('.plus-icon');
            if (index === 0) { // First slot
                preview.classList.remove('hidden');
                if (plusIcon) plusIcon.classList.remove('hidden');
            } else { // Other slots
                preview.classList.add('hidden');
                if (plusIcon) plusIcon.classList.add('hidden');
            }
            // Clear any potential leftover background image from template cloning if needed
            preview.style.backgroundImage = '';
            
            delete preview.dataset.pastedImageUrl;
        });

        // Add click listeners to image preview slots for file picking
        previews.forEach((previewSlot, slotIndex) => {
            previewSlot.addEventListener('click', () => {
                // Only trigger file input if the slot doesn't already have a pasted/chosen image
                // Or, if we want to allow changing it, remove this condition.
                if (!previewSlot.dataset.pastedImageUrl) {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';

                    fileInput.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (file) {
                            handleImageFile(file, previewSlot, drawGroup, slotIndex + 1);
                        }
                        fileInput.remove(); // Clean up the dynamically created input
                    });
                    document.body.appendChild(fileInput); // Required for some browsers for click to work
                    fileInput.click();
                }
            });
        });
    }

    if (textarea) {
        textarea.addEventListener('paste', (event) => {
            const items = (event.clipboardData || event.originalEvent.clipboardData)?.items;
            let imageFile = null;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        imageFile = items[i].getAsFile();
                        break;
                    }
                }
            }

            if (imageFile) {
                event.preventDefault();
                let currentPasteSlotIndex = parseInt(drawGroup.dataset.nextPasteSlotIndex || '1');

                if (currentPasteSlotIndex > 4) {
                    console.log('All 4 image paste slots are full for group (via paste):', drawGroup.id);
                    return;
                }

                const targetPreviewDiv = drawGroup.querySelector(`.prompt-image-preview.image-${currentPasteSlotIndex}`);
                
                if (targetPreviewDiv) {
                    handleImageFile(imageFile, targetPreviewDiv, drawGroup, currentPasteSlotIndex);
                } else {
                    console.error(`Could not find preview div .image-${currentPasteSlotIndex} for paste in group ${drawGroup.id}`);
                }
            }
        });
    }
    
    if (drawButton) {
        const newDrawButton = drawButton.cloneNode(true);
        drawButton.parentNode.replaceChild(newDrawButton, drawButton);
        
        // Add click handler for the draw button that checks if draw-all was clicked
        newDrawButton.addEventListener('click', async (e) => {
            // Check if the click was on the draw-all span
            const drawAllSpan = e.target.closest('.draw-all');
            if (drawAllSpan) {
                e.preventDefault();
                e.stopPropagation();
                
                // Get all draw groups and filter them to get buttons of groups with text in textarea
                const allDrawGroups = Array.from(document.querySelectorAll('.draw-group'));
                const buttons = allDrawGroups.reduce((acc, group) => {
                    const textarea = group.querySelector('textarea');
                    const drawButton = group.querySelector('.actions .draw:not(:disabled)');
                    if (textarea && textarea.value.trim() !== '' && drawButton) {
                        acc.push(drawButton);
                    }
                    return acc;
                }, []);

                if (buttons.length === 0) {
                    console.log('Draw All: No draw groups with prompts found.');
                    alert('Please add some prompts before using Draw All.');
                    return;
                }
                
                console.log('Total non-disabled buttons with prompts found for Draw All:', buttons.length);
                
                for (let i = 0; i < buttons.length; i += 5) {
                    const batch = buttons.slice(i, i + 5);
                    console.log('Processing batch starting at index:', i, 'Batch size:', batch.length);
                    
                    // Click all buttons in the current batch simultaneously
                    // The individual click handler will clear any countdowns and set "Drawing..."
                    batch.forEach(btn => btn.click());
                    
                    if (i + 5 < buttons.length) {
                        const remainingButtons = buttons.slice(i + 5);
                        console.log('Remaining buttons to set to waiting/countdown:', remainingButtons.length);
                        
                        remainingButtons.forEach(btn => {
                            const label = btn.querySelector('.label');
                            if (label) {
                                // Clear any existing countdown for this button before starting a new one
                                if (btn.dataset.countdownIntervalId) {
                                    clearInterval(parseInt(btn.dataset.countdownIntervalId));
                                    delete btn.dataset.countdownIntervalId;
                                }

                                let countdown = 65; // Start countdown from 65 seconds
                                label.textContent = `${countdown}s Waiting...`;
                                
                                // Show loader for these waiting buttons as well
                                const waitingDrawGroup = btn.closest('.draw-group');
                                if (waitingDrawGroup) {
                                    const canvas = waitingDrawGroup.querySelector('.canvas');
                                    const emptyMessage = canvas.querySelector('.empty');
                                    const loader = canvas.querySelector('.loader');
                                    emptyMessage.classList.add('hidden');
                                    loader.classList.remove('hidden');
                                }

                                const intervalId = setInterval(() => {
                                    countdown--;
                                    if (countdown > 0) {
                                        label.textContent = `${countdown}s Waiting...`;
                                    } else {
                                        label.textContent = 'Waiting...'; // Or some other state like 'Queued...'
                                        clearInterval(intervalId);
                                        delete btn.dataset.countdownIntervalId;
                                    }
                                }, 1000);
                                btn.dataset.countdownIntervalId = intervalId.toString();
                            }
                        });
                        
                        console.log('Waiting 65 seconds before next batch...');
                        await new Promise(resolve => setTimeout(resolve, 65000));
                    }
                }
                
                const savePdfBanner = document.querySelector('.save-pdf-banner');
                if (savePdfBanner) {
                    savePdfBanner.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
                    savePdfBanner.classList.add('translate-y-0');
                    // Move FAB up if it exists
                    if (fabAddDrawGroup) {
                        fabAddDrawGroup.classList.remove('bottom-6', 'lg:bottom-8');
                        fabAddDrawGroup.classList.add('bottom-20'); 
                    }
                }
                return;
            }
            
            // Regular draw button click handling (individual button)
            // Check tokens before proceeding
            if (!checkTokensBeforeDraw()) {
                return;
            }
            
            // Clear countdown if one was running on this button
            if (newDrawButton.dataset.countdownIntervalId) {
                clearInterval(parseInt(newDrawButton.dataset.countdownIntervalId));
                delete newDrawButton.dataset.countdownIntervalId;
            }

            const canvas = drawGroup.querySelector('.canvas');
            const emptyMessage = canvas.querySelector('.empty');
            const loader = canvas.querySelector('.loader');
            const svgIcon = newDrawButton.querySelector('svg');
            
            // Get quality setting
            const qualitySelect = document.getElementById('quality');
            let qualityValue = 'low'; // Default value
            if (qualitySelect) {
                const selectedQuality = qualitySelect.value.toLowerCase();
                const validQualities = ['low', 'medium', 'high', 'auto'];
                if (validQualities.includes(selectedQuality)) {
                    qualityValue = selectedQuality;
                }
            }
            console.log('Using quality setting:', qualityValue);

            // Get aspect ratio
            const ratioSelect = document.getElementById('ratio');
            let imageSize = "1024x1536"; // Default portrait
            if (ratioSelect) {
                switch (ratioSelect.value) {
                    case "Square":
                        imageSize = "1024x1024";
                        break;
                    case "Landscape (wide)":
                        imageSize = "1536x1024";
                        break;
                    case "Portrait (tall)":
                    default:
                        imageSize = "1024x1536";
                        break;
                }
            }
            console.log('Using image size:', imageSize);
            
            // Get preset and define prompt rules
            const presetSelect = document.getElementById('preset');
            const drawingsSelect = document.getElementById('drawings');
            const numImages = drawingsSelect ? drawingsSelect.value : '1';
            
            let promptPrefix = "As a child's coloring book artist, draw a simple coloring book sheet. DO NOT include any text in the image unless explicitly instructed to do so. DO NOT use any colors other than black and white, never use color. Here is the prompt:"; // Default
            if (presetSelect) {
                switch (presetSelect.value) {
                    case "Photo":
                        promptPrefix = "Create a realistic 4k photo with a short range portrait lens that tells a story and uses bright colors for this prompt:";
                        break;
                    case "Sketches":
                        promptPrefix = "Create a figure drawing sketch that serves as a helpful drawing tool for artists. Use single color (black and white only) with clear lines that show character shapes, including balls at joints, circles in faces, and motion drawing style. Focus on the pose and movement described in the prompt. Here is the scene to draw:";
                        break;
                    case "None":
                        promptPrefix = "Create an image exactly in the style as prompted:";
                        break;
                    case "Coloring Book":
                    default:
                        promptPrefix = "As a child's coloring book artist, draw a simple coloring book sheet. DO NOT include any text in the image unless explicitly instructed to do so. DO NOT use any colors other than black and white, never use color. Here is the prompt:";
                        break;
                }
            }
            
            // Hide any existing API-generated image (but not the loader image)
            const existingApiImg = canvas.querySelector('img:not(.loader img)');
            if (existingApiImg) {
                existingApiImg.remove();
            }
            
            // Hide empty message and show loader
            emptyMessage.classList.add('hidden');
            loader.classList.remove('hidden');
            
            // Get the prompt text
            const prompt = textarea.value.trim() || 'Hello World';
            console.log('Generating image for prompt:', prompt);
            
            // Disable button and show loading state
            newDrawButton.disabled = true;
            const originalText = newDrawButton.querySelector('span').textContent;
            newDrawButton.querySelector('span').textContent = 'Drawing...';
            svgIcon.classList.add('animate-pulse');
            
            try {
                
                // Collect all reference images from the current draw group
                const imageElements = drawGroup.querySelectorAll('.prompt-image-preview');
                const imageReferences = [];

                // Process each image slot (1-4)
                for (let i = 0; i < imageElements.length; i++) {
                    const imageEl = imageElements[i];
                    const pastedImageURL = imageEl?.dataset?.pastedImageUrl;
                    
                    if (pastedImageURL && pastedImageURL.startsWith("data:image/")) {
                        console.log(`Processing reference image ${i + 1}...`);
                        
                        // Convert data URL to base64 string (remove data:image/type;base64, prefix)
                        const base64Data = pastedImageURL.split(',')[1];
                        
                        imageReferences.push({
                            type: "image_url",
                            image_url: {
                                url: pastedImageURL
                            }
                        });
                    }
                }

                let response;
                let requestBody;
                let apiEndpoint;

                if (imageReferences.length > 0) {
                    console.log(`Using ${imageReferences.length} reference image(s) with /responses API...`);
                    
                    // Build content array starting with the text prompt
                    const contentArray = [
                        { type: "input_text", text: `Please generate an image: ${promptPrefix} ${prompt}. Use the reference images provided to guide the style and content.` }
                    ];
                    
                    // Add all reference images
                    imageReferences.forEach((imageRef, index) => {
                        contentArray.push({
                            type: "input_image",
                            image_url: imageRef.image_url.url
                        });
                    });

                    requestBody = {
                        model: "gpt-4.1",
                        input: [
                            {
                                role: "user",
                                content: contentArray
                            }
                        ],
                        tools: [{ 
                            type: "image_generation",
                            output_format: "png",
                            quality: qualityValue, // Use the actual quality value from the UI
                            size: imageSize // Use the actual pixel dimensions from imageSize variable
                        }],
                        tool_choice: { type: "image_generation" } // Force image generation
                    };
                    
                    apiEndpoint = 'https://api.openai.com/v1/responses';
                } else {
                    console.log('No reference images. Using standard image generation API...');
                    
                    requestBody = {
                        model: "gpt-image-1",
                        size: imageSize,
                        quality: qualityValue,
                        output_format: "png",
                        prompt: `${promptPrefix} ${prompt}.`
                    };
                    
                    apiEndpoint = 'https://api.openai.com/v1/images/generations';
                }

                console.log('API Request Body:', JSON.stringify(requestBody, null, 2));
                
                response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log('Response status:', response.status);
                const responseText = await response.text();
                console.log('Raw response:', responseText);

                if (!response.ok) {
                    let errorMessage = 'Failed to generate image';
                    try {
                        const errorData = JSON.parse(responseText);
                        if (response.status === 429) {
                            errorMessage = 'Rate limit reached. Please try again in a few moments.';
                        } else if (errorData.error?.message) {
                            errorMessage = errorData.error.message;
                        }
                    } catch (e) {
                        console.error('Error parsing error response:', e);
                    }
                    throw new Error(errorMessage);
                }

                const data = JSON.parse(responseText);
                console.log('Parsed response:', data);
                
                let imageData = null;
                
                // Handle different response formats
                if (imageReferences.length > 0) {
                    // Handle /responses endpoint format
                    const imageGenerationOutputs = data.output?.filter(output => output.type === "image_generation_call");
                    if (imageGenerationOutputs && imageGenerationOutputs.length > 0) {
                        imageData = imageGenerationOutputs[0].result; // Base64 string
                    }
                } else {
                    // Handle /images/generations endpoint format
                    if (data.data && data.data[0] && data.data[0].b64_json) {
                        imageData = data.data[0].b64_json;
                    } else if (data.data && data.data[0] && data.data[0].url) {
                        imageData = data.data[0].url;
                    }
                }
                
                if (imageData) {
                    // Deduct tokens based on API usage
                    const tokensUsed = data.usage?.total_tokens || 100; // fallback if usage not provided
                    await deductTokens(tokensUsed);
                    
                    // Hide both empty message and loader
                    emptyMessage.classList.add('hidden');
                    loader.classList.add('hidden');

                    // Create new image as direct child of canvas
                    const img = document.createElement('img');
                    img.className = 'w-full h-full object-contain api-image';
                    
                    // Handle both base64 data and URLs
                    if (typeof imageData === 'string' && imageData.startsWith('http')) {
                        img.src = imageData;
                    } else {
                        img.src = `data:image/png;base64,${imageData}`;
                    }
                    img.alt = prompt;
                    canvas.appendChild(img);

                    // Make image-actions visible
                    const imageActions = drawGroup.querySelector('.image-actions');
                    if (imageActions) {
                        imageActions.classList.remove('hidden');
                    }

                    // Log the revised prompt for reference (different structure for different endpoints)
                    if (imageReferences.length > 0) {
                        // /responses endpoint doesn't have revised_prompt in the same place
                        console.log('Generated with reference images');
                    } else {
                        // /images/generations endpoint
                        if (data.data && data.data[0] && data.data[0].revised_prompt) {
                            console.log('Revised prompt:', data.data[0].revised_prompt);
                        }
                    }
                    
                    // Show the save PDF banner
                    const savePdfBanner = document.querySelector('.save-pdf-banner');
                    if (savePdfBanner) {
                        savePdfBanner.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
                        savePdfBanner.classList.add('translate-y-0');
                        // Move FAB up if it exists
                        if (fabAddDrawGroup) {
                            fabAddDrawGroup.classList.remove('bottom-6', 'lg:bottom-8');
                            fabAddDrawGroup.classList.add('bottom-20'); 
                        }
                    }
                } else {
                    throw new Error('No image data received from API');
                }
            } catch (error) {
                console.error('Error generating image:', error);
                // Show error in the canvas
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-500 text-center p-4';
                errorDiv.textContent = `Error: ${error.message}`;
                canvas.innerHTML = '';
                canvas.appendChild(errorDiv);
            } finally {
                // Re-enable button and restore original text
                newDrawButton.disabled = false;
                newDrawButton.querySelector('span').textContent = originalText;
                svgIcon.classList.remove('animate-pulse');
            }
        });
    }

    if (aiButton) {
        const newAiButton = aiButton.cloneNode(true);
        aiButton.parentNode.replaceChild(newAiButton, aiButton);
        
        newAiButton.addEventListener('click', async () => {
            // Check if user is logged in before allowing improve functionality
            if (!checkTokensBeforeDraw()) {
                return;
            }
            
            // Get the textarea and canvas elements
            const textarea = drawGroup.querySelector('textarea');
            const canvas = drawGroup.querySelector('.canvas');
            const svgIcon = newAiButton.querySelector('svg');
            
            // Get the prompt text
            const basePrompt = textarea.value.trim() || 'Hello World';
            console.log('Sending prompt:', basePrompt);
            
            // Disable button and show loading state
            newAiButton.disabled = true;
            const originalText = newAiButton.querySelector('span').textContent;
            newAiButton.querySelector('span').textContent = 'Improving...';
            svgIcon.classList.add('animate-pulse');
            
            try {
                // Call ChatGPT API
                console.log('Making API call...');
                const response = await fetch('https://api.openai.com/v1/responses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4.1",
                        input: `Create a creative coloring book prompt based on this idea: ${basePrompt}. Return ONLY the prompt text, no formatting, no additional language or instructions.`
                    })
                });

                console.log('Response status:', response.status);
                const responseText = await response.text();
                console.log('Raw response:', responseText);

                if (!response.ok) {
                    let errorMessage = 'Failed to improve prompt';
                    try {
                        const errorData = JSON.parse(responseText);
                        if (response.status === 429) {
                            errorMessage = 'Rate limit reached. Please try again in a few moments.';
                        } else if (errorData.error?.message) {
                            errorMessage = errorData.error.message;
                        }
                    } catch (e) {
                        console.error('Error parsing error response:', e);
                    }
                    throw new Error(errorMessage);
                }

                const data = JSON.parse(responseText);
                console.log('Parsed response:', data);
                
                if (data.output?.[0]?.content?.[0]?.text) {
                    console.log('Updating textarea with:', data.output[0].content[0].text);
                    textarea.value = data.output[0].content[0].text;
                } else {
                    console.log('No text content in response');
                    throw new Error('No response text received from API');
                }
            } catch (error) {
                console.error('Error calling ChatGPT:', error);
                // Show error in the textarea
                textarea.value = `Error: ${error.message}`;
            } finally {
                // Re-enable button and restore original text
                newAiButton.disabled = false;
                newAiButton.querySelector('span').textContent = originalText;
                svgIcon.classList.remove('animate-pulse');
            }
        });
    }

    if (imageActionsContainer) {
        const copyButton = imageActionsContainer.querySelector('.image-action-button.copy');
        const downloadButton = imageActionsContainer.querySelector('.image-action-button.download');

        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                // Pop effect
                copyButton.classList.add('scale-110');
                setTimeout(() => {
                    copyButton.classList.remove('scale-110');
                }, 150);

                const apiImage = drawGroup.querySelector('img.api-image');
                if (apiImage && apiImage.src) {
                    try {
                        const response = await fetch(apiImage.src);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                [blob.type]: blob
                            })
                        ]);
                        console.log('Image copied to clipboard!');
                    } catch (err) {
                        console.error('Failed to copy image: ', err);
                        alert('Failed to copy image. See console for details.');
                    }
                } else {
                    console.warn('No API image found to copy in this draw group.');
                    alert('No image to copy.');
                }
            });
        }

        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                // Pop effect
                downloadButton.classList.add('scale-110');
                setTimeout(() => {
                    downloadButton.classList.remove('scale-110');
                }, 150);

                const apiImage = drawGroup.querySelector('img.api-image');
                const promptTextarea = drawGroup.querySelector('textarea');
                let filename = 'superfun-image.png';
                if (promptTextarea && promptTextarea.value.trim()) {
                    // Create a slug from the first few words of the prompt
                    const slug = promptTextarea.value.trim().toLowerCase().split(/\\s+/).slice(0, 5).join('-').replace(/[^a-z0-9-]/g, '');
                    if (slug) {
                        filename = `${slug}.png`;
                    }
                }

                if (apiImage && apiImage.src) {
                    const link = document.createElement('a');
                    link.href = apiImage.src;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('Image download initiated.');
                } else {
                    console.warn('No API image found to download in this draw group.');
                    alert('No image to download.');
                }
            });
        }
    }
}

// Function to create a draw group HTML
function createDrawGroup(index) {
    if (!drawGroupTemplate) {
        console.error('Draw group template is not available. Cannot create new group.');
        return null;
    }
    
    // Clone the template
    const newGroup = drawGroupTemplate.cloneNode(true);
    
    // Update IDs for the new clone
    newGroup.id = `draw-group-${index}`;
    const canvas = newGroup.querySelector('.canvas');
    if (canvas) {
        canvas.id = `canvas-${index}`;
        // Ensure canvas is in default empty state for the clone
        const existingApiImg = canvas.querySelector('img.api-image');
        if (existingApiImg) existingApiImg.remove();
        const errorDiv = canvas.querySelector('.text-red-500');
        if (errorDiv) errorDiv.remove();
        const emptyMessage = canvas.querySelector('.empty');
        const loader = canvas.querySelector('.loader');
        if (emptyMessage) emptyMessage.classList.remove('hidden');
        if (loader) loader.classList.add('hidden');
    }
    
    // Reset textarea value for the clone (double-check, template should be clean)
    const textarea = newGroup.querySelector('textarea');
    if (textarea) {
        textarea.value = '';
    }

    // Ensure image-actions are hidden for the clone
    const imageActions = newGroup.querySelector('.image-actions');
    if (imageActions) {
        imageActions.classList.add('hidden');
    }

    // Reset image prompt previews for the new clone
    const imagePromptContainer = newGroup.querySelector('.image-prompt');
    if (imagePromptContainer) {
        newGroup.dataset.nextPasteSlotIndex = '1';
        const previews = imagePromptContainer.querySelectorAll('.prompt-image-preview');
        previews.forEach((preview, idx) => {
            preview.style.backgroundImage = '';
            delete preview.dataset.pastedImageUrl;
            const plusIcon = preview.querySelector('.plus-icon');
            if (idx === 0) { // First slot
                preview.classList.remove('hidden');
                if (plusIcon) plusIcon.classList.remove('hidden');
            } else { // Other slots
                preview.classList.add('hidden');
                if (plusIcon) plusIcon.classList.add('hidden');
            }
        });
    }
    
    // Attach button listeners to the new group
    attachButtonListeners(newGroup);
    
    return newGroup;
}

// Handle number of drawings change
const drawingsSelect = document.getElementById('drawings');
const drawingsContainer = document.querySelector('.drawings');

drawingsSelect.addEventListener('change', () => {
    const numDrawings = parseInt(drawingsSelect.value);
    const currentGroups = drawingsContainer.querySelectorAll('.draw-group');
    const currentCount = currentGroups.length;
    
    // Update grid columns based on number of drawings
    if (numDrawings >= 2) {
        drawingsContainer.classList.add('md:grid-cols-2');
    } else {
        drawingsContainer.classList.remove('md:grid-cols-2');
    }
    
    if (numDrawings > currentCount) {
        // Add new groups
        for (let i = currentCount + 1; i <= numDrawings; i++) {
            const newGroup = createDrawGroup(i);
            drawingsContainer.appendChild(newGroup);
        }
    } else if (numDrawings < currentCount) {
        // Remove excess groups
        for (let i = currentCount; i > numDrawings; i--) {
            const groupToRemove = document.getElementById(`draw-group-${i}`);
            if (groupToRemove) {
                groupToRemove.remove();
            }
        }
    }
});

// Create button functionality
document.querySelector('.actions .write').addEventListener('click', async () => {
    // Check if user is logged in before allowing story generation
    if (!checkTokensBeforeDraw()) {
        return;
    }
    
    const button = document.querySelector('.actions .write');
    const promptTextarea = document.getElementById('prompt');
    const drawingsSelect = document.getElementById('drawings');
    const svgIcon = button.querySelector('svg');
    
    // Get the prompt and number of drawings
    const prompt = promptTextarea.value.trim();
    const numDrawings = parseInt(drawingsSelect.value);
    
    if (!prompt) {
        alert('Please enter a story prompt first!');
        return;
    }
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = 'Thinking...';
    svgIcon.classList.add('animate-pulse');
    
    try {
        // Check preset to determine story generation approach
        const presetSelect = document.getElementById('preset');
        const isSketchesPreset = presetSelect && presetSelect.value === 'Sketches';
        
        let storyPrompt;
        if (isSketchesPreset) {
            // For Sketches preset: create variations of the same scene
            storyPrompt = `Create ${numDrawings} detailed visual prompts that all represent the same scene but with minor visual differences. Each prompt must be completely standalone and self-contained. Do not reference other variations or use phrases like "in the same scene" or "similar to the previous".

For the scene: "${prompt}"

IMPORTANT: Do not include any introductory text, explanations, or preamble. Start directly with the first variation.

Each variation should:
- Be a complete, standalone description that can be read independently
- Maintain identical character descriptions (use full physical descriptions each time)
- Include the complete setting and scenario description in each prompt
- Vary the poses, motions, facial expressions, and gestures
- Use 3-4 full paragraphs with rich visual details for artists

Format each variation EXACTLY as follows:
VARIATION 1:
[Complete standalone description of the full scene, characters, setting, and specific poses/motions - 3-4 paragraphs]

VARIATION 2:
[Complete standalone description of the full scene, characters, setting, and different poses/motions - 3-4 paragraphs]

VARIATION 3:
[Complete standalone description of the full scene, characters, setting, and different poses/motions - 3-4 paragraphs]

Continue this exact pattern. Each variation must include all details needed to understand the complete scene without reading any other variation.`;
        } else {
            // Default coloring book story generation
            storyPrompt = `Act as a coloring book artist. Develop a storyline that can be illustrated in a coloring book based on the given story of "${prompt}". The storyline should be split into ${numDrawings} chapters, each chapter describing a specific and unique scene, suitable for all ages. Keep each chapter to exactly 25 words or less.
                
                Instead of naming a charater, use a repeated visual descriptions to maintain consistency. Our prompts will be turned into images, so instead of the name "Bob", say, for example sake, "the teen boy with curly hair" in each chapter. If any visual descriptions are provided in the prompt, reuse them as much as possible. If there are no visual descriptions, make one up (but make sure to use it in each chapter)

Format each chapter as follows:
Chapter 1:
[Two sentences or less, reusing characters by a matching visual descriptions]

Chapter 2:
[Two sentences or less, reusing characters by a matching visual descriptions]

And so on. Do not use markdown formatting, asterisks, or any special characters. Keep the text clean and simple.`;
        }
        
        // Call ChatGPT API for story generation
        console.log('Making story generation API call...');
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4.1",
                input: storyPrompt
            })
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
            let errorMessage = 'Failed to generate story';
            try {
                const errorData = JSON.parse(responseText);
                if (response.status === 429) {
                    errorMessage = 'Rate limit reached. Please try again in a few moments.';
                } else if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        console.log('Parsed response:', data);
        
        if (data.output?.[0]?.content?.[0]?.text) {
            const storyText = data.output[0].content[0].text;
            console.log('Generated story:', storyText);
            
            // Split the story into chapters or variations based on preset
            const splitPattern = isSketchesPreset ? /VARIATION \d+:/i : /Chapter \d+:/;
            let chapters = storyText.split(splitPattern).filter(chapter => chapter.trim());
            
            // For sketches preset, if the first chunk looks like intro text, remove it
            if (isSketchesPreset && chapters.length > 0) {
                const firstChunk = chapters[0].toLowerCase();
                if (firstChunk.includes('certainly') || firstChunk.includes('below are') || firstChunk.includes('here are') || firstChunk.length < 100) {
                    chapters = chapters.slice(1); // Remove the intro chunk
                }
            }
            
            // Update each draw group's textarea with its chapter
            const drawGroups = document.querySelectorAll('.draw-group');
            chapters.forEach((chapter, index) => {
                if (index < drawGroups.length) {
                    const textarea = drawGroups[index].querySelector('textarea');
                    if (textarea) {
                        textarea.value = chapter.trim();
                    }
                }
            });
        } else {
            throw new Error('No story content received from API');
        }
    } catch (error) {
        console.error('Error generating story:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Re-enable button and restore original text
        button.disabled = false;
        button.querySelector('span').textContent = originalText;
        svgIcon.classList.remove('animate-pulse');
    }
});

// PDF Generation functionality
document.getElementById('make-pdf').addEventListener('click', async () => {
    // Get all canvas elements that contain API-generated images
    const canvases = document.querySelectorAll('.canvas');
    const imageUrls = [];
    
    // Collect all API-generated images
    canvases.forEach(canvas => {
        const img = canvas.querySelector('img:not(.loader img)');
        if (img) {
            imageUrls.push(img.src);
        }
    });
    
    if (imageUrls.length === 0) {
        alert('No images to save! Please generate some images first.');
        return;
    }
    
    // Determine PDF page size and orientation based on #ratio selection
    const ratioSelect = document.getElementById('ratio');
    let pageWidth = 1024;
    let pageHeight = 1536;
    let pdfOrientation = 'portrait';

    if (ratioSelect) {
        switch (ratioSelect.value) {
            case "Square":
                pageWidth = 1024;
                pageHeight = 1024;
                pdfOrientation = 'portrait'; // or 'landscape', square can be either
                break;
            case "Landscape (wide)":
                pageWidth = 1536;
                pageHeight = 1024;
                pdfOrientation = 'landscape';
                break;
            case "Portrait (tall)":
            default:
                pageWidth = 1024;
                pageHeight = 1536;
                pdfOrientation = 'portrait';
                break;
        }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: pdfOrientation,
        unit: 'px',
        format: [pageWidth, pageHeight]
    });
    
    // Process each image
    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        
        // Load and process the image
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
        
        // Calculate dimensions to maintain aspect ratio (like background: cover)
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let finalWidth, finalHeight, x, y;
        
        if (imgRatio > pageRatio) {
            // Image is wider than page ratio
            finalHeight = pageHeight;
            finalWidth = finalHeight * imgRatio;
            x = (pageWidth - finalWidth) / 2;
            y = 0;
        } else {
            // Image is taller than page ratio
            finalWidth = pageWidth;
            finalHeight = finalWidth / imgRatio;
            x = 0;
            y = (pageHeight - finalHeight) / 2;
        }
        
        // Add image to PDF with calculated dimensions
        doc.addImage(img, 'PNG', x, y, finalWidth, finalHeight);
        
        // Add new page if not the last image
        if (i < imageUrls.length - 1) {
            doc.addPage();
        }
    }
    
    // Save the PDF
    doc.save('superfun-coloring-book.pdf');
});

// Lightbox Functionality
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const drawingsContainerForLightbox = document.querySelector('.drawings'); // Event delegation target

let currentLightboxImageIndex = 0;
let galleryApiImages = [];

function updateLightboxNav() {
    lightboxPrev.disabled = currentLightboxImageIndex === 0;
    lightboxNext.disabled = currentLightboxImageIndex === galleryApiImages.length - 1;
}

function openLightbox(imageElement) {
    galleryApiImages = Array.from(document.querySelectorAll('.api-image'));
    const clickedImageSrc = imageElement.src;
    currentLightboxImageIndex = galleryApiImages.findIndex(img => img.src === clickedImageSrc);

    if (currentLightboxImageIndex === -1) { 
        console.error("Clicked image not found in galleryApiImages");
        return;
    }

    lightboxImage.src = galleryApiImages[currentLightboxImageIndex].src;
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    updateLightboxNav();
}

function closeLightbox() { // This function needs to be accessible by modals.js for the Escape key fallback
    if (lightboxModal) { // Ensure it exists
        lightboxModal.classList.add('hidden');
        document.body.style.overflow = ''; 
        galleryApiImages = [];
        currentLightboxImageIndex = 0;
    }
}

function showNextImage() {
    if (currentLightboxImageIndex < galleryApiImages.length - 1) {
        currentLightboxImageIndex++;
        lightboxImage.src = galleryApiImages[currentLightboxImageIndex].src;
        updateLightboxNav();
    }
}

function showPrevImage() {
    if (currentLightboxImageIndex > 0) {
        currentLightboxImageIndex--;
        lightboxImage.src = galleryApiImages[currentLightboxImageIndex].src;
        updateLightboxNav();
    }
}

if (drawingsContainerForLightbox) {
    drawingsContainerForLightbox.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('api-image')) {
            openLightbox(e.target);
        }
    });
}

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrev?.addEventListener('click', showPrevImage);
lightboxNext?.addEventListener('click', showNextImage);

// The global keydown listener that was here previously for lightbox and tokens modal
// is now primarily handled in modals.js. We only need the lightbox-specific arrow key logic here.
// The Escape part for lightbox is a fallback in modals.js if no generic modal was open.
document.addEventListener('keydown', (e) => {
    if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
        // Keep lightbox arrow navigation if lightbox is open
        if (e.key === 'ArrowRight') {
            showNextImage();
        } else if (e.key === 'ArrowLeft') {
            showPrevImage();
        }
        // Escape for lightbox is handled by the new global listener in modals.js as a fallback
    }
});

// Initialize the Tokens Modal using the new system - DISABLED to prevent conflicts
// We now handle modal opening with the new button system
// if (typeof initializeModal === 'function') {
//     const tokensModalInstance = initializeModal('tokens-modal', '.tokens');
//     // The initializeModal function in modals.js now handles adding to a global list for Escape key handling.
// } else {
//     console.error('initializeModal function not found. Ensure modals.js is loaded correctly.');
// }


// Token purchase logic
const tokensModalBuyButton = document.getElementById('tokens-modal-buy-button');
if (tokensModalBuyButton) {
    tokensModalBuyButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('user-email').value.trim();
        const selectedPlan = document.querySelector('input[name="pricing-plan"]:checked')?.value;
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }
        
        if (!selectedPlan) {
            alert('Please select a token plan');
            return;
        }
        
        // Show loading state
        const originalText = e.target.textContent;
        e.target.textContent = "Processing...";
        e.target.disabled = true;
        
        try {
            // Include current token count if user is logged in
            const requestBody = {
                email,
                plan: selectedPlan
            };
            
            // Add current tokens if user is logged in
            if (currentUser && currentUser.tokens !== undefined) {
                requestBody.currentTokens = currentUser.tokens;
            }
            
            const response = await fetch('/.netlify/functions/purchase-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // If user is logged in, immediately update their token count
                if (data.isLoggedInUser && currentUser) {
                    currentUser.tokens = data.newTotalTokens;
                    saveAuthState(currentUser);
                    
                    // Refresh from database to ensure sync after purchase
                    setTimeout(() => refreshTokensFromDB(), 1000);
                }
                
                // Close tokens modal
                hideModal('tokens-modal');
                
                // Show purchase success modal
                showPurchaseSuccessModal(data.message);
                
                // Clear form
                document.getElementById('user-email').value = '';
            } else {
                // TODO: Could show error in a modal too, but for now keep alert for errors
                alert(data.error || 'Failed to process purchase');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            // TODO: Could show error in a modal too, but for now keep alert for errors
            alert('Failed to process purchase. Please try again.');
        } finally {
            // Reset button
            e.target.textContent = originalText;
            e.target.disabled = false;
        }
    });
}


// FAB Add Draw Group Functionality
const fabAddDrawGroup = document.querySelector('.add-draw-group');
const drawingsSelectForFab = document.getElementById('drawings'); // Already used elsewhere, ensure it's the same one

if (fabAddDrawGroup && drawingsSelectForFab) {
    fabAddDrawGroup.addEventListener('click', () => {
        const currentNumDrawings = parseInt(drawingsSelectForFab.value);
        const maxDrawings = drawingsSelectForFab.options.length; // Assuming options represent 1 to max
        
        if (currentNumDrawings < maxDrawings) {
            drawingsSelectForFab.value = (currentNumDrawings + 1).toString();
            // Dispatch a change event to trigger the existing logic for adding draw groups
            drawingsSelectForFab.dispatchEvent(new Event('change'));
        } else {
            // Optionally, provide feedback if max is reached, or disable the FAB
            console.log('Maximum number of draw groups reached.');
            // fabAddDrawGroup.disabled = true; // Example: disable FAB
        }
    });
}

let projectsModalInstance = null; // Declare in a scope accessible to both
// Initialize the Projects Modal using the new system
if (typeof initializeModal === 'function') {
    projectsModalInstance = initializeModal('projects-modal', '.projects-link');
} else {
    console.error('initializeModal function not found. Ensure modals.js is loaded correctly.');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + N to add a new draw group
    if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault(); // Prevent default browser action

        const drawingsSelectForShortcut = document.getElementById('drawings');
        if (drawingsSelectForShortcut) {
            const currentNumDrawings = parseInt(drawingsSelectForShortcut.value);
            const maxDrawings = drawingsSelectForShortcut.options.length;

            if (currentNumDrawings < maxDrawings) {
                drawingsSelectForShortcut.value = (currentNumDrawings + 1).toString();
                drawingsSelectForShortcut.dispatchEvent(new Event('change'));
                console.log('Added new draw group via Ctrl+N shortcut.');
            } else {
                console.log('Maximum number of draw groups reached (Ctrl+N shortcut attempt).');
            }
        }
    }

    // Ctrl + P to open Projects modal
    if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault(); // Prevent default browser print action
        const projectsLink = document.querySelector('.projects-link');
        if (projectsLink) {
            projectsLink.click();
            console.log('Triggered click on .projects-link via Ctrl+P shortcut.');
        } else {
            console.error('.projects-link element not found for Ctrl+P shortcut.');
        }
    }
});

// Helper function to process an image file (from paste or click)
function handleImageFile(imageFile, targetPreviewDiv, drawGroup, slotNumber) {
    const plusIcon = targetPreviewDiv.querySelector('.plus-icon');
    const reader = new FileReader();
    reader.onload = (e) => {
        if (plusIcon) plusIcon.classList.add('hidden');
        targetPreviewDiv.style.backgroundImage = `url(${e.target.result})`;
        // targetPreviewDiv.classList.remove('bg-indigo-100'); // Removed from HTML, so not needed here
        targetPreviewDiv.dataset.pastedImageUrl = e.target.result;

        // Pop animation
        targetPreviewDiv.classList.remove('hidden'); 
        targetPreviewDiv.classList.add('opacity-0', 'scale-[.75]');
        requestAnimationFrame(() => {
            targetPreviewDiv.classList.remove('opacity-0', 'scale-[.75]');
            targetPreviewDiv.classList.add('opacity-100', 'scale-[1.25]');
            setTimeout(() => {
                targetPreviewDiv.classList.remove('scale-[1.25]');
                targetPreviewDiv.classList.add('scale-100');
            }, 150);
        });

        console.log(`Image set for slot ${slotNumber} in draw group: ${drawGroup.id}`);
        
        // Update next paste slot index *if* this was the slot it was expecting
        let currentNextPasteSlot = parseInt(drawGroup.dataset.nextPasteSlotIndex || '1');
        if (slotNumber === currentNextPasteSlot && currentNextPasteSlot <= 4) {
             drawGroup.dataset.nextPasteSlotIndex = (currentNextPasteSlot + 1).toString();
        }

        // Reveal the *actual* next empty slot's plus icon, if it exists and isn't already visible
        const nextSlotToShowIndex = slotNumber + 1;
        if (nextSlotToShowIndex <= 4) {
            const nextPreviewDiv = drawGroup.querySelector(`.prompt-image-preview.image-${nextSlotToShowIndex}`);
            if (nextPreviewDiv && nextPreviewDiv.classList.contains('hidden')) { // Only if it's currently hidden
                nextPreviewDiv.classList.remove('hidden');
                const nextPlusIcon = nextPreviewDiv.querySelector('.plus-icon');
                if (nextPlusIcon) nextPlusIcon.classList.remove('hidden');
            }
        }
    };
    reader.readAsDataURL(imageFile);
}

// Modal animation helper functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('hidden');
    const backdrop = modal.querySelector('.modal-backdrop');
    const panel = modal.querySelector('.modal-panel');
    
    // Trigger animations
    requestAnimationFrame(() => {
        backdrop?.classList.remove('opacity-0');
        backdrop?.classList.add('opacity-100');
        panel?.classList.remove('opacity-0', 'translate-y-12', 'sm:scale-95');
        panel?.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    });
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const backdrop = modal.querySelector('.modal-backdrop');
    const panel = modal.querySelector('.modal-panel');
    
    // Trigger exit animations
    backdrop?.classList.remove('opacity-100');
    backdrop?.classList.add('opacity-0');
    panel?.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
    panel?.classList.add('opacity-0', 'translate-y-12', 'sm:scale-95');
    
    // Hide modal after animation
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Replace the auth code prompt with modal
function showAuthCodeModal() {
    showModal('auth-code-modal');
    // Focus the input after modal is shown
    setTimeout(() => {
        const input = document.getElementById('auth-code-input');
        if (input) input.focus();
    }, 300);
}

// Send login email function
async function sendLoginEmail(email) {
    try {
        const response = await fetch('/.netlify/functions/send-login-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Show success state in login modal with custom message
            showLoginSuccessState(data.message);
        } else {
            alert(data.error || 'Failed to send login email');
        }
    } catch (error) {
        console.error('Send login email error:', error);
        alert('Failed to send login email. Please try again.');
    }
}

// Show welcome modal with token count
function showWelcomeModal(tokens) {
    const welcomeMessage = document.getElementById('welcome-modal-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `You have ${tokens.toLocaleString()} tokens available.`;
    }
    showModal('welcome-modal');
}

// Show purchase success modal
function showPurchaseSuccessModal(message) {
    const purchaseMessage = document.getElementById('purchase-success-modal-message');
    if (purchaseMessage) {
        purchaseMessage.textContent = message;
    }
    showModal('purchase-success-modal');
}

// Show success state in login modal
function showLoginSuccessState(message) {
    const formSection = document.getElementById('login-form-section');
    const successMessage = document.getElementById('login-success-message');
    const emailInput = document.getElementById('login-email');
    
    // Update the success message text with the custom message
    if (successMessage && message) {
        // Find the <p> element inside and update its text
        const messageP = successMessage.querySelector('p');
        if (messageP) {
            messageP.textContent = message;
        }
    }
    
    // Hide form section (email input and buttons)
    if (formSection) formSection.classList.add('hidden');
    if (emailInput && emailInput.parentElement && emailInput.parentElement.parentElement) {
        emailInput.parentElement.parentElement.classList.add('hidden');
    }
    
    // Show success message
    if (successMessage) successMessage.classList.remove('hidden');
}

// Reset login modal to initial state
function resetLoginModal() {
    const formSection = document.getElementById('login-form-section');
    const successMessage = document.getElementById('login-success-message');
    const emailInput = document.getElementById('login-email');
    
    // Show form elements
    if (formSection) formSection.classList.remove('hidden');
    if (emailInput && emailInput.parentElement && emailInput.parentElement.parentElement) {
        emailInput.parentElement.parentElement.classList.remove('hidden');
    }
    
    // Hide success message
    if (successMessage) successMessage.classList.add('hidden');
    
    // Clear email input
    if (emailInput) emailInput.value = '';
}

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login modal handlers
    const loginModal = document.getElementById('login-modal');
    const loginSendBtn = document.getElementById('login-modal-send-button');
    const loginCancelBtn = document.getElementById('login-modal-cancel-button');
    const loginEmailInput = document.getElementById('login-email');
    
    if (loginSendBtn) {
        loginSendBtn.addEventListener('click', () => {
            const email = loginEmailInput?.value.trim();
            if (email) {
                sendLoginEmail(email);
            } else {
                alert('Please enter your email address');
            }
        });
    }
    
    if (loginCancelBtn) {
        loginCancelBtn.addEventListener('click', () => {
            hideModal('login-modal');
            setTimeout(() => resetLoginModal(), 300);
        });
    }
    
    // Login modal done button (for success state)
    const loginDoneBtn = document.getElementById('login-modal-done-button');
    if (loginDoneBtn) {
        loginDoneBtn.addEventListener('click', () => {
            hideModal('login-modal');
            setTimeout(() => resetLoginModal(), 300);
        });
    }
    
    // Auth code modal handlers
    const authCodeModal = document.getElementById('auth-code-modal');
    const authCodeLoginBtn = document.getElementById('auth-code-modal-login-button');
    const authCodeCancelBtn = document.getElementById('auth-code-modal-cancel-button');
    const authCodeInput = document.getElementById('auth-code-input');
    
    if (authCodeLoginBtn) {
        authCodeLoginBtn.addEventListener('click', () => {
            const authCode = authCodeInput?.value.trim();
            if (authCode && authCode.length === 8) {
                hideModal('auth-code-modal');
                loginWithAuthCode(authCode);
            } else {
                alert('Please enter a valid 8-digit code');
            }
        });
    }
    
    if (authCodeCancelBtn) {
        authCodeCancelBtn.addEventListener('click', () => hideModal('auth-code-modal'));
    }
    
    // Welcome modal handlers
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeContinueBtn = document.getElementById('welcome-modal-continue-button');
    
    if (welcomeContinueBtn) {
        welcomeContinueBtn.addEventListener('click', () => hideModal('welcome-modal'));
    }
    
    // Purchase success modal handlers
    const purchaseSuccessModal = document.getElementById('purchase-success-modal');
    const purchaseSuccessContinueBtn = document.getElementById('purchase-success-modal-continue-button');
    
    if (purchaseSuccessContinueBtn) {
        purchaseSuccessContinueBtn.addEventListener('click', () => hideModal('purchase-success-modal'));
    }
    
    // Allow Enter key to submit in modals
    if (loginEmailInput) {
        loginEmailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginSendBtn?.click();
            }
        });
    }
    
    if (authCodeInput) {
        authCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authCodeLoginBtn?.click();
            }
        });
    }
    
    // Close modals when clicking backdrop
    [loginModal, authCodeModal, welcomeModal, purchaseSuccessModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                    hideModal(modal.id);
                    if (modal.id === 'login-modal') {
                        setTimeout(() => resetLoginModal(), 300);
                    }
                }
            });
        }
    });
    
    // Handle login buttons in the new button pairs
    updateAuthUI();
    
    // Initialize Universal Modal System
    initializeUniversalModal();
});

// ============================================================================
// UNIVERSAL MODAL SYSTEM
// ============================================================================

let currentModalType = null;

// Modal content templates
const modalTemplates = {
    'login': {
        maxWidth: 'sm:max-w-2xl',
        content: `
            <div>
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-indigo-600">
                        <path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="mt-3 text-center sm:mt-5">
                    <h3 class="text-base font-semibold text-gray-900">Login to Your Account</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">Enter your email and we'll send you a magic login link.</p>
                    </div>
                </div>
            </div>

            <div class="mt-5">
                <div>
                    <label for="universal-login-email" class="block text-sm font-medium text-gray-900">Email address</label>
                    <div class="mt-2">
                        <input type="email" id="universal-login-email" class="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="you@example.com" required>
                    </div>
                </div>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button id="universal-login-send" type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2">Send Login Link</button>
                <button type="button" class="universal-modal-cancel mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:col-start-1 sm:mt-0">Cancel</button>
            </div>
        `
    },
    
    'tokens': {
        maxWidth: 'sm:max-w-2xl',
        content: `
            <div>
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-green-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                    </svg>
                </div>
                <div class="mt-3 text-center sm:mt-5">
                    <h3 class="text-base font-semibold text-gray-900">Buy Superfun Draw Tokens</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">This is a silly app, but it uses a real API and costs me real money to run. You can buy <strong>TOKENS</strong> to gain access to this neato ability. Tweet <a href="https://x.com/clarklab" class="text-indigo-600 hover:text-indigo-900">@clarklab</a> if you'd like to chat.</p>
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <label for="universal-user-email" class="block text-sm font-medium text-gray-900">Email address</label>
                <div class="mt-2">
                    <input type="email" id="universal-user-email" class="block w-full rounded-md border-0 py-1.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="you@example.com" required>
                </div>
            </div>

            <fieldset aria-label="Pricing plans" class="mt-6 relative -space-y-px rounded-md bg-white">
                <label aria-label="Micro" aria-description="$10, 200k tokens, Base price" class="group pricing-plan-label flex cursor-pointer flex-col border border-gray-200 p-4 first:rounded-tl-md first:rounded-tr-md last:rounded-br-md last:rounded-bl-md focus:outline-hidden has-checked:relative has-checked:border-indigo-200 has-checked:bg-indigo-50 md:grid md:grid-cols-3 md:px-4">
                    <span class="flex items-center gap-3 text-sm">
                        <input name="universal-pricing-plan" value="micro" type="radio" checked class="pricing-plan-radio relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900 flex items-center gap-1">
                            <span>Micro</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    </span>
                    <span class="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-right">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900">$10</span>
                        <span class="text-gray-500 group-has-checked:text-indigo-700">(200k tokens)</span>
                    </span>
                    <span class="ml-6 pl-1 text-sm text-gray-500 group-has-checked:text-indigo-700 md:ml-0 md:pl-0 md:text-right flex items-center md:justify-end gap-1">
                        <span>Base price</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                    </span>
                </label>
                <label aria-label="Tinker" aria-description="$15, 500k tokens, Save 25%" class="group pricing-plan-label flex cursor-pointer flex-col border border-gray-200 p-4 first:rounded-tl-md first:rounded-tr-md last:rounded-br-md last:rounded-bl-md focus:outline-hidden has-checked:relative has-checked:border-indigo-200 has-checked:bg-indigo-50 md:grid md:grid-cols-3 md:px-4">
                    <span class="flex items-center gap-3 text-sm">
                        <input name="universal-pricing-plan" value="tinker" type="radio" class="pricing-plan-radio relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900 flex items-center gap-1">
                            <span>Tinker</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400 relative -left-1.5">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-indigo-600 text-sm font-normal relative -left-1">Save 25%</span>
                        </span>
                    </span>
                    <span class="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-right">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900">$15</span>
                        <span class="text-gray-500 group-has-checked:text-indigo-700">(500k tokens)</span>
                    </span>
                    <span class="ml-6 pl-1 text-sm text-gray-500 group-has-checked:text-indigo-700 md:ml-0 md:pl-0 md:text-right flex items-center md:justify-end gap-1">
                        <span>2.5x value</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                    </span>
                </label>
                <label aria-label="Pro" aria-description="$20, 1M tokens, Save 50%" class="group pricing-plan-label flex cursor-pointer flex-col border border-gray-200 p-4 first:rounded-tl-md first:rounded-tr-md last:rounded-br-md last:rounded-bl-md focus:outline-hidden has-checked:relative has-checked:border-indigo-200 has-checked:bg-indigo-50 md:grid md:grid-cols-3 md:px-4">
                    <span class="flex items-center gap-3 text-sm">
                        <input name="universal-pricing-plan" value="pro" type="radio" class="pricing-plan-radio relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900 flex items-center gap-1">
                            <span>Pro</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400 relative -left-1.5">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-amber-400 relative -left-3">
                                <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-indigo-600 text-sm font-normal relative -left-3">Save 50%</span>
                        </span>
                    </span>
                    <span class="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-right">
                        <span class="font-medium text-gray-900 group-has-checked:text-indigo-900">$20</span>
                        <span class="text-gray-500 group-has-checked:text-indigo-700">(1M tokens)</span>
                    </span>
                    <span class="ml-6 pl-1 text-sm text-gray-500 group-has-checked:text-indigo-700 md:ml-0 md:pl-0 md:text-right flex items-center md:justify-end gap-1">
                        <span>5x value</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                    </span>
                </label>
            </fieldset>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button id="universal-purchase-btn" type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2">BUY TOKENS</button>
                <button type="button" class="universal-modal-cancel mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:col-start-1 sm:mt-0">Cancel</button>
            </div>
        `
    },
    
    'auth-code': {
        maxWidth: 'sm:max-w-2xl',
        content: `
            <div>
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-indigo-600">
                        <path fill-rule="evenodd" d="M15.75 1.5a6.75 6.75 0 0 0-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 0 0-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5A.75.75 0 0 0 9 19.5V18h1.5a.75.75 0 0 0 .53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1 0 15.75 1.5Zm0 3a.75.75 0 0 0 0 1.5A2.25 2.25 0 0 1 18 8.25a.75.75 0 0 0 1.5 0 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="mt-3 text-center sm:mt-5">
                    <h3 class="text-base font-semibold text-gray-900">Enter Login Code</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">Enter the 8-digit code from your email</p>
                    </div>
                </div>
            </div>

            <div class="mt-5">
                <div>
                    <label for="universal-auth-code" class="block text-sm font-medium text-gray-900">Login Code</label>
                    <div class="mt-2">
                        <input type="text" id="universal-auth-code" maxlength="8" class="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 text-center font-mono text-lg tracking-widest" placeholder="12345678" required>
                    </div>
                </div>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button id="universal-auth-submit" type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2">Login</button>
                <button type="button" class="universal-modal-cancel mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:col-start-1 sm:mt-0">Cancel</button>
            </div>
        `
    },
    
    'success': {
        maxWidth: 'sm:max-w-2xl',
        content: (title, message) => `
            <div>
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <div class="mt-3 text-center sm:mt-5">
                    <h3 class="text-base font-semibold text-gray-900">${title}</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">${message}</p>
                    </div>
                </div>
            </div>
            <div class="mt-5 sm:mt-6">
                <button id="universal-success-ok" type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Continue</button>
            </div>
        `
    }
};

// Universal modal functions
function showUniversalModal(type, options = {}) {
    const modal = document.getElementById('universal-modal');
    const backdrop = document.getElementById('universal-modal-backdrop');
    const panel = document.getElementById('universal-modal-panel');
    const content = document.getElementById('universal-modal-content');
    
    if (!modal || !modalTemplates[type]) {
        console.error('Invalid modal type:', type);
        return;
    }
    
    currentModalType = type;
    
    // Set content
    const template = modalTemplates[type];
    if (typeof template.content === 'function') {
        content.innerHTML = template.content(options.title || '', options.message || '');
    } else {
        content.innerHTML = template.content;
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Animate in
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('opacity-0', 'translate-y-12', 'sm:scale-95');
        panel.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    });
    
    // Set up event handlers for this specific modal type
    setupModalHandlers(type, options);
}

function hideUniversalModal() {
    const modal = document.getElementById('universal-modal');
    const backdrop = document.getElementById('universal-modal-backdrop');
    const panel = document.getElementById('universal-modal-panel');
    
    // Animate out
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    panel.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
    panel.classList.add('opacity-0', 'translate-y-12', 'sm:scale-95');
    
    // Hide after animation
    setTimeout(() => {
        modal.classList.add('hidden');
        currentModalType = null;
    }, 300);
}

function setupModalHandlers(type, options) {
    // Remove existing handlers
    const oldHandlers = document.querySelectorAll('[data-universal-handler]');
    oldHandlers.forEach(el => {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    });
    
    // Login modal handlers
    if (type === 'login') {
        const sendBtn = document.getElementById('universal-login-send');
        const emailInput = document.getElementById('universal-login-email');
        
        if (sendBtn && emailInput) {
            sendBtn.setAttribute('data-universal-handler', 'true');
            sendBtn.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                if (!email) return;
                
                try {
                    const response = await fetch('/.netlify/functions/send-login-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        // Close current modal and show success modal
                        hideUniversalModal();
                        setTimeout(() => {
                            showUniversalModal('success', {
                                title: data.isNewUser ? 'Welcome!' : 'Welcome back!',
                                message: data.message
                            });
                        }, 300);
                    } else {
                        alert(data.error || 'Failed to send login email');
                    }
                } catch (error) {
                    console.error('Send login email error:', error);
                    alert('Failed to send login email. Please try again.');
                }
            });
        }
    }
    
    // Tokens modal handlers
    if (type === 'tokens') {
        const purchaseBtn = document.getElementById('universal-purchase-btn');
        
        if (purchaseBtn) {
            purchaseBtn.setAttribute('data-universal-handler', 'true');
            purchaseBtn.addEventListener('click', async () => {
                const email = document.getElementById('universal-user-email').value.trim();
                const selectedPlan = document.querySelector('input[name="universal-pricing-plan"]:checked')?.value;
                
                if (!email || !selectedPlan) {
                    alert('Please enter your email and select a plan');
                    return;
                }
                
                try {
                    const requestBody = { email, plan: selectedPlan };
                    if (currentUser && currentUser.tokens !== undefined) {
                        requestBody.currentTokens = currentUser.tokens;
                    }

                    const response = await fetch('/.netlify/functions/purchase-tokens', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        // Update logged-in user tokens immediately
                        if (data.isLoggedInUser && currentUser) {
                            currentUser.tokens = data.newTotalTokens;
                            saveAuthState(currentUser);
                            setTimeout(() => refreshTokensFromDB(), 1000);
                        }
                        
                        hideUniversalModal();
                        showUniversalModal('success', {
                            title: 'Purchase Successful!',
                            message: data.message
                        });
                    } else {
                        alert(data.error || 'Purchase failed');
                    }
                } catch (error) {
                    console.error('Purchase error:', error);
                    alert('Purchase failed. Please try again.');
                }
            });
        }
    }
    
    // Auth code modal handlers
    if (type === 'auth-code') {
        const submitBtn = document.getElementById('universal-auth-submit');
        const codeInput = document.getElementById('universal-auth-code');
        
        if (submitBtn && codeInput) {
            submitBtn.setAttribute('data-universal-handler', 'true');
            submitBtn.addEventListener('click', async () => {
                const authCode = codeInput.value.trim();
                if (!authCode || authCode.length !== 8) {
                    alert('Please enter a valid 8-digit code');
                    return;
                }
                
                try {
                    const response = await fetch('/.netlify/functions/auth-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ authCode })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        saveAuthState(data.user);
                        
                        // Refresh token balance from database
                        if (data.user.email && !data.user.email.includes('example.com')) {
                            setTimeout(() => refreshTokensFromDB(), 1000);
                            setTimeout(() => startTokenValidation(), 2000);
                        }
                        
                        hideUniversalModal();
                        showUniversalModal('success', {
                            title: 'Welcome!',
                            message: `You now have ${formatTokenCount(data.user.tokens)} tokens available.`
                        });
                    } else {
                        alert(data.error || 'Invalid or expired login code');
                    }
                } catch (error) {
                    console.error('Auth login error:', error);
                    alert('Login failed. Please try again.');
                }
            });
        }
    }
    
    // Success modal handlers
    if (type === 'success') {
        const okBtn = document.getElementById('universal-success-ok');
        if (okBtn) {
            okBtn.setAttribute('data-universal-handler', 'true');
            okBtn.addEventListener('click', () => {
                hideUniversalModal();
                if (options.onContinue) options.onContinue();
            });
        }
    }
}

function initializeUniversalModal() {
    const modal = document.getElementById('universal-modal');
    const backdrop = document.getElementById('universal-modal-backdrop');
    const closeBtn = document.getElementById('universal-modal-close');
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', hideUniversalModal);
    }
    
    // Backdrop click to close
    if (backdrop) {
        backdrop.addEventListener('click', hideUniversalModal);
    }
    
    // Cancel button handler (delegated)
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('universal-modal-cancel')) {
                hideUniversalModal();
            }
        });
    }
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentModalType) {
            hideUniversalModal();
        }
    });
}

// Replace old modal functions
function showModal(modalType) {
    // Map old modal names to new system
    const modalMap = {
        'login-modal': 'login',
        'tokens-modal': 'tokens',
        'auth-code-modal': 'auth-code'
    };
    
    const newType = modalMap[modalType] || modalType;
    showUniversalModal(newType);
}

function hideModal(modalId) {
    hideUniversalModal();
}

function showWelcomeModal(tokens) {
    showUniversalModal('success', {
        title: 'Welcome!',
        message: `You now have ${formatTokenCount(tokens)} tokens available.`
    });
}

function showPurchaseSuccessModal(message) {
    showUniversalModal('success', {
        title: 'Purchase Successful!',
        message: message
    });
}

function showAuthCodeModal() {
    showUniversalModal('auth-code');
    // Focus the input after modal is shown
    setTimeout(() => {
        const input = document.getElementById('universal-auth-code');
        if (input) input.focus();
    }, 300);
} 