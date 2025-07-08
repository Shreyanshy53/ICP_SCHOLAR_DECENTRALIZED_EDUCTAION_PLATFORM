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
pub struct PeerNote {
    pub id: String,
    pub course_id: String,
    pub author: Principal,
    pub author_name: String,
    pub content: String,
    pub note_type: NoteType,
    pub created_at: u64,
    pub updated_at: u64,
    pub tips_received: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum NoteType {
    Question,
    Answer,
    StudyNote,
    Tip,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PeerTip {
    pub id: String,
    pub note_id: String,
    pub tipper: Principal,
    pub recipient: Principal,
    pub amount: u64,
    pub timestamp: u64,
    pub message: String,
}

impl Storable for PeerNote {
    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl Storable for PeerTip {
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

    static PEER_NOTES: RefCell<StableBTreeMap<String, PeerNote, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static PEER_TIPS: RefCell<StableBTreeMap<String, PeerTip, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
}

#[update]
pub fn create_peer_note(course_id: String, author_name: String, content: String, note_type: NoteType) -> Result<PeerNote, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let note_id = format!("{}_{}", caller.to_text(), now);
    
    let note = PeerNote {
        id: note_id.clone(),
        course_id,
        author: caller,
        author_name,
        content,
        note_type,
        created_at: now,
        updated_at: now,
        tips_received: 0,
    };
    
    PEER_NOTES.with(|notes| {
        notes.borrow_mut().insert(note_id, note.clone());
    });
    
    Ok(note)
}

#[update]
pub fn update_peer_note(note_id: String, content: String) -> Result<PeerNote, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    PEER_NOTES.with(|notes| {
        let mut notes_map = notes.borrow_mut();
        if let Some(mut note) = notes_map.get(&note_id) {
            if note.author != caller {
                return Err("Only the author can update this note".to_string());
            }
            
            note.content = content;
            note.updated_at = now;
            notes_map.insert(note_id, note.clone());
            Ok(note)
        } else {
            Err("Note not found".to_string())
        }
    })
}

#[update]
pub fn tip_peer_note(note_id: String, amount: u64, message: String) -> Result<PeerTip, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let tip_id = format!("{}_{}", caller.to_text(), now);
    
    // Get the note to find the recipient
    let note = PEER_NOTES.with(|notes| {
        notes.borrow().get(&note_id)
            .ok_or_else(|| "Note not found".to_string())
    })?;
    
    if note.author == caller {
        return Err("Cannot tip your own note".to_string());
    }
    
    // Create tip record
    let tip = PeerTip {
        id: tip_id.clone(),
        note_id: note_id.clone(),
        tipper: caller,
        recipient: note.author,
        amount,
        timestamp: now,
        message,
    };
    
    // Update note's tips received
    PEER_NOTES.with(|notes| {
        let mut notes_map = notes.borrow_mut();
        if let Some(mut note) = notes_map.get(&note_id) {
            note.tips_received += amount;
            notes_map.insert(note_id, note);
        }
    });
    
    // Store tip
    PEER_TIPS.with(|tips| {
        tips.borrow_mut().insert(tip_id, tip.clone());
    });
    
    Ok(tip)
}

#[query]
pub fn get_course_notes(course_id: String) -> Vec<PeerNote> {
    PEER_NOTES.with(|notes| {
        notes.borrow().iter()
            .filter(|(_, note)| note.course_id == course_id)
            .map(|(_, note)| note)
            .collect()
    })
}

#[query]
pub fn get_user_notes(principal: Option<Principal>) -> Vec<PeerNote> {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    PEER_NOTES.with(|notes| {
        notes.borrow().iter()
            .filter(|(_, note)| note.author == target_principal)
            .map(|(_, note)| note)
            .collect()
    })
}

#[query]
pub fn get_note_tips(note_id: String) -> Vec<PeerTip> {
    PEER_TIPS.with(|tips| {
        tips.borrow().iter()
            .filter(|(_, tip)| tip.note_id == note_id)
            .map(|(_, tip)| tip)
            .collect()
    })
}

#[query]
pub fn get_user_tips_received(principal: Option<Principal>) -> Vec<PeerTip> {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    PEER_TIPS.with(|tips| {
        tips.borrow().iter()
            .filter(|(_, tip)| tip.recipient == target_principal)
            .map(|(_, tip)| tip)
            .collect()
    })
}