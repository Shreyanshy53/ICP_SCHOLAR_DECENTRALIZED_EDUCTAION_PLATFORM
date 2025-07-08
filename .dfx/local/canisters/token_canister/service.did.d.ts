import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'get_balance' : ActorMethod<[[] | [Principal]], bigint>,
  'get_total_supply' : ActorMethod<[], bigint>,
  'get_transaction_history' : ActorMethod<
    [[] | [Principal]],
    Array<
      {
        'id' : string,
        'to' : Principal,
        'transaction_type' : { 'Mint' : null } |
          { 'CourseReward' : null } |
          { 'Transfer' : null } |
          { 'PeerTip' : null },
        'from' : Principal,
        'memo' : string,
        'timestamp' : bigint,
        'amount' : bigint,
      }
    >
  >,
  'mint_tokens' : ActorMethod<
    [Principal, bigint, string],
    {
        'ok' : {
          'id' : string,
          'to' : Principal,
          'transaction_type' : { 'Mint' : null } |
            { 'CourseReward' : null } |
            { 'Transfer' : null } |
            { 'PeerTip' : null },
          'from' : Principal,
          'memo' : string,
          'timestamp' : bigint,
          'amount' : bigint,
        }
      } |
      { 'err' : string }
  >,
  'reward_course_completion' : ActorMethod<
    [Principal, bigint, string],
    {
        'ok' : {
          'id' : string,
          'to' : Principal,
          'transaction_type' : { 'Mint' : null } |
            { 'CourseReward' : null } |
            { 'Transfer' : null } |
            { 'PeerTip' : null },
          'from' : Principal,
          'memo' : string,
          'timestamp' : bigint,
          'amount' : bigint,
        }
      } |
      { 'err' : string }
  >,
  'tip_peer' : ActorMethod<
    [Principal, bigint, string],
    {
        'ok' : {
          'id' : string,
          'to' : Principal,
          'transaction_type' : { 'Mint' : null } |
            { 'CourseReward' : null } |
            { 'Transfer' : null } |
            { 'PeerTip' : null },
          'from' : Principal,
          'memo' : string,
          'timestamp' : bigint,
          'amount' : bigint,
        }
      } |
      { 'err' : string }
  >,
  'transfer_tokens' : ActorMethod<
    [Principal, bigint, string],
    {
        'ok' : {
          'id' : string,
          'to' : Principal,
          'transaction_type' : { 'Mint' : null } |
            { 'CourseReward' : null } |
            { 'Transfer' : null } |
            { 'PeerTip' : null },
          'from' : Principal,
          'memo' : string,
          'timestamp' : bigint,
          'amount' : bigint,
        }
      } |
      { 'err' : string }
  >,
}
