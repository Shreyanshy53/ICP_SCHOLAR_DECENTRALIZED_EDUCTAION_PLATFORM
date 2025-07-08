export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'complete_course' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'student_name' : IDL.Text,
              'course_title' : IDL.Text,
              'student_id' : IDL.Principal,
              'course_id' : IDL.Text,
              'completion_date' : IDL.Nat64,
              'certificate_id' : IDL.Text,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'create_student_profile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'bio' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'name' : IDL.Text,
              'created_at' : IDL.Nat64,
              'email' : IDL.Text,
              'User_principal' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'enroll_in_course' : IDL.Func(
        [IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'completed' : IDL.Bool,
              'enrolled_at' : IDL.Nat64,
              'student_id' : IDL.Principal,
              'course_id' : IDL.Text,
              'progress' : IDL.Vec(IDL.Text),
              'completed_at' : IDL.Opt(IDL.Nat64),
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'get_student_certificates' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'student_name' : IDL.Text,
              'course_title' : IDL.Text,
              'student_id' : IDL.Principal,
              'course_id' : IDL.Text,
              'completion_date' : IDL.Nat64,
              'certificate_id' : IDL.Text,
            })
          ),
        ],
        [],
      ),
    'get_student_enrollments' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'completed' : IDL.Bool,
              'enrolled_at' : IDL.Nat64,
              'student_id' : IDL.Principal,
              'course_id' : IDL.Text,
              'progress' : IDL.Vec(IDL.Text),
              'completed_at' : IDL.Opt(IDL.Nat64),
            })
          ),
        ],
        [],
      ),
    'get_student_profile' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'bio' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'name' : IDL.Text,
              'created_at' : IDL.Nat64,
              'email' : IDL.Text,
              'User_principal' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'mark_section_complete' : IDL.Func(
        [IDL.Text, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'completed' : IDL.Bool,
              'enrolled_at' : IDL.Nat64,
              'student_id' : IDL.Principal,
              'course_id' : IDL.Text,
              'progress' : IDL.Vec(IDL.Text),
              'completed_at' : IDL.Opt(IDL.Nat64),
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'update_student_profile' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'bio' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'name' : IDL.Text,
              'created_at' : IDL.Nat64,
              'email' : IDL.Text,
              'User_principal' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
