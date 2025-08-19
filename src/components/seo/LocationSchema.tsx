import React from 'react';

interface LocationSchemaProps {
  city: string;
  region: string;
  coordinates?: {
    latitude: string;
    longitude: string;
  };
}

const LocationSchema: React.FC<LocationSchemaProps> = ({
  city,
  region,
  coordinates
}) => {
  const locationData = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${city}, ${region}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": region,
      "addressCountry": "AE"
    },
    ...(coordinates && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": coordinates.latitude,
        "longitude": coordinates.longitude
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(locationData) }}
    />
  );
};

export default LocationSchema;