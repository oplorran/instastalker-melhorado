// ============================================
// ARQUIVO CENTRALIZADO DE APIs
// Todas as chamadas de API externas estão aqui
// ============================================

/**
 * IP Geolocation APIs
 * Returns { cidade, estado, lat, lon }
 */

// Lista de APIs de geolocalização por IP (fallback)
// ✅ Apenas APIs que estão funcionando
const IP_GEOLOCATION_APIS = [
    { 
        name: 'geojs.io',
        url: 'https://get.geojs.io/v1/ip/geo.json', 
        parse: (data) => ({ 
            cidade: data.city, 
            estado: data.region, 
            lat: parseFloat(data.latitude), 
            lon: parseFloat(data.longitude) 
        }) 
    },
    { 
        name: 'ipwhois.app',
        url: 'https://ipwhois.app/json/', 
        parse: (data) => ({ 
            cidade: data.city, 
            estado: data.region_code || data.region, 
            lat: parseFloat(data.latitude), 
            lon: parseFloat(data.longitude) 
        }) 
    }
    // ❌ Removido: freegeoip.app - não está funcionando
];

/**
 * Detects city by IP using multiple APIs
 * @returns {Promise<Object|null>} - { cidade, estado, lat, lon } or null
 */
async function detectCityByIP() {
    // First, try to use saved data from localStorage
    const savedLocationData = localStorage.getItem('user_location_data');
    if (savedLocationData) {
        try {
            const location = JSON.parse(savedLocationData);
            if (location.cidade && location.lat && location.lon) {
                console.log('✅ [API] Using cached location:', location.cidade);
                return location;
            }
        } catch (error) {
            console.warn('⚠️ [API] Error parsing cached location:', error);
        }
    }

    // Try each API until one works
    for (const api of IP_GEOLOCATION_APIS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(api.url, { 
                signal: controller.signal, 
                headers: { 'Accept': 'application/json' },
                mode: 'cors',
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`⚠️ [API] Resposta HTTP ${response.status} de ${api.name}`);
                continue;
            }
            
            const data = await response.json();
            const location = api.parse(data);
            
            if (location.cidade && location.lat && location.lon) {
                // Save to localStorage for next time
                localStorage.setItem('user_location_data', JSON.stringify(location));
                console.log('✅ [API] Location obtained:', location.cidade);
                return location;
            }
        } catch (error) {
            console.warn(`⚠️ [API] Error in API ${api.name}:`, error.message || error);
            continue;
        }
    }
    
    console.error('❌ [API] Could not get location from any API');
    return null;
}

/**
 * Searches for neighboring city using OpenStreetMap Nominatim
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Array<string>} excludeCities - Cities to exclude
 * @returns {Promise<string|null>} - Name of neighboring city or null
 */
