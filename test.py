from ollama import chat

response = chat(
    model="llama3.2:latest",
    messages=[
        {
            "role": "user",
            "content": "Why is building projects better than watching tutorials?"
        }
    ]
)

print(response.message.content)