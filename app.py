from flask import (
    Flask,
    render_template,
    jsonify,
    request,
    Response,
    stream_with_context,
)
import requests 
import json

OLLAMA_BASE = "http://localhost:11434"

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/models")
def list_models():
 try:  
   r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout= 5)
   r.raise_for_status()
   models = [m["name"] for m in r.json().get("models",[])]
   return jsonify({"models": models})
 except requests.RequestException:
      return jsonify({"models":[], "error": f"Could not reach ollama at {OLLAMA_BASE}"})


@app.route("/api/chat", methods =["POST"])
def chat():
   body = request.get_json(force=True)
   model = body.get("model")
   messages = body.get("messages", [])
   
   print(f"DEBUG: Received model='{model}', messages={messages}")

   if not model:
      return jsonify({"error": "No model selected"}), 400

   def generate():
    try:
        print("Sending request to ollama")

        with requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={
                "model": model,
                "prompt": messages[-1]["content"],
                "stream": True
            },
            stream=True,
            timeout=300,
        ) as r:

            print("ollama status:", r.status_code)
            r.raise_for_status()

            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue

                print("RAW:", line)

                chunk = json.loads(line)

                token = chunk.get("response", "")

                if token:
                    yield token

    except requests.RequestException as e:
        print("OLLAMA ERROR:", e)
        yield f"\n\n[error: {e}]"

        
   return Response(
        stream_with_context(generate()),
        mimetype="text/plain",
    )    
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
