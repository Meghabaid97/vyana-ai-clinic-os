import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface HeaderLocationSelectorProps {
  pincode: string | null;
  city: string | null;
  onLocationChange?: (location: { pincode: string; city: string; latitude?: number; longitude?: number }) => void;
}

const HeaderLocationSelector = ({ 
  pincode, 
  city,
  onLocationChange 
}: HeaderLocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputPincode, setInputPincode] = useState(pincode || "");
  const [inputCity, setInputCity] = useState(city || "");
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setInputPincode(pincode || "");
    setInputCity(city || "");
  }, [pincode, city]);

  const detectLocation = () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get pincode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const detectedPincode = data.address?.postcode || "";
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || "";
          
          setInputPincode(detectedPincode);
          setInputCity(detectedCity);
          
          if (onLocationChange) {
            onLocationChange({
              pincode: detectedPincode,
              city: detectedCity,
              latitude,
              longitude,
            });
          }
          
          toast({
            title: "Location Detected",
            description: `${detectedCity || "Your area"}, ${detectedPincode}`,
          });
        } catch (error) {
          console.error("Geocoding error:", error);
          toast({
            title: "Detection Failed",
            description: "Could not determine your location. Please enter manually.",
            variant: "destructive",
          });
        }
        
        setIsDetecting(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location Error",
          description: "Please enable location access or enter pincode manually",
          variant: "destructive",
        });
        setIsDetecting(false);
      }
    );
  };

  const handleSave = () => {
    if (onLocationChange && inputPincode) {
      onLocationChange({
        pincode: inputPincode,
        city: inputCity,
      });
    }
    setOpen(false);
  };

  const displayText = city && pincode 
    ? `${city}, ${pincode}` 
    : pincode 
      ? pincode 
      : "Set Location";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[180px]">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-xs">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="font-medium text-sm">Your Location</div>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={detectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            {isDetecting ? "Detecting..." : "Auto-detect Location"}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">or enter manually</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Pincode"
              value={inputPincode}
              onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
            />
            <Input
              placeholder="City (optional)"
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
            />
          </div>
          
          <Button className="w-full" onClick={handleSave} disabled={!inputPincode}>
            Save Location
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HeaderLocationSelector;
