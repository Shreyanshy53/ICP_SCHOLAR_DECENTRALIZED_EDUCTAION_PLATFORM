export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'get_notes' : IDL.Func(
        [IDL.Text],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Text,
              'content' : IDL.Text,
              'author' : IDL.Principal,
              'posted_at' : IDL.Nat64,
            })
          ),
        ],
        [],
      ),
    'post_note' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'tip_peer' : IDL.Func(
        [IDL.Principal, IDL.Nat64],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
