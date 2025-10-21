import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful hotel search assistant with access to hotel booking data. 
Your role is to help users find hotels based on their requirements (destination, dates, price range, amenities, ratings).

When a user asks about hotels, respond naturally AND use the hotel_search function to provide actual results.

Guidelines:
- Be friendly and conversational
- Ask clarifying questions if information is missing
- Always use the hotel_search function when providing recommendations
- Explain the results in a natural, helpful way
- Focus on matching user preferences (price, location, amenities, ratings)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "hotel_search",
              description: "Search for hotels based on user criteria and return structured hotel data",
              parameters: {
                type: "object",
                properties: {
                  hotels: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        images: {
                          type: "array",
                          items: { type: "string" }
                        },
                        price_per_night: {
                          type: "object",
                          properties: {
                            base: { type: "number" },
                            total: { type: "number" }
                          }
                        },
                        description: { type: "string" },
                        rating: { type: "number" },
                        reviews: { type: "number" },
                        amenities: {
                          type: "array",
                          items: { type: "string" }
                        },
                        booking_url: { type: "string" }
                      },
                      required: ["name", "images", "price_per_night", "description", "rating", "reviews", "amenities", "booking_url"]
                    }
                  }
                },
                required: ["hotels"]
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Hotel chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
