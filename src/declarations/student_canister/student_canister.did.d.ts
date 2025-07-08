import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'complete_course' : ActorMethod<
    [string, string],
    {
        'ok' : {
          'student_name' : string,
          'course_title' : string,
          'student_id' : Principal,
          'course_id' : string,
          'completion_date' : bigint,
          'certificate_id' : string,
        }
      } |
      { 'err' : string }
  >,
  'create_student_profile' : ActorMethod<
    [string, string, string],
    {
        'ok' : {
          'bio' : string,
          'updated_at' : bigint,
          'name' : string,
          'created_at' : bigint,
          'email' : string,
          'User_principal' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'enroll_in_course' : ActorMethod<
    [string],
    {
        'ok' : {
          'completed' : boolean,
          'enrolled_at' : bigint,
          'student_id' : Principal,
          'course_id' : string,
          'progress' : Array<string>,
          'completed_at' : [] | [bigint],
        }
      } |
      { 'err' : string }
  >,
  'get_student_certificates' : ActorMethod<
    [],
    Array<
      {
        'student_name' : string,
        'course_title' : string,
        'student_id' : Principal,
        'course_id' : string,
        'completion_date' : bigint,
        'certificate_id' : string,
      }
    >
  >,
  'get_student_enrollments' : ActorMethod<
    [],
    Array<
      {
        'completed' : boolean,
        'enrolled_at' : bigint,
        'student_id' : Principal,
        'course_id' : string,
        'progress' : Array<string>,
        'completed_at' : [] | [bigint],
      }
    >
  >,
  'get_student_profile' : ActorMethod<
    [[] | [Principal]],
    {
        'ok' : {
          'bio' : string,
          'updated_at' : bigint,
          'name' : string,
          'created_at' : bigint,
          'email' : string,
          'User_principal' : Principal,
        }
      } |
      { 'err' : string }
  >,
  'mark_section_complete' : ActorMethod<
    [string, string],
    {
        'ok' : {
          'completed' : boolean,
          'enrolled_at' : bigint,
          'student_id' : Principal,
          'course_id' : string,
          'progress' : Array<string>,
          'completed_at' : [] | [bigint],
        }
      } |
      { 'err' : string }
  >,
  'update_student_profile' : ActorMethod<
    [[] | [string], [] | [string], [] | [string]],
    {
        'ok' : {
          'bio' : string,
          'updated_at' : bigint,
          'name' : string,
          'created_at' : bigint,
          'email' : string,
          'User_principal' : Principal,
        }
      } |
      { 'err' : string }
  >,
}
