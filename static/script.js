document.addEventListener("DOMContentLoaded", () => {

    const log = document.getElementById("log");
    const input = document.getElementById("input");
    const sendBtn = document.getElementById("send");
    const modelDisplay = document.getElementById("model");
    const empty = document.getElementById("empty");

    let selectedModel = "gemma3:4b";

    // Store conversation history
    const messages = [];


    // Load available models from Flask
    async function loadModels() {
        try {
            const res = await fetch("/api/models");

            if (!res.ok) {
                throw new Error("Failed to load models");
            }

            const data = await res.json();

            if (data.models && data.models.length > 0) {

                selectedModel = data.models[0];

                // Update the display span
                if (modelDisplay) {
                    modelDisplay.textContent = selectedModel;
                }
            }

        } catch (err) {
            console.error("Could not fetch models:", err);

            if (modelDisplay) {
                modelDisplay.textContent = "gemma3:4b";
            }
        }
    }


    loadModels();



    async function sendMessage() {

        const text = input.value.trim();

        if (!text) return;


        // Remove welcome message
        if (empty) {
            empty.remove();
        }


        // Display user message
        const userMsg = document.createElement("div");
        userMsg.className = "msg user";
        userMsg.textContent = "You: " + text;
        log.appendChild(userMsg);


        input.value = "";


        // Add user message to history
        messages.push({
            role: "user",
            content: text
        });


        // Create bot message container
        const botMsg = document.createElement("div");
        botMsg.className = "msg bot";
        botMsg.textContent = "AI: ";

        log.appendChild(botMsg);

        log.scrollTop = log.scrollHeight;



        try {

            sendBtn.disabled = true;


            const response = await fetch("/api/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    model: selectedModel,

                    messages: messages

                })

            });



            if (!response.ok) {

                const error = await response.text();

                botMsg.textContent += 
                    `[Error ${response.status}: ${error}]`;

                return;
            }



            const reader = response.body.getReader();

            const decoder = new TextDecoder();

            let fullReply = "";



            while (true) {

                const {done, value} = await reader.read();


                if (done) break;


                const chunk = decoder.decode(value, {
                    stream: true
                });


                /*
                  Supports normal text streaming.
                  If Flask sends JSON chunks,
                  it will still display them.
                */

                try {

                    const data = JSON.parse(chunk);


                    if (data.message?.content) {

                        fullReply += data.message.content;

                        botMsg.textContent =
                            "AI: " + fullReply;

                    } 
                    else {

                        fullReply += chunk;

                        botMsg.textContent =
                            "AI: " + fullReply;
                    }


                } catch {

                    fullReply += chunk;

                    botMsg.textContent =
                        "AI: " + fullReply;

                }


                log.scrollTop = log.scrollHeight;

            }



            // Save AI response to memory

            messages.push({

                role: "assistant",

                content: fullReply

            });



        } catch (err) {

            botMsg.textContent += 
                " [Network Error: " + err.message + "]";

        }


        finally {

            sendBtn.disabled = false;

        }

    }



    // Send button
    sendBtn.addEventListener(
        "click",
        sendMessage
    );


    // Enter sends, Shift+Enter makes newline
    input.addEventListener(
        "keydown",
        (e) => {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                sendMessage();

            }

        }
    );

});