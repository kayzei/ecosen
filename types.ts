
export type ScanMode = 'waste' | 'crop' | 'water';

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: [number, number, number, number]; // [x_min, y_min, x_max, y_max] as percentages
}

export interface ScanHistoryItem {
  id: number;
  image: string;
  detections: DetectedObject[];
  mode: ScanMode;
}
