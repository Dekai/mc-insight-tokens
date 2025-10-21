type Message = { role: "user" | "assistant"; content: string };

interface StreamChatParams {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onToolCall?: (toolCall: any) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat({
  messages,
  onDelta,
  onToolCall,
  onDone,
  onError,
}: StreamChatParams) {
  try {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-chat`;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (resp.status === 402) {
        throw new Error("Payment required. Please add credits to your workspace.");
      }
      throw new Error(`Failed to start chat stream: ${resp.statusText}`);
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          
          if (delta?.content) {
            onDelta(delta.content);
          }
          
          if (delta?.tool_calls) {
            onToolCall?.(delta.tool_calls);
          }
        } catch (e) {
          // Incomplete JSON - put it back and wait
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) onDelta(delta.content);
          if (delta?.tool_calls) onToolCall?.(delta.tool_calls);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Chat stream error:", error);
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}
