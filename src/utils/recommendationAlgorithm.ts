// Business-Optimized Cleaning Service Recommendation Algorithm

export interface RecommendationResult {
  recommended_cleaners: number;
  recommended_hours: number;
  estimated_cost: number;
  efficiency_message: string;
}

// Property Size Categories
export const PROPERTY_SIZES = [
  { size: 'small', label: 'Small', details: '< 50 sqm', multiplier: 1.2 },
  { size: 'medium', label: 'Medium', details: '50-100 sqm', multiplier: 1.6 },
  { size: 'large', label: 'Large', details: '100-200 sqm', multiplier: 2.4 },
  { size: 'villa', label: 'Villa', details: '> 200 sqm', multiplier: 3.2 }
];

export const PROPERTY_SIZE_MAP = {
  small: { label: 'Small', details: '< 50 sqm', multiplier: 1.2 },
  medium: { label: 'Medium', details: '50-100 sqm', multiplier: 1.6 },
  large: { label: 'Large', details: '100-200 sqm', multiplier: 2.4 },
  villa: { label: 'Villa', details: '> 200 sqm', multiplier: 3.2 }
};

// Service Types with Complexity Coefficients
const SERVICE_COEFFICIENTS: { [key: string]: number } = {
  regular: 1.0,
  deep: 1.3,
  move: 1.5,
  office: 1.0, // Same as regular
  postconstruction: 1.7,
  kitchen: 1.2,
  bathroom: 1.1
};

// Base Hours for 1 Cleaner (inflated estimates)
const BASE_HOURS: { [key: string]: { [key: string]: number } } = {
  regular: { small: 4, medium: 6, large: 8, villa: 12 },
  deep: { small: 5, medium: 7, large: 10, villa: 15 },
  move: { small: 6, medium: 8, large: 12, villa: 18 },
  office: { small: 4, medium: 6, large: 8, villa: 12 }, // Same as regular
  postconstruction: { small: 7, medium: 9, large: 14, villa: 20 },
  kitchen: { small: 3, medium: 3.5, large: 4, villa: 5 },
  bathroom: { small: 2.5, medium: 3, large: 3.5, villa: 4 }
};

// Team Efficiency Coefficients (conservative for higher revenue)
const TEAM_EFFICIENCY: { [key: number]: number } = {
  1: 1.0,
  2: 0.75,
  3: 0.55,
  4: 0.45
};

// Pricing Structure (per cleaner per hour in AED)
const HOURLY_RATES: { [key: string]: { with_materials: number; without_materials: number } } = {
  regular: { with_materials: 45, without_materials: 35 },
  deep: { with_materials: 55, without_materials: 45 },
  move: { with_materials: 55, without_materials: 45 }, // Same as deep
  office: { with_materials: 45, without_materials: 35 }, // Same as regular
  postconstruction: { with_materials: 65, without_materials: 55 },
  kitchen: { with_materials: 55, without_materials: 45 },
  bathroom: { with_materials: 50, without_materials: 40 }
};

export function getServiceKey(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('regular')) return 'regular';
  if (name.includes('deep') && !name.includes('villa') && !name.includes('apartment')) return 'deep';
  if (name.includes('move')) return 'move';
  if (name.includes('office')) return 'office';
  if (name.includes('construction')) return 'postconstruction';
  if (name.includes('kitchen')) return 'kitchen';
  if (name.includes('bathroom')) return 'bathroom';
  return 'regular'; // Default
}

export function recommendCleaners(serviceType: string, propertySize: string): number {
  const serviceCoeff = SERVICE_COEFFICIENTS[serviceType] || 1.0;
  const sizeMultiplier = PROPERTY_SIZES.find(p => p.size === propertySize)?.multiplier || 1.2;
  
  const complexityIndex = serviceCoeff * sizeMultiplier;
  
  // Recommend cleaners based on complexity (never recommend 1)
  if (complexityIndex <= 1.0) return 2;
  if (complexityIndex <= 1.8) return 2;
  if (complexityIndex <= 2.8) return 3;
  return 4;
}

export function recommendHours(serviceType: string, propertySize: string, cleaners: number): number {
  const baseHours = BASE_HOURS[serviceType]?.[propertySize] || BASE_HOURS.regular[propertySize] || 4;
  const efficiency = TEAM_EFFICIENCY[cleaners] || 1.0;
  
  let recommendedTime = baseHours * efficiency;
  
  // Add 0.5 hour buffer for "quality assurance"
  recommendedTime += 0.5;
  
  // Round up to nearest 0.5 hour
  recommendedTime = Math.ceil(recommendedTime * 2) / 2;
  
  // Minimum 2.5 hours, maximum 7 hours
  recommendedTime = Math.max(2.5, Math.min(7, recommendedTime));
  
  return recommendedTime;
}

export function calculateCost(
  serviceType: string, 
  cleaners: number, 
  hours: number, 
  withMaterials: boolean
): number {
  const rates = HOURLY_RATES[serviceType] || HOURLY_RATES.regular;
  const hourlyRate = withMaterials ? rates.with_materials : rates.without_materials;
  
  return cleaners * hours * hourlyRate;
}

export function getRecommendation(
  serviceType: string,
  propertySize: string,
  selectedCleaners?: number,
  selectedHours?: number,
  withMaterials: boolean = true
): RecommendationResult {
  const recommendedCleaners = recommendCleaners(serviceType, propertySize);
  const cleanersToUse = selectedCleaners || recommendedCleaners;
  const recommendedHours = recommendHours(serviceType, propertySize, cleanersToUse);
  const hoursToUse = selectedHours || recommendedHours;
  
  const estimatedCost = calculateCost(serviceType, cleanersToUse, hoursToUse, withMaterials);
  
  // Generate efficiency message
  let efficiencyMessage = '';
  if (cleanersToUse === 2) {
    efficiencyMessage = 'Optimal team size for quality and efficiency';
  } else if (cleanersToUse === 3) {
    efficiencyMessage = 'Enhanced team for faster completion and superior results';
  } else if (cleanersToUse === 4) {
    efficiencyMessage = 'Maximum efficiency team for comprehensive cleaning';
  }
  
  return {
    recommended_cleaners: recommendedCleaners,
    recommended_hours: recommendedHours,
    estimated_cost: estimatedCost,
    efficiency_message: efficiencyMessage
  };
} 