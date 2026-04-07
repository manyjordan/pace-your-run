export type GPSTracePoint = {
  lat: number;
  lng: number;
  time: number;
};

// TODO: migrate to RunRow
export type CommunityPost = {
  id: number;
  user: string;
  initials: string;
  time: string;
  type: "run" | "race";
  title: string;
  description: string;
  stats: { distance: string; pace: string; duration: string; elevation: string };
  likes: number;
  comments: number;
  liked: boolean;
  gpsTrace?: GPSTracePoint[];
};
