// Minimal Google Maps type stubs for TypeScript.
// The actual types are provided at runtime by the Google Maps JS SDK loaded via @vis.gl/react-google-maps.
declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: { location?: { lat: number; lng: number }; address?: string },
        callback: (results: any[] | null, status: string) => void
      ): void;
    }
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: any);
        addListener(event: string, handler: () => void): void;
        getPlace(): any;
      }
    }
  }
}