async function getNeighborCity(lat, lon, excludeCities = []) {
    if (!lat || !lon) return null;

    // First, try to use saved data from localStorage
    const savedNeighborCities = localStorage.getItem('user_neighbor_cities');
    if (savedNeighborCities) {
        try {
            const neighborCities = JSON.parse(savedNeighborCities);
            if (Array.isArray(neighborCities) && neighborCities.length > 0) {
                const excludeLower = excludeCities.map(c => c.toLowerCase());
                const availableCity = neighborCities.find(city => !excludeLower.includes(city.toLowerCase()));
                if (availableCity) {
                    console.log('✅ [API] Using neighboring city from cache:', availableCity);
                    return availableCity;
                }
                // If all are excluded, return the first one anyway
                if (neighborCities.length > 0) {
                    return neighborCities[0];
                }
            }
        } catch (error) {
            console.warn('⚠️ [API] Error parsing neighboring cities from cache:', error);
        }
    }

    // Buscar via API
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        
        const delta = 0.3; // ~30km
        const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=20&bounded=1&viewbox=${viewbox}&extratags=1&accept-language=pt-BR&q=${encodeURIComponent('city')}`;
        
        const response = await fetch(url, { 
            headers: { 'User-Agent': 'Stalkea.ai/1.0 (contact@stalkea.ai)' },
            mode: 'cors'
        });
        
        if (!response.ok) {
            console.warn('⚠️ [API] HTTP error fetching neighboring city:', response.status);
            return null;
        }
        
        const data = await response.json();
        if (data.length === 0) return null;

        // Get current city to exclude
        const cityData = await detectCityByIP();
        const currentCity = cityData?.cidade?.toLowerCase();
        const excludeLower = excludeCities.map(c => c.toLowerCase());

        // Filter valid cities (city, town, administrative) and different from current and excluded
        const validCities = data.filter(item => {
            const itemCity = item.display_name.split(',')[0].toLowerCase();
            return (item.type === 'city' || item.type === 'town' || item.type === 'administrative') &&
                   itemCity !== currentCity &&
                   !excludeLower.includes(itemCity);
        });

        if (validCities.length > 0) {
            const neighborCity = validCities[0].display_name.split(',')[0];
            
            // Salvar no localStorage
            const savedNeighbors = JSON.parse(localStorage.getItem('user_neighbor_cities') || '[]');
            if (!savedNeighbors.includes(neighborCity)) {
                savedNeighbors.push(neighborCity);
                localStorage.setItem('user_neighbor_cities', JSON.stringify(savedNeighbors));
            }
            
            console.log('✅ [API] Neighboring city obtained:', neighborCity);
            return neighborCity;
        }
    } catch (error) {
        console.warn('⚠️ [API] Error fetching neighboring city:', error);
    }
    
    return null;
}

/**
 * Searches for famous place (shopping, restaurant, park, etc.) using Overpass API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} cityData - City data (optional, for fallback)
 * @returns {Promise<string|null>} - Name of famous place or null
 */
async function getFamousPlace(lat, lon, cityData = null) {
    if (!lat || !lon) {
        // If no coordinates, return city from IP
        return cityData?.cidade || null;
    }

    // First, try to use saved data from localStorage
    const savedFamousPlace = localStorage.getItem('user_famous_place');
    if (savedFamousPlace) {
                    console.log('✅ [API] Using famous place from cache:', savedFamousPlace);
        return savedFamousPlace;
    }

    // Buscar via API
    try {
        const radius = 15000; // 15km
        const overpassQuery = `[out:json][timeout:8];
(
  node["name"](around:${radius},${lat},${lon});
);
out body 10;`;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, { 
            signal: controller.signal, 
            method: 'GET' 
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return cityData?.cidade || null;

        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
            // Prioritize malls, restaurants, cafes, parks, tourist attractions
            const place = data.elements.find(e =>
                e.tags?.name && (
                    e.tags?.shop === 'mall' ||
                    e.tags?.amenity === 'restaurant' ||
                    e.tags?.amenity === 'cafe' ||
                    e.tags?.leisure === 'park' ||
                    e.tags?.tourism === 'attraction'
                )
            ) || data.elements.find(e => e.tags?.name);

            if (place && place.tags?.name) {
                // Save to localStorage
                localStorage.setItem('user_famous_place', place.tags.name);
                console.log('✅ [API] Famous place obtained:', place.tags.name);
                return place.tags.name;
            }
        }
    } catch (error) {
        console.warn('⚠️ [API] Error fetching famous place:', error);
    }

    // Fallback: return city from IP
    return cityData?.cidade || null;
}

/**
 * Reverse geocoding - converts coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} - Address data or null
 */
async function reverseGeocode(lat, lon) {
    if (!lat || !lon) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Stalkea.ai/1.0 (contact@stalkea.ai)',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('⚠️ [API] Error doing reverse geocoding:', error);
        return null;
    }
}

/**
 * Searches for complete address from coordinates (improved reverse geocoding)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level (default: 18)
 * @returns {Promise<Object|null>} - Complete address data or null
 */
async function getAddressFromCoords(lat, lon, zoom = 18) {
    if (!lat || !lon) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Stalkea.ai/1.0 (contact@stalkea.ai)',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        
        if (!data || !data.address) return null;

        return {
            place_id: data.place_id,
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
            display_name: data.display_name,
            address: {
                road: data.address.road || '',
                suburb: data.address.suburb || '',
                city: data.address.city || data.address.town || data.address.village || '',
                state: data.address.state || '',
                country: data.address.country || 'Brasil'
            }
        };
    } catch (error) {
        console.warn('⚠️ [API] Error getting address from coordinates:', error);
        return null;
    }
}

/**
 * Searches for places using Nominatim (OpenStreetMap)
 * @param {string} keyword - Search keyword (ex: "restaurant são paulo")
 * @param {number} limit - Result limit (default: 5)
 * @returns {Promise<Array>} - Array of found places
 */
async function searchPlaces(keyword, limit = 5) {
    if (!keyword) return [];

    try {
        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&accept-language=pt-BR&q=${encodeURIComponent(keyword)}`;
        
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Stalkea.ai/1.0 (contact@stalkea.ai)',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.map(item => ({
            place_id: item.place_id,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            name: item.display_name,
            address: item.address || {},
            type: item.type
        }));
    } catch (error) {
        console.warn('⚠️ [API] Error searching places:', error);
        return [];
    }
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude point 1
 * @param {number} lon1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lon2 - Longitude point 2
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Searches for nearby cities using Overpass API (OpenStreetMap)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Radius in meters (default: 50000 = 50km)
 * @param {number} limit - Result limit (default: 20)
 * @returns {Promise<Array>} - Array of cities with name, coordinates and distance
 */
