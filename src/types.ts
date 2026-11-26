export type Role = 'explorer' | 'promoter';

export type Profile = {
  id: string;
  displayName: string;
  role: Role;
  interests: string[];
};

export type Ping = {
  id: string;
  creatorId: string | null;
  creatorName: string;
  title: string;
  category: string;
  description: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  kind: 'event' | 'place';
  startsAt: string | null;
  endsAt: string | null;
  pingEndsAt: string;
  radiusM: number;
  isPromoted: boolean;
  priceLabel: string;
  photoUrl: string | null;
  views: number;
  saved: number;
  going: number;
  directions: number;
  createdAt: string;
};

export type Review = {
  id: string;
  pingId: string;
  authorId: string | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  upvotes: number;
  createdAt: string;
};

export type Message = {
  id: string;
  pingId: string;
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
};

/** What the user is filling in while making a new ping. */
export type Draft = {
  photoUri: string | null;
  photoBase64: string | null;
  lat: number | null;
  lng: number | null;
  locationVerified: boolean;
  title: string;
  category: string;
  placeName: string;
  address: string;
  description: string;
  startsAt: string; // ISO
  lengthMin: number; // event length
  priceLabel: string;
  durationH: number; // how long the ping stays up
  radiusM: number;
  isPromoted: boolean;
};
