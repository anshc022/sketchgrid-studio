export interface GridSettings {
  on: boolean;
  cols: number;
  width: number;
  color: string;
  opacity: number;
  labels: boolean;
  diag: boolean;
  thirds: boolean;
  radial: boolean;
  paper: string;
  paperOrient: 'v' | 'h';
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  exposure: number;
  saturation: number;
  grayscale: number;
  posterize: number;
  edge: 'off' | 'edges' | 'outline';
  edgeGain: number;
  tint: string;
  tintAmt: number;
}

export interface OrientSettings {
  rot: number;
  fh: boolean;
  fv: boolean;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Project {
  id: string;
  name: string;
  updated: number;
  img: string | null;
  orient: OrientSettings;
  crop: CropRect | null;
  grid: GridSettings;
  filters: FilterSettings;
}

export interface ProjectRecord {
  id: string;
  name: string;
  updated: number;
  thumb: string;
  data: {
    img: string | null;
    orient: OrientSettings;
    crop: CropRect | null;
    grid: GridSettings;
    filters: FilterSettings;
  };
}

export type ToolId = 'import' | 'crop' | 'grid' | 'filters' | 'effects' | 'split' | 'projects' | 'export' | null;
