export type TrackType = 'fabric' | 'pvc' | 'gkl' | 'surface' | 'other';
export type MountType = 'surface' | 'built_in' | 'harpoon' | 'other';
export type ShapeType = 'straight' | 'l_shaped' | 's_shaped' | 'u_shaped' | 'closed' | 'custom';

export interface ShapeDims {
  length?: number;
  width?: number;
  length2?: number;
  segments?: number[];
  corners?: number;
}

export interface Construction {
  id: string;
  shape: ShapeType;
  dims: ShapeDims;
  totalLength: number;
  cornersCount: number;
  isClosed: boolean;
}

export interface SpecItem {
  article: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  price: number | null;
  note?: string;
  angle_options?: AngleOptions;
  selected_option?: string;
  sort?: number;
}

export interface AngleOptions {
  has_connector: boolean;
  has_flex: boolean;
  connector: { article: string; name: string; price: number | null } | null;
  flex: { article: string; name: string; price: number | null } | null;
  cut_45: { name: string; note: string; price: number };
}

export interface SpecSummary {
  total_length_m: number;
  total_track_count: number;
  total_corners: number;
  straight_joints: number;
  constructions_count: number;
  end_caps_qty: number;
  mounts_qty: number;
  power_inlets_qty: number;
  total_price: number;
}

export interface Product {
  id: number;
  article: string;
  name: string;
  description: string;
  category: string;
  voltage: number | null;
  brand: string;
  unit: string;
  image_url: string | null;
  params: Record<string, unknown>;
  series_name: string | null;
  supplier_name: string;
  price: number | null;
  stock_qty: number;
}

export interface ProjectState {
  step: number;
  trackType: TrackType | null;
  mountType: MountType | null;
  voltage: number | null;
  color: string | null;
  supplierCode: string;
  constructions: Construction[];
  spec: SpecItem[];
  summary: SpecSummary | null;
  selectedLuminaires: { product: Product; qty: number }[];
  angleChoices: Record<string, string>; // article -> 'connector'|'flex'|'cut_45'
}
