import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  pincode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (location: {
    pincode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
}

const LocationSelector = ({
  pincode,
  city,
  latitude,
  longitude,
  onLocationChange,
}: LocationSelectorProps) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [localPincode, setLocalPincode] = useState(pincode);
  const [localCity, setLocalCity] = useState(city);
  const { toast } = useToast();

  useEffect(() => {
    setLocalPincode(pincode);
    setLocalCity(city);
  }, [pincode, city]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        
        try {
          // Reverse geocoding using a free API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();
          
          const detectedCity = 
            data.address?.city || 
            data.address?.town || 
            data.address?.village || 
            data.address?.suburb ||
            "";
          const detectedPincode = data.address?.postcode || "";

          onLocationChange({
            pincode: detectedPincode,
            city: detectedCity,
            latitude: lat,
            longitude: lon,
          });
          
          setLocalPincode(detectedPincode);
          setLocalCity(detectedCity);

          toast({
            title: "Location Detected",
            description: `${detectedCity}${detectedPincode ? ` - ${detectedPincode}` : ""}`,
          });
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          // Still save coordinates even if reverse geocoding fails
          onLocationChange({
            pincode: localPincode,
            city: localCity,
            latitude: lat,
            longitude: lon,
          });
          toast({
            title: "Location Saved",
            description: "Coordinates saved. Please enter your pincode manually.",
          });
        }
        
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        toast({
          title: "Location Error",
          description: error.message || "Failed to detect location",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePincodeChange = async (value: string) => {
    setLocalPincode(value);
    
    // Auto-fetch city for 6-digit Indian pincode
    if (value.length === 6 && /^\d+$/.test(value)) {
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );
        const data = await response.json();
        
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          const detectedCity = postOffice.District || postOffice.Division || "";
          setLocalCity(detectedCity);
          
          onLocationChange({
            pincode: value,
            city: detectedCity,
            latitude: latitude,
            longitude: longitude,
          });
        }
      } catch (error) {
        console.error("Pincode lookup error:", error);
      }
    } else {
      onLocationChange({
        pincode: value,
        city: localCity,
        latitude,
        longitude,
      });
    }
  };

  const handleCityChange = (value: string) => {
    setLocalCity(value);
    onLocationChange({
      pincode: localPincode,
      city: value,
      latitude,
      longitude,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Location
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Auto-detect
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={localPincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={localCity}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="City name"
          />
        </div>
      </div>

      {latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          📍 Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default LocationSelector;