import 'dotenv/config';

const ACCESS_TOKEN = process.env.VITE_FACEBOOK_ACCESS_TOKEN;
const PAGE_ID = '800264876172017'; // The ID from the logs

async function verifyPage() {
    try {
        console.log(`Verifying Page ID: ${PAGE_ID}`);

        // 1. Get Page Details
        const response = await fetch(`https://graph.facebook.com/v24.0/${PAGE_ID}?fields=name,access_token,tasks,is_published&access_token=${ACCESS_TOKEN}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching page:', JSON.stringify(data.error, null, 2));
            return;
        }

        console.log('Page Details:');
        console.log(`- Name: ${data.name}`);
        console.log(`- Published: ${data.is_published}`);
        console.log(`- Tasks: ${JSON.stringify(data.tasks)}`);
        console.log(`- Has Access Token: ${!!data.access_token}`);

        if (!data.tasks || !data.tasks.includes('ADVERTISE')) {
            console.error('WARNING: User does not have ADVERTISE permission on this page!');
        } else {
            console.log('SUCCESS: User has ADVERTISE permission.');
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

verifyPage();
