import os
import re
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Prompts ────────────────────────────────────────────────────────────────

def get_prompt(code: str, mode: str) -> str:
    safe_code = code[:3000]  # token optimization — same as JS slice(0, 3000)

    prompts = {
        "review": f"""You are an expert React and JavaScript code reviewer.

Analyze the following code and provide:
1. **Bug Detection** — List all bugs, errors, or anti-patterns found
2. **Code Explanation** — Explain what the code does clearly
3. **Optimized Code** — Provide a refactored, optimized version
4. **Best Practices** — Mention any best practices violated

Format your response using markdown with clear sections.
Keep explanations concise and developer-focused.

Code to analyze:
```javascript
{safe_code}
```""",

        "bugs": f"""You are a JavaScript/React bug detector.

Find ALL bugs, issues, and potential runtime errors in this code.
For each bug:
- State the line or pattern with the bug
- Explain why it's a bug
- Provide the fix

Format as a numbered list with clear headings.

Code:
```javascript
{safe_code}
```""",

        "optimize": f"""You are a JavaScript performance expert.

Rewrite the following code with:
- Better performance
- Cleaner structure
- Modern JS/React patterns
- Reduced complexity

Show the optimized code with brief comments explaining key improvements.

Original code:
```javascript
{safe_code}
```""",

        "explain": f"""You are a senior developer explaining code to a junior developer.

Explain this code clearly:
- What it does overall
- How each part works
- Any important patterns or concepts used

Keep it simple, clear, and educational.

Code:
```javascript
{safe_code}
```""",
    }

    return prompts.get(mode, prompts["review"])


# ── Sanitize control characters (same fix as JS version) ───────────────────

def sanitize_code(code: str) -> str:
    # remove bad control characters that break JSON / LLM input
    return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', code)


# ── Groq client (lazy — loads after dotenv) ────────────────────────────────

_groq_client = None

def get_groq():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is missing. Check your .env file.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


# ── Streaming generator with retry logic ───────────────────────────────────

async def analyze_code(code: str, mode: str = "review", retries: int = 3):
    safe_code = sanitize_code(code)
    prompt = get_prompt(safe_code, mode)

    for attempt in range(1, retries + 1):
        try:
            stream = get_groq().chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                max_tokens=1500,
                temperature=0.3,
            )

            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                yield content  # stream token by token to frontend

            return  # success — exit retry loop

        except Exception as err:
            is_rate_limit = getattr(err, "status_code", None) == 429

            if is_rate_limit and attempt < retries:
                wait = 1 * attempt  # exponential backoff: 1s, 2s
                print(f"Rate limited, retrying ({attempt}/{retries}) in {wait}s...")
                time.sleep(wait)
            else:
                raise err