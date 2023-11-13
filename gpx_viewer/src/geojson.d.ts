export interface GeoJson {
  type: string
  name: string
  crs: Crs
  features: Feature[]
}

export interface Crs {
  type: string
  properties: Properties
}

export interface Properties {
  name: string
}

export interface Feature {
  type: string
  properties: Properties2
  geometry: Geometry
}

export interface Properties2 {
  track_fid: number
  track_seg_id: number
  track_seg_point_id: number
  ele: number
  time: string
  desc: string
}

export interface Geometry {
  type: string
  coordinates: number[]
}
