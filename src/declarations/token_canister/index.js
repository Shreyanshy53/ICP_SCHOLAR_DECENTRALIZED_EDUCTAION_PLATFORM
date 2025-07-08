import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from "./token_canister.did.js";
export { idlFactory } from "./token_canister.did.js";

/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
export const canisterId =
  process.env.CANISTER_ID_TOKEN_CANISTER ||
  "avqkn-guaaa-aaaaa-qaaea-cai";
/*
export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const token_canister = createActor(canisterId);
*/
export const idlFactory = ({ IDL }: any) => {
  const TokenBalance = IDL.Record({
    'owner': IDL.Text,
    'balance': IDL.Nat,
  });
  const TokenTransaction = IDL.Record({
    'id': IDL.Text,
    'from': IDL.Text,
    'to': IDL.Text,
    'amount': IDL.Nat,
    'timestamp': IDL.Nat64,
    'reason': IDL.Text,
  });
  return IDL.Service({
    'getBalance': IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'transfer': IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Text], [IDL.Bool], []),
    'mint': IDL.Func([IDL.Text, IDL.Nat, IDL.Text], [IDL.Bool], []),
    'burn': IDL.Func([IDL.Text, IDL.Nat], [IDL.Bool], []),
    'getTransactionHistory': IDL.Func([IDL.Text], [IDL.Vec(TokenTransaction)], ['query']),
    'getTotalSupply': IDL.Func([], [IDL.Nat], ['query']),
  });
};

export interface TokenBalance {
  owner: string;
  balance: number;
}

export interface TokenTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  reason: string;
}

export interface TokenCanister {
  getBalance: (owner: string) => Promise<number>;
  transfer: (from: string, to: string, amount: number, reason: string) => Promise<boolean>;
  mint: (to: string, amount: number, reason: string) => Promise<boolean>;
  burn: (from: string, amount: number) => Promise<boolean>;
  getTransactionHistory: (owner: string) => Promise<TokenTransaction[]>;
  getTotalSupply: () => Promise<number>;
  reward_course_completion: (student: string, amount: number, courseId: string) => Promise<any>;
}

// Mock canister instance
export const token_canister: TokenCanister = {
  getBalance: async (owner: string) => {
    return 100;
  },
  transfer: async (from: string, to: string, amount: number, reason: string) => {
    return true;
  },
  mint: async (to: string, amount: number, reason: string) => {
    return true;
  },
  burn: async (from: string, amount: number) => {
    return true;
  },
  getTransactionHistory: async (owner: string) => {
    return [
      {
        id: "tx1",
        from: "system",
        to: owner,
        amount: 50,
        timestamp: Date.now() - 86400000,
        reason: "Course completion reward"
      },
      {
        id: "tx2",
        from: owner,
        to: "peer1",
        amount: 10,
        timestamp: Date.now() - 43200000,
        reason: "Peer tutoring payment"
      }
    ];
  },
  getTotalSupply: async () => {
    return 10000;
  }
};