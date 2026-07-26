import { VoteType, VoteValue } from '../enums/vote';

export interface VoteDto {
  targetId: string;
  value: VoteValue;
  type: VoteType;
}
