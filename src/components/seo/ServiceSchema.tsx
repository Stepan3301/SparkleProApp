import React from 'react';

interface ServiceSchemaProps {
  serviceName: string;
  description: string;
  price?: number;
  image?: string;
}

const ServiceSchema: React.FC<ServiceSchemaProps> = ({
  serviceName,
  description,
  price,
  image
}) => {
  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "SparklePro Cleaning Services",
      "url": "https://sparklepro.ae"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United Arab Emirates"
    },
    "serviceType": "Cleaning Service",
    "category": "Home Services",
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "AED",
        "availability": "https://schema.org/InStock"
      }
    }),
    ...(image && {
      "image": `${window.location.origin}${image}`
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
    />
  );
};

export default ServiceSchema;