import dotenv from 'dotenv';


dotenv.config();

const FAL_KEY = process.env.FAL_AI_API_KEY;

if (!FAL_KEY) {
    console.error('❌ FAL_AI_API_KEY is missing in .env');
    process.exit(1);
}

console.log('✅ Found FAL_AI_API_KEY:', FAL_KEY.substring(0, 5) + '...');

async function testFal() {
    console.log('🚀 Starting Fal.ai test...');
    try {
        const response = await fetch('https://queue.fal.run/fal-ai/flux-pro/kontext/max/text-to-image', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: "A cute cat coding on a laptop, cartoon style",
                image_size: "square_hd",
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                enable_safety_checker: true
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Request Failed: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('✅ Request submitted. Full Response:', JSON.stringify(data, null, 2));

        // Poll for status
        const requestId = data.request_id;
        let status = 'IN_QUEUE';

        while (status !== 'COMPLETED' && status !== 'FAILED') {
            await new Promise(r => setTimeout(r, 1000));
            const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/kontext/max/text-to-image/requests/${requestId}`, {
                headers: { 'Authorization': `Key ${FAL_KEY}` }
            });
            const statusText = await statusRes.text();
            // console.log('Raw Status Response:', statusText);
            const statusData = JSON.parse(statusText);
            status = statusData.status;
            console.log('Status:', status);

            if (status === 'FAILED') {
                console.error('❌ Generation failed:', statusData.error);
                return;
            }

            if (status === 'COMPLETED') {
                console.log('✅ Generation successful!');
                console.log('Image URL:', statusData.images[0].url);
                return;
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFal();
