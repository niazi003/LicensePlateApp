export interface GeocodingResult {
  city: string;
  state: string;
  country: string;
  fullAddress: string;
}

export interface GeocodingError {
  message: string;
  code?: string;
}

const GOOGLE_API_KEY = 'AIzaSyDPRWzh0Sdx1CdMtp8EJKNSmLZnXUFeQyM';
const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodingResult> => {
  try {
    const url = `${GEOCODING_BASE_URL}?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      throw new Error('No results found for the provided coordinates');
    }
    
    const result = data.results[0];
    const addressComponents = result.address_components;
    
    // Extract location components
    let city = '';
    let state = '';
    let country = '';
    
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name; // Use short name for state (e.g., "CA" instead of "California")
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    }
    
    // Fallback for city if not found
    if (!city) {
      for (const component of addressComponents) {
        const types = component.types;
        if (types.includes('administrative_area_level_3') || types.includes('sublocality')) {
          city = component.long_name;
          break;
        }
      }
    }
    
    // Fallback for state if not found
    if (!state) {
      for (const component of addressComponents) {
        const types = component.types;
        if (types.includes('administrative_area_level_2')) {
          state = component.short_name;
          break;
        }
      }
    }
    
    return {
      city: city || 'Unknown City',
      state: state || 'Unknown State',
      country: country || 'Unknown Country',
      fullAddress: result.formatted_address
    };
    
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    
    // Check if it's a network error
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch') || 
        error.name === 'TypeError' ||
        error.message?.includes('Network')) {
      throw new Error('NETWORK_ERROR: No internet connection. Please check your network and try again.');
    }
    
    throw error;
  }
};

export const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number }> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `${GEOCODING_BASE_URL}?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      throw new Error('No results found for the provided address');
    }
    
    const location = data.results[0].geometry.location;
    
    return {
      latitude: location.lat,
      longitude: location.lng
    };
    
  } catch (error) {
    console.error('Forward geocoding error:', error);
    throw error;
  }
};
