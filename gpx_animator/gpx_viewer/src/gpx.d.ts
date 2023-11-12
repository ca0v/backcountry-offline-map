export interface Gpx {
  "@attributes": Attributes;
  "#text": string[];
  trk: Trk[];
}

export interface Attributes {
  version: string;
  creator: string;
}

export interface Attributes {
  lat: string;
  lon: string;
}

export interface Trk {
  "@attributes": Attributes;
  "#text": string[];
  name: Name;
  desc: Desc;
  trkseg: Trkseg;
}

export interface Name {
  "@attributes": Attributes;
  "#text": string;
}

export interface Desc {
  "@attributes": Attributes;
  "#text": string;
}

export interface Trkseg {
  "@attributes": Attributes;
  "#text": string[];
  trkpt: Trkpt[];
}

export interface Trkpt {
  "@attributes": Attributes;
  "#text": string[];
  ele: Ele;
  time: Time;
  desc: Desc2;
}

export interface Ele {
  "@attributes": Attributes;
  "#text": string;
}

export interface Time {
  "@attributes": Attributes;
  "#text": string;
}

export interface Desc2 {
  "@attributes": Attributes;
  "#text": string;
}