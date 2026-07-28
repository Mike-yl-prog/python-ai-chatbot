from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOllama(
    model="llama3.2",
    temperature=0.7
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant."),
    ("user", "{question}")
])

chain = prompt | llm

response = chain.invoke({
    "question": "Why is building projects better than watching tutorials?"
})

print(response.content)