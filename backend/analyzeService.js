import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

let groq;
function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error(".env not found or GROQ_API_KEY missing");
  if (!groq) groq = new Groq({ apiKey });
  return groq;
}

const PROMPTS = {
    review: (code) => `
You are an expert React and JavaScript code reviewer.

Analyze the following code and provide:
1. **Bug Detection** — List all bugs, errors, or anti-patterns found
2. **Code Explanation** — Explain what the code does clearly
3. **Optimized Code** — Provide a refactored, optimized version
4. **Best Practices** — Mention any best practices violated

Format your response using markdown with clear sections.
Keep explanations concise and developer-focused.

Code to analyze:
\`\`\`javascript
${code.slice(0, 3000)}
\`\`\`
`,

    bugs: (code) => `
You are a JavaScript/React bug detector.

Find ALL bugs, issues, and potential runtime errors in this code.
For each bug:
- State the line or pattern with the bug
- Explain why it's a bug
- Provide the fix

Format as a numbered list with clear headings.

Code:
\`\`\`javascript
${code.slice(0, 3000)}
\`\`\`
`,

    optimize: (code) => `
You are a JavaScript performance expert.

Rewrite the following code with:
- Better performance
- Cleaner structure
- Modern JS/React patterns
- Reduced complexity

Show the optimized code with brief comments explaining key improvements.

Original code:
\`\`\`javascript
${code.slice(0, 3000)}
\`\`\`
`,

    explain: (code) => `
You are a senior developer explaining code to a junior developer.

Explain this code clearly:
- What it does overall
- How each part works
- Any important patterns or concepts used

Keep it simple, clear, and educational.

Code:
\`\`\`javascript
${code.slice(0, 3000)}
\`\`\`
`,
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export async function analyzeCode(code, mode = "review", res, retries = 3) {
    // sanitize control characters that break JSON parsing
    const safeCode = code.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    const prompt = PROMPTS[mode] ? PROMPTS[mode](safeCode) : PROMPTS.review(safeCode);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const stream = await getGroq().chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                stream: true,
                max_tokens: 1500,
                temperature: 0.3,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                res.write(content);
            }

            res.end();
            return;
        } catch (err) {
            const isRateLimit = err?.status === 429;
            if (isRateLimit && attempt < retries) {
                console.warn(`Rate limited, retrying (${attempt}/${retries})...`);
                await sleep(1000 * attempt);
            } else {
                throw err;
            }
        }
    }
}