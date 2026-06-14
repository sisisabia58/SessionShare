/**
 * SessionShare Extension Injected Script
 * Runs in target page context to patch fetch and bypass model denylist restrictions.
 */
(function () {
  const nativeFetch = window.fetch;

  window.fetch = async function (resource, options) {
    const url = typeof resource === 'string' ? resource : resource?.url;

    // Check if the request is to ChatGPT conversation routes
    if (url && (url.includes('/backend_api/conversation') || url.includes('/backend_api/f/conversation'))) {
      try {
        const response = await nativeFetch.apply(this, arguments);
        if (!response.ok || !response.body) {
          return response;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/event-stream')) {
          return response;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        // Create a custom ReadableStream to intercept chunks on the fly
        const customStream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }

                const chunkText = decoder.decode(value, { stream: true });
                let modifiedText = chunkText;

                // Detect model switcher deny trigger in the SSE stream
                if (chunkText.includes('model_switcher_deny')) {
                  console.log("SessionShare Interceptor: Blocked model slug detected. Sanitizing stream...");
                  
                  // Split chunk into SSE event lines
                  const lines = chunkText.split('\n');
                  const modifiedLines = lines.map(line => {
                    if (line.startsWith('data: ')) {
                      const jsonStr = line.substring(6).trim();
                      if (jsonStr === '[DONE]') return line;
                      
                      try {
                        const payload = JSON.parse(jsonStr);
                        
                        // Clean up model switcher restrictions inside metadata
                        if (payload.message && payload.message.metadata) {
                          const metadata = payload.message.metadata;
                          if (metadata.model_switcher_deny) {
                            metadata.model_switcher_deny = [];
                            
                            // Override the restricted model slug with default fallback model
                            metadata.model_slug = "gpt-4o"; 
                            if (payload.message.model_slug) {
                              payload.message.model_slug = "gpt-4o";
                            }
                          }
                        }
                        
                        return `data: ${JSON.stringify(payload)}`;
                      } catch (e) {
                        return line; // Skip if invalid JSON
                      }
                    }
                    return line;
                  });
                  modifiedText = modifiedLines.join('\n');
                }

                controller.enqueue(encoder.encode(modifiedText));
              }
            } catch (err) {
              controller.error(err);
            }
          }
        });

        // Return a fresh response with the custom hijacked stream
        return new Response(customStream, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });

      } catch (err) {
        console.error("SessionShare fetch interceptor error:", err);
      }
    }

    return nativeFetch.apply(this, arguments);
  };

  console.log("SessionShare fetch interceptor registered.");
})();
