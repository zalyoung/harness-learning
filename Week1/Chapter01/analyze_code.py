import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

def read_code_snippet(filepath: str) -> str:
    with open(filepath, "r") as f:
        return f.read()

def analyze_code(client: OpenAI, code: str) -> str:
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[
            {
                "role": "system",
                "content": "You are a senior software engineer. Analyze the provided code snippet thoroughly and explain what it does, its key design patterns, potential issues, and suggestions for improvement. Be concise but comprehensive.",
            },
            {
                "role": "user",
                "content": f"Please analyze and interpret the following code:\n\n```go\n{code}\n```",
            },
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content

def main():
    load_dotenv()
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: DEEPSEEK_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    code_filepath = os.path.join(script_dir, "code_snippet.md")
    code = read_code_snippet(code_filepath)

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    print("Analyzing code snippet...\n")
    analysis = analyze_code(client, code)
    print(analysis)

if __name__ == "__main__":
    main()
