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

// Function to attach button listeners to a draw group
function attachButtonListeners(drawGroup) {
    // Remove any existing listeners by cloning and replacing the buttons
    const drawButton = drawGroup.querySelector('.actions .draw');
    const aiButton = drawGroup.querySelector('.actions .ai');
    
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
                
                // Get all draw buttons
                const buttons = Array.from(document.querySelectorAll('.actions .draw:not(:disabled)')); // Only non-disabled
                console.log('Total non-disabled buttons found for Draw All:', buttons.length);
                
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
                    savePdfBanner.classList.remove('opacity-0', 'pointer-events-none');
                }
                return;
            }
            
            // Regular draw button click handling (individual button)
            // Clear countdown if one was running on this button
            if (newDrawButton.dataset.countdownIntervalId) {
                clearInterval(parseInt(newDrawButton.dataset.countdownIntervalId));
                delete newDrawButton.dataset.countdownIntervalId;
            }

            const textarea = drawGroup.querySelector('textarea');
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
            
            // Get preset and define prompt rules
            const presetSelect = document.getElementById('preset');
            let promptPrefix = "As a child's coloring book artist, draw a simple coloring book sheet. DO NOT include any text in the image unless explicitly instructed to do so. DO NOT use any colors other than black and white, never use color."; // Default
            if (presetSelect) {
                switch (presetSelect.value) {
                    case "Photo":
                        promptPrefix = "Create a realistic 4k photo with a short range portrait lens that tells a story and uses bright colors";
                        break;
                    case "Coloring Book":
                    default:
                        promptPrefix = "As a child's coloring book artist, draw a simple coloring book sheet. DO NOT include any text in the image unless explicitly instructed to do so. DO NOT use any colors other than black and white, never use color.";
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
                // Call ChatGPT API for image generation
                console.log('Making image generation API call...');
                const response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-image-1",
                        size: imageSize,
                        quality: qualityValue,
                        output_format: "png",
                        prompt: `${promptPrefix} that shows: ${prompt}.`
                    })
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
                
                if (data.data && data.data[0] && data.data[0].b64_json) {
                    // Hide both empty message and loader
                    emptyMessage.classList.add('hidden');
                    loader.classList.add('hidden');

                    // Create new image as direct child of canvas
                    const img = document.createElement('img');
                    img.className = 'w-full h-full object-contain api-image';
                    img.src = `data:image/png;base64,${data.data[0].b64_json}`;
                    img.alt = prompt;
                    canvas.appendChild(img);

                    // Log the revised prompt for reference
                    console.log('Revised prompt:', data.data[0].revised_prompt);
                    
                    // Show the save PDF banner
                    const savePdfBanner = document.querySelector('.save-pdf-banner');
                    if (savePdfBanner) {
                        savePdfBanner.classList.remove('opacity-0', 'pointer-events-none');
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
}

// Function to create a draw group HTML
function createDrawGroup(index) {
    // If we don't have a template yet, create one from the existing HTML
    if (!drawGroupTemplate) {
        const existingGroup = document.querySelector('.draw-group');
        if (existingGroup) {
            drawGroupTemplate = existingGroup.cloneNode(true);
            // Remove any existing event listeners from the template
            const buttons = drawGroupTemplate.querySelectorAll('button');
            buttons.forEach(button => {
                button.replaceWith(button.cloneNode(true));
            });
        } else {
            console.error('No draw group template found in HTML');
            return null;
        }
    }
    
    // Clone the template
    const template = drawGroupTemplate.cloneNode(true);
    
    // Update IDs
    template.id = `draw-group-${index}`;
    const canvas = template.querySelector('.canvas');
    canvas.id = `canvas-${index}`;
    
    // Reset textarea value
    const textarea = template.querySelector('textarea');
    textarea.value = '';
    
    // Attach button listeners to the new group
    attachButtonListeners(template);
    
    return template;
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

// Initial attachment of button listeners to existing groups
document.querySelectorAll('.draw-group').forEach(group => {
    attachButtonListeners(group);
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

    if (currentLightboxImageIndex === -1) { // Should not happen if called correctly
        console.error("Clicked image not found in galleryApiImages");
        return;
    }

    lightboxImage.src = galleryApiImages[currentLightboxImageIndex].src;
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling while lightbox is open
    updateLightboxNav();
}

function closeLightbox() {
    lightboxModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    galleryApiImages = [];
    currentLightboxImageIndex = 0;
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

document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('hidden')) { // If lightbox is open
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        } else if (e.key === 'ArrowLeft') {
            showPrevImage();
        }
    }
});

