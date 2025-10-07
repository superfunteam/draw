// Simple test script to verify Sora 2 API endpoint
// Run with: node test-sora-api.js

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
    console.error('Please set OPENAI_API_KEY environment variable');
    process.exit(1);
}

async function testSoraAPI() {
    console.log('Testing Sora 2 API endpoint...\n');
    
    try {
        // Create FormData for multipart/form-data request
        const FormData = require('form-data');
        const formData = new FormData();
        
        formData.append('prompt', 'A cute cat playing with a ball of yarn');
        formData.append('model', 'sora-2');
        formData.append('size', '1280x720');
        formData.append('seconds', '4');
        
        console.log('Request parameters:');
        console.log('- prompt: A cute cat playing with a ball of yarn');
        console.log('- model: sora-2');
        console.log('- size: 1280x720');
        console.log('- seconds: 4 (valid values: 4, 8, or 12)\n');
        
        // Step 1: Create video generation job
        console.log('Step 1: Creating video generation job...');
        const createResponse = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('Error creating video:', createResponse.status, errorText);
            return;
        }
        
        const videoJob = await createResponse.json();
        console.log('Video job created successfully!');
        console.log('Job ID:', videoJob.id);
        console.log('Status:', videoJob.status);
        console.log('Model:', videoJob.model);
        console.log('\nFull response:', JSON.stringify(videoJob, null, 2));
        
        // Step 2: Check status once (not polling for completion in this test)
        console.log('\nStep 2: Checking video status...');
        const statusResponse = await fetch(`https://api.openai.com/v1/videos/${videoJob.id}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!statusResponse.ok) {
            const errorText = await statusResponse.text();
            console.error('Error checking status:', statusResponse.status, errorText);
            return;
        }
        
        const statusData = await statusResponse.json();
        console.log('Current status:', statusData.status);
        console.log('Progress:', statusData.progress || 0, '%');
        console.log('\nFull status response:', JSON.stringify(statusData, null, 2));
        
        console.log('\n✅ API endpoint test successful!');
        console.log('Note: Video generation takes several minutes. This test only verifies the endpoint is working.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }
}

testSoraAPI();

