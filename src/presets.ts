export interface PresetItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageSrc: string;
  suggestedClue: string;
}

export const PRESET_IMAGES: PresetItem[] = [
  {
    id: 'landmark',
    title: 'Notre-Dame Cathedral, Paris',
    category: 'Architecture / Landmark',
    description: 'Iconic Gothic cathedral with square towers, flying buttresses, and tourists along the Seine river bridge.',
    imageSrc: '/src/assets/images/sample_landmark_monument_1791912787113.jpg',
    suggestedClue: 'Historic cathedral in Paris, France',
  },
  {
    id: 'speaker',
    title: 'Tech Summit Keynote Speaker',
    category: 'Person / Conference Event',
    description: 'Executive founder presenting at the Global Tech Innovation Summit stage with presentation backdrop.',
    imageSrc: '/src/assets/images/sample_tech_executive_1791912787346.jpg',
    suggestedClue: 'Global Tech Innovation Summit keynote presenter',
  },
  {
    id: 'vintage',
    title: '1968 Vintage Leica & Expedition Journal',
    category: 'Historic Artifact / Document',
    description: 'Classic brass rangefinder mechanical camera, October 1968 handwritten expedition notebook, and Brunton compass.',
    imageSrc: '/src/assets/images/sample_vintage_discovery_1791912787239.jpg',
    suggestedClue: 'Expedition notebook October 1968, vintage camera and compass',
  },
];