async function getNearbyCities(lat, lon, radius = 50000, limit = 20) {
    if (!lat || !lon) return [];

    try {
        const overpassQuery = `[out:json][timeout:15];(
    node["place"="city"](around:${radius},${lat},${lon});
    node["place"="town"](around:${radius},${lat},${lon});
);out body ${limit};`;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            method: 'GET'
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        
        if (!data.elements || data.elements.length === 0) return [];

        // Calculate distance for each city
        const cities = data.elements
            .filter(item => item.tags && item.tags.name)
            .map(item => {
                const cityLat = parseFloat(item.lat);
                const cityLon = parseFloat(item.lon);
                const distance = calculateDistance(lat, lon, cityLat, cityLon);
                
                return {
                    name: item.tags.name,
                    lat: cityLat,
                    lon: cityLon,
                    distance: distance, // em km
                    type: item.tags.place || 'city'
                };
            })
            .sort((a, b) => a.distance - b.distance); // Sort by distance

        return cities;
    } catch (error) {
        console.warn('⚠️ [API] Error searching nearby cities:', error);
        return [];
    }
}

/**
 * Searches for nearby motels using Overpass API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Radius in meters (default: 50000 = 50km)
 * @param {number} limit - Result limit (default: 20)
 * @returns {Promise<Array>} - Array of motels with name, address and coordinates
 */
async function getNearbyMotels(lat, lon, radius = 50000, limit = 20) {
    if (!lat || !lon) return [];

    try {
        const overpassQuery = `[out:json][timeout:20];(
    node["amenity"="love_hotel"](around:${radius},${lat},${lon});
    node["amenity"="motel"](around:${radius},${lat},${lon});
);out body ${limit};`;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            method: 'GET'
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        
        if (!data.elements || data.elements.length === 0) return [];

        const motels = data.elements
            .filter(item => item.tags && item.tags.name)
            .map(item => {
                const motelLat = parseFloat(item.lat);
                const motelLon = parseFloat(item.lon);
                const distance = calculateDistance(lat, lon, motelLat, motelLon);
                
                return {
                    name: item.tags.name,
                    lat: motelLat,
                    lon: motelLon,
                    distance: distance, // em km
                    address: item.tags['addr:city'] || item.tags['addr:street'] || '',
                    amenity: item.tags.amenity
                };
            })
            .sort((a, b) => a.distance - b.distance);

        return motels;
    } catch (error) {
        console.warn('⚠️ [API] Error searching motels:', error);
        return [];
    }
}

