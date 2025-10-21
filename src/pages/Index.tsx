import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { HotelCard } from "@/components/HotelCard";
import { streamChat } from "@/lib/chatService";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

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
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hotels]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setHotels([]);

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
          
          // Process tool calls
          toolCallBuffer.forEach((toolCall) => {
            if (toolCall.function?.name === "hotel_search" && toolCall.function?.arguments) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                if (args.hotels && Array.isArray(args.hotels)) {
                  setHotels(args.hotels);
                }
              } catch (e) {
                console.error("Error parsing tool call:", e);
              }
            }
          });
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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Hotel Search Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Powered by Mastercard
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6 h-full">
          {/* Hotel Results */}
          <div className="order-2 lg:order-1">
            {hotels.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Available Hotels
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({hotels.length} results)
                  </span>
                </h2>
                <div className="grid gap-4">
                  {hotels.map((hotel, idx) => (
                    <div
                      key={idx}
                      className="animate-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <HotelCard hotel={hotel} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                    <Hotel className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Start Your Hotel Search
                  </h3>
                  <p className="text-muted-foreground">
                    Ask me about hotels in any destination, and I'll help you find
                    the perfect place to stay!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="order-1 lg:order-2 flex flex-col bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden h-[600px] lg:h-auto">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold">Chat with Assistant</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ask about destinations, dates, prices, or amenities
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p className="mb-4">👋 Hi! I'm your hotel search assistant.</p>
                  <p className="text-xs">
                    Try: "Find hotels in Dubai from Oct 10-12 under $150/night"
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
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
    </div>
  );
};

export default Index;
