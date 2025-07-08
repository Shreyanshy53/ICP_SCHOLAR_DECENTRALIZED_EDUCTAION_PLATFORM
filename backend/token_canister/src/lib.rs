use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::{Bound, Storable};

use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};

use serde::Serialize;
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct TokenBalance {
    pub owner: Principal,
    pub balance: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct TokenTransaction {
    pub id: String,
    pub from: Principal,
    pub to: Principal,
    pub amount: u64,
    pub transaction_type: TransactionType,
    pub timestamp: u64,
    pub memo: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum TransactionType {
    Mint,
    Transfer,
    CourseReward,
    PeerTip,
}



impl Storable for TokenBalance {
    const BOUND: Bound = Bound::Bounded {
        max_size: 256,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl Storable for TokenTransaction {
    const BOUND: Bound = Bound::Bounded {
        max_size: 512,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static BALANCES: RefCell<StableBTreeMap<Principal, TokenBalance, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static TRANSACTIONS: RefCell<StableBTreeMap<String, TokenTransaction, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static TOTAL_SUPPLY: RefCell<u64> = RefCell::new(0);
}

#[update]
pub fn mint_tokens(to: Principal, amount: u64, memo: String) -> Result<TokenTransaction, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let transaction_id = format!("{}_{}", now, caller.to_text());
    
    // Update balance
    BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        let mut balance = balances_map.get(&to).unwrap_or(TokenBalance {
            owner: to,
            balance: 0,
            updated_at: now,
        });
        
        balance.balance += amount;
        balance.updated_at = now;
        balances_map.insert(to, balance);
    });
    
    // Update total supply
    TOTAL_SUPPLY.with(|supply| {
        *supply.borrow_mut() += amount;
    });
    
    // Record transaction
    let transaction = TokenTransaction {
        id: transaction_id.clone(),
        from: caller,
        to,
        amount,
        transaction_type: TransactionType::Mint,
        timestamp: now,
        memo,
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction.clone());
    });
    
    Ok(transaction)
}

#[update]
pub fn transfer_tokens(to: Principal, amount: u64, memo: String) -> Result<TokenTransaction, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let transaction_id = format!("{}_{}", now, caller.to_text());
    
    // Check sender balance
    let sender_balance = BALANCES.with(|balances| {
        balances.borrow().get(&caller).map(|b| b.balance).unwrap_or(0)
    });
    
    if sender_balance < amount {
        return Err("Insufficient balance".to_string());
    }
    
    // Update balances
    BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        
        // Deduct from sender
        let mut sender_balance = balances_map.get(&caller).unwrap();
        sender_balance.balance -= amount;
        sender_balance.updated_at = now;
        balances_map.insert(caller, sender_balance);
        
        // Add to recipient
        let mut recipient_balance = balances_map.get(&to).unwrap_or(TokenBalance {
            owner: to,
            balance: 0,
            updated_at: now,
        });
        recipient_balance.balance += amount;
        recipient_balance.updated_at = now;
        balances_map.insert(to, recipient_balance);
    });
    
    // Record transaction
    let transaction = TokenTransaction {
        id: transaction_id.clone(),
        from: caller,
        to,
        amount,
        transaction_type: TransactionType::Transfer,
        timestamp: now,
        memo,
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction.clone());
    });
    
    Ok(transaction)
}

#[update]
pub fn reward_course_completion(student: Principal, amount: u64, course_id: String) -> Result<TokenTransaction, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let transaction_id = format!("{}_{}", now, caller.to_text());
    
    // Update balance
    BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        let mut balance = balances_map.get(&student).unwrap_or(TokenBalance {
            owner: student,
            balance: 0,
            updated_at: now,
        });
        
        balance.balance += amount;
        balance.updated_at = now;
        balances_map.insert(student, balance);
    });
    
    // Record transaction
    let transaction = TokenTransaction {
        id: transaction_id.clone(),
        from: caller,
        to: student,
        amount,
        transaction_type: TransactionType::CourseReward,
        timestamp: now,
        memo: format!("Course completion reward: {}", course_id),
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction.clone());
    });
    
    Ok(transaction)
}

#[update]
pub fn tip_peer(to: Principal, amount: u64, memo: String) -> Result<TokenTransaction, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let transaction_id = format!("{}_{}", now, caller.to_text());
    
    // Check sender balance
    let sender_balance = BALANCES.with(|balances| {
        balances.borrow().get(&caller).map(|b| b.balance).unwrap_or(0)
    });
    
    if sender_balance < amount {
        return Err("Insufficient balance".to_string());
    }
    
    // Update balances
    BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        
        // Deduct from sender
        let mut sender_balance = balances_map.get(&caller).unwrap();
        sender_balance.balance -= amount;
        sender_balance.updated_at = now;
        balances_map.insert(caller, sender_balance);
        
        // Add to recipient
        let mut recipient_balance = balances_map.get(&to).unwrap_or(TokenBalance {
            owner: to,
            balance: 0,
            updated_at: now,
        });
        recipient_balance.balance += amount;
        recipient_balance.updated_at = now;
        balances_map.insert(to, recipient_balance);
    });
    
    // Record transaction
    let transaction = TokenTransaction {
        id: transaction_id.clone(),
        from: caller,
        to,
        amount,
        transaction_type: TransactionType::PeerTip,
        timestamp: now,
        memo,
    };
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow_mut().insert(transaction_id, transaction.clone());
    });
    
    Ok(transaction)
}

#[query]
pub fn get_balance(principal: Option<Principal>) -> u64 {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    BALANCES.with(|balances| {
        balances.borrow().get(&target_principal).map(|b| b.balance).unwrap_or(0)
    })
}

#[query]
pub fn get_transaction_history(principal: Option<Principal>) -> Vec<TokenTransaction> {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    TRANSACTIONS.with(|transactions| {
        transactions.borrow().iter()
            .filter(|(_, tx)| tx.from == target_principal || tx.to == target_principal)
            .map(|(_, tx)| tx)
            .collect()
    })
}

#[query]
pub fn get_total_supply() -> u64 {
    TOTAL_SUPPLY.with(|supply| *supply.borrow())
}