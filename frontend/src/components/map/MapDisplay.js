import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create custom colored icons
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

// Default blue marker
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Custom marker icons
const startIcon = createColoredIcon('#3f51b5'); // Blue
const endIcon = createColoredIcon('#f44336'); // Red
const pickupIcon = createColoredIcon('#4caf50'); // Green
const dropoffIcon = createColoredIcon('#ff9800'); // Orange
const waypointIcon = createColoredIcon('#9c27b0'); // Purple

L.Marker.prototype.options.icon = DefaultIcon;

// Map click handler component
function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e);
      }
    },
  });
  return null;
}

// Component to fit bounds and center map
function MapCenter({ bounds, center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds);
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [bounds, center, zoom, map]);
  
  return null;
}

const MapDisplay = ({
  startPoint,
  endPoint,
  waypoints = [],
  routeData = null,
  height = '400px',
  onMapClick = null,
  markerDraggable = false,
  onMarkerDragEnd = null,
  specialMarkers = []
}) => {
  const [center, setCenter] = useState([0, 0]);
  const [zoom, setZoom] = useState(13);
  const [bounds, setBounds] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Collect all points for bounds calculation
    const points = [];
    
    if (startPoint && startPoint.lat && startPoint.lon) {
      points.push([startPoint.lat, startPoint.lon]);
      setCenter([startPoint.lat, startPoint.lon]);
    }
    
    if (endPoint && endPoint.lat && endPoint.lon) {
      points.push([endPoint.lat, endPoint.lon]);
      if (!startPoint) setCenter([endPoint.lat, endPoint.lon]);
    }
    
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach(point => {
        if (point.lat && point.lon) {
          points.push([point.lat, point.lon]);
        }
      });
      
      if (!startPoint && !endPoint && waypoints[0].lat && waypoints[0].lon) {
        setCenter([waypoints[0].lat, waypoints[0].lon]);
      }
    }
    
    if (specialMarkers && specialMarkers.length > 0) {
      specialMarkers.forEach(marker => {
        if (marker.position && marker.position.length === 2) {
          points.push(marker.position);
        }
      });
    }
    
    // Set bounds if we have at least 2 points
    if (points.length >= 2) {
      setBounds(points);
    }
    
  }, [startPoint, endPoint, waypoints, specialMarkers]);

  // Convert route coordinates to format required by Leaflet
  const polylinePositions = routeData && routeData.route && routeData.route.coordinates
    ? routeData.route.coordinates.map(coord => [coord[1], coord[0]]) // Convert [lon, lat] to [lat, lon]
    : [];

  const handleMapClick = (e) => {
    if (onMapClick) {
      onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
    }
  };

  const handleMarkerDragEnd = (type, e) => {
    if (onMarkerDragEnd) {
      onMarkerDragEnd(type, { lat: e.target._latlng.lat, lon: e.target._latlng.lng });
    }
  };

  // Get appropriate icon for marker type
  const getMarkerIcon = (type) => {
    switch (type) {
      case 'start':
        return startIcon;
      case 'end':
        return endIcon;
      case 'pickup':
        return pickupIcon;
      case 'dropoff':
        return dropoffIcon;
      case 'waypoint':
        return waypointIcon;
      default:
        return DefaultIcon;
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapCenter bounds={bounds} center={center} zoom={zoom} />
      
      {onMapClick && <MapClickHandler onClick={handleMapClick} />}
      
      {/* Main route */}
      {polylinePositions.length > 0 && (
        <Polyline 
          positions={polylinePositions} 
          color="#3f51b5" 
          weight={5} 
          opacity={0.7} 
        />
      )}
      
      {/* Start point marker */}
      {startPoint && startPoint.lat && startPoint.lon && (
        <Marker 
          position={[startPoint.lat, startPoint.lon]} 
          draggable={markerDraggable}
          icon={getMarkerIcon('start')}
          eventHandlers={{
            dragend: (e) => handleMarkerDragEnd('start', e)
          }}
        >
          <Popup>
            <strong>Start Point</strong><br />
            {startPoint.name && <span>{startPoint.name}<br /></span>}
            <small>Lat: {parseFloat(startPoint.lat).toFixed(6)}, Lon: {parseFloat(startPoint.lon).toFixed(6)}</small>
          </Popup>
        </Marker>
      )}
      
      {/* End point marker */}
      {endPoint && endPoint.lat && endPoint.lon && (
        <Marker 
          position={[endPoint.lat, endPoint.lon]}
          draggable={markerDraggable}
          icon={getMarkerIcon('end')}
          eventHandlers={{
            dragend: (e) => handleMarkerDragEnd('end', e)
          }}
        >
          <Popup>
            <strong>End Point</strong><br />
            {endPoint.name && <span>{endPoint.name}<br /></span>}
            <small>Lat: {parseFloat(endPoint.lat).toFixed(6)}, Lon: {parseFloat(endPoint.lon).toFixed(6)}</small>
          </Popup>
        </Marker>
      )}
      
      {/* Waypoint markers */}
      {waypoints.map((point, index) => (
        <Marker 
          key={index} 
          position={[point.lat, point.lon]}
          draggable={markerDraggable}
          icon={getMarkerIcon('waypoint')}
          eventHandlers={{
            dragend: (e) => handleMarkerDragEnd(`waypoint-${index}`, e)
          }}
        >
          <Popup>
            <strong>{point.name || `Waypoint ${index + 1}`}</strong><br />
            <small>Lat: {parseFloat(point.lat).toFixed(6)}, Lon: {parseFloat(point.lon).toFixed(6)}</small>
          </Popup>
        </Marker>
      ))}
      
      {/* Special markers (pickup, dropoff, etc.) */}
      {specialMarkers && specialMarkers.map((marker, index) => (
        <Marker 
          key={`special-${index}`} 
          position={marker.position}
          icon={getMarkerIcon(marker.icon || 'default')}
        >
          <Popup>
            <strong>{marker.popup || 'Location'}</strong><br />
            <small>Lat: {parseFloat(marker.position[0]).toFixed(6)}, Lon: {parseFloat(marker.position[1]).toFixed(6)}</small>
          </Popup>
        </Marker>
      ))}
      
      {/* Route info */}
      {routeData && routeData.distance && (
        <div className="map-info-overlay" style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '6px 8px',
          borderRadius: '4px',
          boxShadow: '0 0 8px rgba(0,0,0,0.2)',
          fontSize: '12px'
        }}>
          <div><strong>Distance:</strong> {(routeData.distance / 1000).toFixed(1)} km</div>
          <div><strong>Duration:</strong> {Math.ceil(routeData.duration / 60)} mins</div>
        </div>
      )}
    </MapContainer>
  );
};

export default MapDisplay;