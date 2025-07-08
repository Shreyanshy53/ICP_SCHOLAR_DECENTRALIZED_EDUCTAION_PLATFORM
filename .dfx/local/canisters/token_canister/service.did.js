export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'get_balance' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Nat64], []),
    'get_total_supply' : IDL.Func([], [IDL.Nat64], []),
    'get_transaction_history' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Text,
              'to' : IDL.Principal,
              'transaction_type' : IDL.Variant({
                'Mint' : IDL.Null,
                'CourseReward' : IDL.Null,
                'Transfer' : IDL.Null,
                'PeerTip' : IDL.Null,
              }),
              'from' : IDL.Principal,
              'memo' : IDL.Text,
              'timestamp' : IDL.Nat64,
              'amount' : IDL.Nat64,
            })
          ),
        ],
        [],
      ),
    'mint_tokens' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'to' : IDL.Principal,
              'transaction_type' : IDL.Variant({
                'Mint' : IDL.Null,
                'CourseReward' : IDL.Null,
                'Transfer' : IDL.Null,
                'PeerTip' : IDL.Null,
              }),
              'from' : IDL.Principal,
              'memo' : IDL.Text,
              'timestamp' : IDL.Nat64,
              'amount' : IDL.Nat64,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'reward_course_completion' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'to' : IDL.Principal,
              'transaction_type' : IDL.Variant({
                'Mint' : IDL.Null,
                'CourseReward' : IDL.Null,
                'Transfer' : IDL.Null,
                'PeerTip' : IDL.Null,
              }),
              'from' : IDL.Principal,
              'memo' : IDL.Text,
              'timestamp' : IDL.Nat64,
              'amount' : IDL.Nat64,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'tip_peer' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'to' : IDL.Principal,
              'transaction_type' : IDL.Variant({
                'Mint' : IDL.Null,
                'CourseReward' : IDL.Null,
                'Transfer' : IDL.Null,
                'PeerTip' : IDL.Null,
              }),
              'from' : IDL.Principal,
              'memo' : IDL.Text,
              'timestamp' : IDL.Nat64,
              'amount' : IDL.Nat64,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
    'transfer_tokens' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Text],
        [
          IDL.Variant({
            'ok' : IDL.Record({
              'id' : IDL.Text,
              'to' : IDL.Principal,
              'transaction_type' : IDL.Variant({
                'Mint' : IDL.Null,
                'CourseReward' : IDL.Null,
                'Transfer' : IDL.Null,
                'PeerTip' : IDL.Null,
              }),
              'from' : IDL.Principal,
              'memo' : IDL.Text,
              'timestamp' : IDL.Nat64,
              'amount' : IDL.Nat64,
            }),
            'err' : IDL.Text,
          }),
        ],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
