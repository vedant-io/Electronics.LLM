const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
    try {
        console.log('--- Auth Tests ---');
        // 1. Register
        const username = `testuser_${Date.now()}`;
        console.log(`Registering user: ${username}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username,
            password: 'password123',
            role: 'student'
        });
        const token = regRes.data.token;
        console.log('✓ Registration successful. Token received.');

        const headers = { 'x-auth-token': token };

        console.log('\n--- Phase 2: Normalization & Formatter Tests ---');
        
        // Test A: Normalization (Case Insensitivity)
        // Request 1: "How to make a Gas Leak Detector"
        const topic1 = "How to make a Gas Leak Detector";
        // Request 2: "how to make gas leak detector"
        const topic2 = "how to make gas leak detector";
        
        console.log(`1. Sending Request A: "${topic1}"`);
        const start1 = Date.now();
        await axios.post(`${API_URL}/agents/main-agent`, { project_topic: topic1 }, { headers });
        const dur1 = Date.now() - start1;
        console.log(`   Took: ${dur1}ms`);

        console.log(`2. Sending Request B: "${topic2}" (Should be CACHE HIT)`);
        const start2 = Date.now();
        const res2 = await axios.post(`${API_URL}/agents/main-agent`, { project_topic: topic2 }, { headers });
        const dur2 = Date.now() - start2;
        console.log(`   Took: ${dur2}ms`);

        if (dur2 < dur1) console.log('✓ Cache Logic is Smart (Normalized Input!)');
        else console.log('? Warning: Cache might not have hit, or network variance.');

        // Test B: Formatter Check
        console.log(`3. Inspecting Output Format...`);
        const output = res2.data;
        
        let success = true;
        // Check if description_agent_output is an Object (parsed), not a string
        if (output.description_agent_output && typeof output.description_agent_output === 'object') {
             console.log('✓ description_agent_output is properly Parsed JSON Object.');
        } else {
             console.log('❌ description_agent_output is still a String/Raw!');
             success = false;
        }

        // Check wiring_agent_output
        if (output.wiring_agent_output) {
             console.log('Input wiring_agent_output type:', typeof output.wiring_agent_output);
             if (typeof output.wiring_agent_output === 'string' && output.wiring_agent_output.includes('[Event')) {
                 console.log('❌ wiring_agent_output still contains raw [Event... garbage!');
                 success = false;
             } else {
                 console.log('✓ wiring_agent_output seems clean (no raw Event tags).');
             }
        }

        if(success) console.log('✨ GOD FORMATTER IS WORKING!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
};

runTests();
