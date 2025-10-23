import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { HotelCarousel } from "@/components/HotelCarousel";
import { streamChat } from "@/lib/chatService";
import { useToast } from "@/hooks/use-toast";
import mastercardLogo from "@/assets/mastercard-logo.svg";

type Message = { 
  role: "user" | "assistant"; 
  content: string;
  hotels?: Hotel[];
};

interface Hotel {
  name: string;
  images: string[];
  price_per_night: { base: number; total: number };
  description: string;
  rating: number;
  reviews: number;
  amenities: string[];
  booking_url: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    let toolCallBuffer: any[] = [];

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMessage],
        onDelta: (chunk) => upsertAssistant(chunk),
        onToolCall: (toolCalls) => {
          toolCallBuffer.push(...toolCalls);
        },
        onDone: () => {
          setIsLoading(false);
          
          // Process tool calls and attach hotels to assistant message
          const hotelData: Hotel[] = [];
          toolCallBuffer.forEach((toolCall) => {
            if (toolCall.function?.name === "hotel_search" && toolCall.function?.arguments) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                if (args.hotels && Array.isArray(args.hotels)) {
                  hotelData.push(...args.hotels);
                }
              } catch (e) {
                console.error("Error parsing tool call:", e);
              }
            }
          });
          
          if (hotelData.length > 0) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, hotels: hotelData } : m
                );
              }
              return prev;
            });
          }
        },
        onError: (error) => {
          setIsLoading(false);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Chat error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden h-[calc(100vh-40px)]">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
            <img src={mastercardLogo} alt="Mastercard" className="w-16 h-16 object-contain" />
            <div>
              <h3 className="font-semibold">Hotel Search Assistant</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Powered by Mastercard
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                  <Hotel className="w-10 h-10 text-primary" />
                </div>
                <p className="mb-4 text-lg font-semibold">👋 Hi! I'm your hotel search assistant.</p>
                <p className="text-xs">
                  Try: "Find hotels in Dubai from Oct 10-12 under $150/night"
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx}>
                <ChatMessage role={msg.role} content={msg.content} />
                {msg.hotels && msg.hotels.length > 0 && (
                  <div className="mt-4">
                    <HotelCarousel hotels={msg.hotels} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-muted/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about hotels..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
