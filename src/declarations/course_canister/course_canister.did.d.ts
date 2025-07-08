import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'add_course_section' : ActorMethod<
    [string, string, string],
    {
        'ok' : {
          'id' : string,
          'title' : string,
          'updated_at' : bigint,
          'published' : boolean,
          'token_reward' : bigint,
          'description' : string,
          'created_at' : bigint,
          'sections' : Array<
            {
              'id' : string,
              'title' : string,
              'content' : string,
              'order' : number,
            }
          >,
          'educator_id' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'create_course' : ActorMethod<
    [string, string, bigint],
    {
        'ok' : {
          'id' : string,
          'title' : string,
          'updated_at' : bigint,
          'published' : boolean,
          'token_reward' : bigint,
          'description' : string,
          'created_at' : bigint,
          'sections' : Array<
            {
              'id' : string,
              'title' : string,
              'content' : string,
              'order' : number,
            }
          >,
          'educator_id' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'create_educator_profile' : ActorMethod<
    [string, string, Array<string>],
    {
        'ok' : {
          'bio' : string,
          'updated_at' : bigint,
          'name' : string,
          'created_at' : bigint,
          'expertise' : Array<string>,
          'User_principal' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'get_course' : ActorMethod<
    [string],
    {
        'ok' : {
          'id' : string,
          'title' : string,
          'updated_at' : bigint,
          'published' : boolean,
          'token_reward' : bigint,
          'description' : string,
          'created_at' : bigint,
          'sections' : Array<
            {
              'id' : string,
              'title' : string,
              'content' : string,
              'order' : number,
            }
          >,
          'educator_id' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'get_educator_courses' : ActorMethod<
    [],
    Array<
      {
        'id' : string,
        'title' : string,
        'updated_at' : bigint,
        'published' : boolean,
        'token_reward' : bigint,
        'description' : string,
        'created_at' : bigint,
        'sections' : Array<
          {
            'id' : string,
            'title' : string,
            'content' : string,
            'order' : number,
          }
        >,
        'educator_id' : Principal,
      }
    >
  >,
  'get_educator_profile' : ActorMethod<
    [[] | [Principal]],
    {
        'ok' : {
          'bio' : string,
          'updated_at' : bigint,
          'name' : string,
          'created_at' : bigint,
          'expertise' : Array<string>,
          'User_principal' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'get_published_courses' : ActorMethod<
    [],
    Array<
      {
        'id' : string,
        'title' : string,
        'updated_at' : bigint,
        'published' : boolean,
        'token_reward' : bigint,
        'description' : string,
        'created_at' : bigint,
        'sections' : Array<
          {
            'id' : string,
            'title' : string,
            'content' : string,
            'order' : number,
          }
        >,
        'educator_id' : Principal,
      }
    >
  >,
  'publish_course' : ActorMethod<
    [string],
    {
        'ok' : {
          'id' : string,
          'title' : string,
          'updated_at' : bigint,
          'published' : boolean,
          'token_reward' : bigint,
          'description' : string,
          'created_at' : bigint,
          'sections' : Array<
            {
              'id' : string,
              'title' : string,
              'content' : string,
              'order' : number,
            }
          >,
          'educator_id' : Principal,
        }
      } |
      { 'err' : string }
  >,
}