// Tokens Modal Functionality
const tokensLink = document.querySelector('.tokens');
const tokensModal = document.getElementById('tokens-modal');
const tokensModalBackdrop = document.getElementById('tokens-modal-backdrop');
const tokensModalPanel = document.getElementById('tokens-modal-panel');
const tokensModalCancelButton = document.getElementById('tokens-modal-cancel-button');
const tokensModalBuyButton = document.getElementById('tokens-modal-buy-button');

function openTokensModal() {
    if (!tokensModal || !tokensModalBackdrop || !tokensModalPanel) return;

    tokensModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Backdrop: Apply target state and transition classes
    tokensModalBackdrop.classList.remove('opacity-0');
    tokensModalBackdrop.classList.add('opacity-100', 'ease-out', 'duration-300');

    // Panel: Reset to ensure "from" state is clean, then apply transition and "to" state
    tokensModalPanel.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100'); // remove any "to" classes
    tokensModalPanel.classList.add('opacity-0', 'translate-y-12', 'sm:translate-y-12', 'sm:scale-95'); // ensure "from" classes
    
    tokensModalPanel.classList.add('ease-out', 'duration-300'); // Add transition behavior

    requestAnimationFrame(() => {
        // Apply "to" state, triggering transition
        tokensModalPanel.classList.remove('opacity-0', 'translate-y-12', 'sm:translate-y-12', 'sm:scale-95');
        tokensModalPanel.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
    });

    // Clean up transition classes after animation
    setTimeout(() => {
        tokensModalBackdrop.classList.remove('ease-out', 'duration-300');
        tokensModalPanel.classList.remove('ease-out', 'duration-300');
    }, 300); 
}

function closeTokensModal() {
    if (!tokensModal || !tokensModalBackdrop || !tokensModalPanel) return;

    document.body.style.overflow = '';

    // Add transition classes before changing to "from" state
    tokensModalBackdrop.classList.add('ease-in', 'duration-200');
    tokensModalPanel.classList.add('ease-in', 'duration-200');

    // Trigger transition to "from" (hidden) state
    tokensModalBackdrop.classList.remove('opacity-100');
    tokensModalBackdrop.classList.add('opacity-0');

    tokensModalPanel.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
    tokensModalPanel.classList.add('opacity-0', 'translate-y-12', 'sm:translate-y-12', 'sm:scale-95');

    setTimeout(() => {
        tokensModal.classList.add('hidden');
        // Reset for next open: remove transition classes. "From" state is already set.
        tokensModalBackdrop.classList.remove('ease-in', 'duration-200');
        tokensModalPanel.classList.remove('ease-in', 'duration-200');
    }, 200); 
}

if (tokensLink) {
    tokensLink.addEventListener('click', (e) => {
        e.preventDefault();
        openTokensModal();
    });
}

if (tokensModalCancelButton) {
    tokensModalCancelButton.addEventListener('click', closeTokensModal);
}

if (tokensModalBuyButton) {
    tokensModalBuyButton.addEventListener('click', (e) => {
        e.target.textContent = "Coming Soon";
        // Optionally disable the button after click
        // e.target.disabled = true;
    });
}

if (tokensModalBackdrop) {
    tokensModalBackdrop.addEventListener('click', closeTokensModal);
}

// Modify existing keydown listener to also handle tokens modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
            closeLightbox();
        } else if (tokensModal && !tokensModal.classList.contains('hidden')) {
            closeTokensModal();
        }
    } 
    // Keep lightbox arrow navigation if lightbox is open
    if (lightboxModal && !lightboxModal.classList.contains('hidden')) {
      if (e.key === 'ArrowRight') {
          showNextImage();
      } else if (e.key === 'ArrowLeft') {
          showPrevImage();
      }
    }
}); 