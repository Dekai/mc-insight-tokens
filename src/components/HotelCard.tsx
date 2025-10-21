import { Star, MapPin, Wifi, Coffee, Utensils, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Hotel {
  name: string;
  images: string[];
  price_per_night: {
    base: number;
    total: number;
  };
  description: string;
  rating: number;
  reviews: number;
  amenities: string[];
  booking_url: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  "Wi-Fi": <Wifi className="w-4 h-4" />,
  "WiFi": <Wifi className="w-4 h-4" />,
  "Pool": <Waves className="w-4 h-4" />,
  "Breakfast": <Coffee className="w-4 h-4" />,
  "Restaurant": <Utensils className="w-4 h-4" />,
};

export const HotelCard = ({ hotel }: { hotel: Hotel }) => {
  const getAmenityIcon = (amenity: string) => {
    const key = Object.keys(amenityIcons).find(k => 
      amenity.toLowerCase().includes(k.toLowerCase())
    );
    return key ? amenityIcons[key] : <MapPin className="w-4 h-4" />;
  };

  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all duration-300 border-border group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.images[0] || "/placeholder.svg"}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
          ${hotel.price_per_night.base}/night
        </div>
      </div>

      <CardContent className="p-5">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(hotel.rating)
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
              <span className="font-semibold ml-1">{hotel.rating}</span>
            </div>
            <span className="text-muted-foreground">
              ({hotel.reviews} reviews)
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {hotel.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.slice(0, 4).map((amenity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-xs font-medium"
            >
              {getAmenityIcon(amenity)}
              <span>{amenity}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Total with taxes</div>
            <div className="text-lg font-bold text-foreground">
              ${hotel.price_per_night.total}
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
            onClick={() => window.open(hotel.booking_url, "_blank")}
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
