import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'get_notes' : ActorMethod<
    [string],
    Array<
      {
        'id' : string,
        'content' : string,
        'author' : Principal,
        'posted_at' : bigint,
      }
    >
  >,
  'post_note' : ActorMethod<[string, string], undefined>,
  'tip_peer' : ActorMethod<
    [Principal, bigint],
    { 'ok' : string } |
      { 'err' : string }
  >,
}
