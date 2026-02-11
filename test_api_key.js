
const OPENROUTER_API_KEY = "[REDACTED]";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function testApiKey() {
    try {
        console.log("Testing OpenRouter API Key...");
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mentorgpt.app",
                "X-Title": "MentorGPT"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "user", content: "Hello, are you working?" }
                ],
                max_tokens: 10
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("API Key is working!");
            console.log("Response:", data.choices[0]?.message?.content);
        } else {
            const error = await response.text();
            console.error("API Key failed with status:", response.status);
            console.error("Error details:", error);
        }
    } catch (error) {
        console.error("An error occurred during testing:", error);
    }
}

testApiKey();
