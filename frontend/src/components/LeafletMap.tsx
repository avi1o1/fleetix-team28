'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Important: Don't forget this import

type MapPoint = {
  lat: number;
  lon: number;
  display_name: string;
  type?: 'pickup' | 'dropoff' | 'waypoint';
};

type RouteGeometry = {
  type: string;
  coordinates: [number, number][];
};

type LeafletMapProps = {
  pickup: MapPoint | null;
  dropoff: MapPoint | null;
  routeGeometry: RouteGeometry | null;
  routeColor: string;
  allPoints?: MapPoint[]; // Add this to support all waypoints
};

const LeafletMap: React.FC<LeafletMapProps> = ({
  pickup,
  dropoff,
  routeGeometry,
  routeColor = '#10B981',
  allPoints = []
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [17.4065, 78.4772], // Center on Hyderabad by default
        zoom: 12,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }),
        ]
      });
    }

    // Clean up function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Function to get route between two points
  const getRouteBetweenPoints = async (from: MapPoint, to: MapPoint): Promise<any> => {
    try {
      const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      return data.routes[0].geometry;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  };

  // Update map when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and routes
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add tile layer back if it was removed
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const bounds = new L.LatLngBounds([]);
    const pointsToDisplay = allPoints.length > 0
      ? allPoints
      : [pickup, dropoff].filter(Boolean) as MapPoint[];

    if (pointsToDisplay.length < 2) {
      return; // Need at least 2 points for a route
    }

    setIsLoading(true);
    setError(null);

    // Add markers for all waypoints
    pointsToDisplay.forEach((point, index) => {
      if (!point) return;

      // Determine marker icon based on point type
      let markerColor = 'blue';
      let markerIcon = 'P';

      if (point.type === 'dropoff') {
        markerColor = 'green';
        markerIcon = 'D';
      } else if (point.type === 'waypoint') {
        markerColor = 'orange';
        markerIcon = (index + 1).toString();
      }

      // Create a custom icon
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${markerColor}; color: white; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-weight: bold;">${markerIcon}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Add marker to map
      const marker = L.marker([point.lat, point.lon], { icon }).addTo(map);
      marker.bindPopup(point.display_name);

      // Extend bounds to include this point
      bounds.extend([point.lat, point.lon]);
    });

    // Fetch and draw routes between consecutive points
    async function fetchAllRoutes() {
      try {
        // Draw routes between consecutive points
        for (let i = 0; i < pointsToDisplay.length - 1; i++) {
          const fromPoint = pointsToDisplay[i];
          const toPoint = pointsToDisplay[i + 1];

          // Get route between these two points
          const routeGeometry = await getRouteBetweenPoints(fromPoint, toPoint);

          if (routeGeometry) {
            // Convert coordinates to Leaflet format and draw the route
            const routeCoords = routeGeometry.coordinates.map((coord: [number, number]) =>
              [coord[1], coord[0]] as L.LatLngExpression
            );

            const routePolyline = L.polyline(routeCoords, {
              color: routeColor,
              weight: 4,
              opacity: 0.7
            }).addTo(map);

            // Extend bounds to include route
            routeCoords.forEach(coord => {
              bounds.extend(coord);
            });
          } else {
            // If route fetching fails, fall back to direct line
            const directLine = L.polyline(
              [[fromPoint.lat, fromPoint.lon], [toPoint.lat, toPoint.lon]],
              {
                color: routeColor,
                weight: 2,
                opacity: 0.5,
                dashArray: '5, 10'
              }
            ).addTo(map);
          }

          // Add a short delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Fit map to bounds
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 15
          });
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Failed to load some routes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllRoutes();

  }, [pickup, dropoff, routeColor, allPoints]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <span>Loading routes...</span>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;