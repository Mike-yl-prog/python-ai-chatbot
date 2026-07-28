def generate():
    try:  
      print("Sending request to ollama...") 


      with requests.post(
         f"{OLLAMA_BASE}/api/generate",
         json = {"model": model, 
                 "messages": messages, 
                 "stream": True},
         stream = True,
         timeout =300, 
      ) as r:

         print("ollama status:", r.status_code)
         
         

         r.raise_for_status()

         for line in r.iter_lines():
              if  not line:
                continue
         chunk = json.loads(line)
         token = chunk.get("message", {}).get("content", "")
         if token:
            yield token
    except requests.RequestException as e:
     yield f"\n\n[error: could not reach the model -{e}]"        
