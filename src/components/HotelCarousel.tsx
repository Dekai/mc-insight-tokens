import { HotelCard } from "./HotelCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

export const HotelCarousel = ({ hotels }: { hotels: Hotel[] }) => {
  return (
    <div className="w-full py-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Found {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'}
        </span>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {hotels.map((hotel, idx) => (
            <CarouselItem key={idx} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
              <HotelCard hotel={hotel} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
};
