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

// Update UI based on auth state
function updateAuthUI() {
    const tokenContainers = document.querySelectorAll('.tokens');
    
    tokenContainers.forEach(container => {
        const buyBtn = container.querySelector('.token-buy-btn');
        const authBtn = container.querySelector('.token-auth-btn');
        
        if (currentUser && currentUser.tokens !== undefined) {
            // User is logged in - show token count in auth button
            const tokenCount = currentUser.tokens.toLocaleString();
            authBtn.textContent = tokenCount;
            authBtn.onclick = () => {
                alert(`You have ${tokenCount} tokens remaining.`);
            };
        } else {
            // User not logged in - show login button
            authBtn.textContent = 'Login';
            authBtn.onclick = () => {
                // Prompt for auth code
                const authCode = prompt('Enter your 8-digit login code:');
                if (authCode && authCode.length === 8) {
                    loginWithAuthCode(authCode);
                }
            };
        }
        
        // Buy button always opens the tokens modal
        buyBtn.onclick = () => {
            const modal = document.getElementById('tokens-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
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
        
        // Attempt login
        loginWithAuthCode(authCode);
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
            
            // Show success message
            alert(`Welcome back! You have ${data.user.tokens} tokens available.`);
        } else {
            alert(data.error || 'Invalid or expired login code');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Failed to log in. Please try again.');
    }
}

// Check if user has sufficient tokens, show modal if not
function checkTokensBeforeDraw() {
    if (!currentUser) {
        // Not logged in, show tokens modal
        const modal = document.getElementById('tokens-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        return false;
    }
    
    if (currentUser.tokens <= 0) {
        // No tokens left, show modal
        alert('You have no tokens remaining. Please purchase more tokens to continue.');
        const modal = document.getElementById('tokens-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        return false;
    }
    
    return true;
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
            return false;
        }
    } catch (error) {
        console.error('Token deduction error:', error);
        return false;
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAuthState();
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
            let promptPrefix = "As a child's coloring book artist, draw a simple coloring book sheet. DO NOT include any text in the image unless explicitly instructed to do so. DO NOT use any colors other than black and white, never use color. Here is the prompt:"; // Default
            if (presetSelect) {
                switch (presetSelect.value) {
                    case "Photo":
                        promptPrefix = "Create a realistic 4k photo with a short range portrait lens that tells a story and uses bright colors for this prompt:";
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
                input: `Act as a coloring book artist. Develop a storyline that can be illustrated in a coloring book based on the given story of "${prompt}". The storyline should be split into ${numDrawings} chapters, each chapter describing a specific and unique scene, suitable for all ages. Keep each chapter to exactly 25 words or less.
                
                Instead of naming a charater, use a repeated visual descriptions to maintain consistency. Our prompts will be turned into images, so instead of the name "Bob", say, for example sake, "the teen boy with curly hair" in each chapter. If any visual descriptions are provided in the prompt, reuse them as much as possible. If there are no visual descriptions, make one up (but make sure to use it in each chapter)

Format each chapter as follows:
Chapter 1:
[Two sentences or less, reusing characters by a matching visual descriptions]

Chapter 2:
[Two sentences or less, reusing characters by a matching visual descriptions]

And so on. Do not use markdown formatting, asterisks, or any special characters. Keep the text clean and simple.`
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
            
            // Split the story into chapters
            const chapters = storyText.split(/Chapter \d+:/).filter(chapter => chapter.trim());
            
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

// Initialize the Tokens Modal using the new system
if (typeof initializeModal === 'function') {
    const tokensModalInstance = initializeModal('tokens-modal', '.tokens');
    // The initializeModal function in modals.js now handles adding to a global list for Escape key handling.
} else {
    console.error('initializeModal function not found. Ensure modals.js is loaded correctly.');
}


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
            const response = await fetch('/.netlify/functions/purchase-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    plan: selectedPlan
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Show success message
                alert(data.message);
                
                // Close modal
                const modal = document.getElementById('tokens-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                
                // Clear form
                document.getElementById('user-email').value = '';
            } else {
                alert(data.error || 'Failed to process purchase');
            }
        } catch (error) {
            console.error('Purchase error:', error);
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