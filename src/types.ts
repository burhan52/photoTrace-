export interface IdentifiedEntity {
  name: string;
  type: 'Person' | 'Location' | 'Landmark' | 'Organization' | 'Event' | 'Brand' | string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  notes?: string;
}

export interface ImageForensics {
  aiGeneratedAssessment: string;
  aiIndicators: string;
  estimatedEra: string;
  tamperingClues: string;
}

export interface LocationAndContext {
  detectedLocation: string;
  visualClues: string;
}

export interface SocialMediaKeywords {
  twitter?: string;
  instagram?: string;
  reddit?: string;
  linkedin?: string;
}

export interface VisualAnalysis {
  subject: string;
  category: string;
  summary: string;
  entities: IdentifiedEntity[];
  ocrText: string[];
  locationAndContext: LocationAndContext;
  forensics: ImageForensics;
  targetedSearchQueries: string[];
  socialMediaKeywords: SocialMediaKeywords;
  osintDorks: string[];
}

export type ResultCategoryFilter = 'all' | 'social' | 'news' | 'web';

export interface GroundedResult {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
  category?: 'social' | 'news' | 'web';
}

export interface ReverseEngineLink {
  name: string;
  category: string;
  description: string;
  searchUrl: string;
  queryUrl: string;
  badge?: string;
}

export interface SocialScanTarget {
  platform: string;
  icon: string;
  query: string;
  deepUrl: string;
  purpose: string;
}

export interface ScanResultData {
  analysis: VisualAnalysis;
  searchSummary: string;
  groundedResults: GroundedResult[];
  searchQueries: string[];
  reverseEngineLinks: ReverseEngineLink[];
  socialScanTargets: SocialScanTarget[];
  timestamp: string;
}

export interface ImageClientMetadata {
  fileName: string;
  fileSizeFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  mimeType: string;
  sha256: string;
  dominantColors: string[];
  exif?: {
    cameraMake?: string;
    cameraModel?: string;
    dateTimeOriginal?: string;
    focalLength?: string;
    fNumber?: string;
    iso?: string;
    exposureTime?: string;
    software?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsCoordinates?: string;
  };
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  subject: string;
  thumbnail: string;
  category: string;
  resultsCount: number;
  data: ScanResultData;
  metadata: ImageClientMetadata;
}
