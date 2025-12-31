export type GroupKey = 'ceriseBouquet' | 'dollchestra' | 'miracraPark' | 'groupSongs' | 'edelNote';

export interface UserRanking {
  id: string;
  userName: string;
  profilePicture: string;
  rankings: Partial<Record<GroupKey, string[][]>>;
}

export interface UserRankingsData {
  version: string;
  lastUpdated: string;
  users: UserRanking[];
}

export interface UserRankingWithGroup extends UserRanking {
  currentGroup: GroupKey;
  currentRanking: string[][];
}
