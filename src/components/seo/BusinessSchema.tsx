import React from 'react';

const BusinessSchema: React.FC = () => {
  const businessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://sparklepro.ae/#business",
    "name": "SparklePro Cleaning Services",
    "alternateName": "SparklePro",
    "description": "Professional cleaning services in UAE offering regular cleaning, deep cleaning, move-in/move-out cleaning, and office cleaning services.",
    "url": "https://sparklepro.ae",
    "telephone": "+971-XX-XXX-XXXX", // Replace with actual phone
    "email": "info@sparklepro.ae", // Replace with actual email
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AE",
      "addressRegion": "Dubai",
      "addressLocality": "Dubai",
      "streetAddress": "Your Street Address" // Replace with actual address
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "25.2048",
      "longitude": "55.2708"
    },
    "openingHours": [
      "Mo-Su 08:00-20:00"
    ],
    "priceRange": "$$",
    "currenciesAccepted": "AED",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer",
    "areaServed": [
      { "@type": "City", "name": "Dubai" },
      { "@type": "City", "name": "Abu Dhabi" },
      { "@type": "City", "name": "Sharjah" }
    ],
    "serviceType": [
      "Residential Cleaning",
      "Commercial Cleaning",
      "Deep Cleaning",
      "Move-in/Move-out Cleaning",
      "Office Cleaning"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cleaning Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Regular Cleaning", "description": "Weekly or bi-weekly residential cleaning service" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Deep Cleaning", "description": "Comprehensive deep cleaning for homes and apartments" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Move-in/Move-out Cleaning", "description": "Specialized cleaning for property transitions" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Office Cleaning", "description": "Professional commercial cleaning services" } }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Sarah Ahmed" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Excellent cleaning service! Very professional and thorough."
      }
    ]
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData) }}
    />
  );
};

export default BusinessSchema;