/**
 * Searches for famous places (restaurants, cafes, malls, parks, etc.) using Overpass API
 * Improved version that returns complete array
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Radius in meters (default: 20000 = 20km)
 * @param {number} limit - Result limit per type (default: 30)
 * @returns {Promise<Array>} - Array of famous places
 */
async function getFamousPlaces(lat, lon, radius = 20000, limit = 30) {
    if (!lat || !lon) return [];

    try {
        // Search for multiple types of places
        const overpassQuery = `[out:json][timeout:15];(
    node["amenity"="restaurant"]["name"](around:${radius},${lat},${lon});
    node["amenity"="cafe"]["name"](around:${radius},${lat},${lon});
    node["shop"="supermarket"]["name"](around:${radius},${lat},${lon});
    node["shop"="mall"]["name"](around:${radius},${lat},${lon});
    node["leisure"="park"]["name"](around:${radius},${lat},${lon});
    node["amenity"="bar"]["name"](around:${radius},${lat},${lon});
    node["amenity"="fuel"]["name"](around:${radius},${lat},${lon});
    node["amenity"="gym"]["name"](around:${radius},${lat},${lon});
    node["tourism"="attraction"]["name"](around:${radius},${lat},${lon});
);out body ${limit};`;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            method: 'GET'
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        
        if (!data.elements || data.elements.length === 0) return [];

        // Prioritize: mall > restaurant > cafe > park > others
        const priorityOrder = {
            'shop=mall': 1,
            'amenity=restaurant': 2,
            'amenity=cafe': 3,
            'leisure=park': 4,
            'tourism=attraction': 5,
            'amenity=bar': 6,
            'shop=supermarket': 7,
            'amenity=fuel': 8,
            'amenity=gym': 9
        };

        const places = data.elements
            .filter(item => item.tags && item.tags.name)
            .map(item => {
                const placeLat = parseFloat(item.lat);
                const placeLon = parseFloat(item.lon);
                const distance = calculateDistance(lat, lon, placeLat, placeLon);
                
                // Determine type and priority
                let type = 'other';
                let priority = 999;
                if (item.tags.shop === 'mall') {
                    type = 'shopping';
                    priority = priorityOrder['shop=mall'];
                } else if (item.tags.amenity === 'restaurant') {
                    type = 'restaurant';
                    priority = priorityOrder['amenity=restaurant'];
                } else if (item.tags.amenity === 'cafe') {
                    type = 'cafe';
                    priority = priorityOrder['amenity=cafe'];
                } else if (item.tags.leisure === 'park') {
                    type = 'park';
                    priority = priorityOrder['leisure=park'];
                } else if (item.tags.tourism === 'attraction') {
                    type = 'attraction';
                    priority = priorityOrder['tourism=attraction'];
                }
                
                return {
                    name: item.tags.name,
                    lat: placeLat,
                    lon: placeLon,
                    distance: distance,
                    type: type,
                    amenity: item.tags.amenity,
                    shop: item.tags.shop,
                    priority: priority
                };
            })
            .sort((a, b) => {
                // Sort by priority first, then by distance
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return a.distance - b.distance;
            });

        return places;
    } catch (error) {
        console.warn('⚠️ [API] Error searching famous places:', error);
        return [];
    }
}

// ============================================
// EXPORTAR FUNÇÕES (tornar disponíveis globalmente)
// ============================================

if (typeof window !== 'undefined') {
    // APIs de Localização
    window.detectCityByIP = detectCityByIP;
    window.getNeighborCity = getNeighborCity;
    window.getFamousPlace = getFamousPlace; // Retorna string (nome do lugar)
    window.reverseGeocode = reverseGeocode;
    window.getAddressFromCoords = getAddressFromCoords;
    
    // APIs de Busca
    window.searchPlaces = searchPlaces;
    window.getNearbyCities = getNearbyCities;
    window.getNearbyMotels = getNearbyMotels;
    window.getFamousPlaces = getFamousPlaces; // Retorna array completo
    
    // Utilitários
    window.calculateDistance = calculateDistance;
}

