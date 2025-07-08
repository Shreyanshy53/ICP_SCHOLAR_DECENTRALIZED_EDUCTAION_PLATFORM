export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'add_course_section' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'create_course' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat64],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'create_educator_profile' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Vec(IDL.Text)],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'bio' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'name' : IDL.Text,
              'created_at' : IDL.Nat64,
              'expertise' : IDL.Vec(IDL.Text),
              'User_principal' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'get_course' : IDL.Func(
        [IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'get_educator_courses' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            })
          ),
        ],
        [],
      ),
    'get_educator_profile' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'bio' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'name' : IDL.Text,
              'created_at' : IDL.Nat64,
              'expertise' : IDL.Vec(IDL.Text),
              'User_principal' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'get_published_courses' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            })
          ),
        ],
        [],
      ),
    'publish_course' : IDL.Func(
        [IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'title' : IDL.Text,
              'updated_at' : IDL.Nat64,
              'published' : IDL.Bool,
              'token_reward' : IDL.Nat64,
              'description' : IDL.Text,
              'created_at' : IDL.Nat64,
              'sections' : IDL.Vec(
                IDL.Record({
                  'id' : IDL.Text,
                  'title' : IDL.Text,
                  'content' : IDL.Text,
                  'order' : IDL.Nat32,
                })
              ),
              'educator_id' : IDL.Principal,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
