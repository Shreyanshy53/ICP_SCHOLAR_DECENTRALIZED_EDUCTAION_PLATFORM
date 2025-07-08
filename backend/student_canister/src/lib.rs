use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
// DELETE THIS LINE
use ic_stable_structures::storable::{Bound, Storable};


use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};

use serde::Serialize;
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct StudentProfile {
    pub principal: Principal,
    pub name: String,
    pub email: String,
    pub bio: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Enrollment {
    pub student_id: Principal,
    pub course_id: String,
    pub enrolled_at: u64,
    pub progress: Vec<String>, // completed section IDs
    pub completed: bool,
    pub completed_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Certificate {
    pub student_id: Principal,
    pub course_id: String,
    pub student_name: String,
    pub course_title: String,
    pub completion_date: u64,
    pub certificate_id: String,
}



impl Storable for StudentProfile {
    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl Storable for Enrollment {
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

impl Storable for Certificate {
    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
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

    static STUDENT_PROFILES: RefCell<StableBTreeMap<Principal, StudentProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static ENROLLMENTS: RefCell<StableBTreeMap<String, Enrollment, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static CERTIFICATES: RefCell<StableBTreeMap<String, Certificate, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
}

#[update]
pub fn create_student_profile(name: String, email: String, bio: String) -> Result<StudentProfile, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    let profile = StudentProfile {
        principal: caller,
        name,
        email,
        bio,
        created_at: now,
        updated_at: now,
    };
    
    STUDENT_PROFILES.with(|profiles| {
        profiles.borrow_mut().insert(caller, profile.clone());
    });
    
    Ok(profile)
}

#[query]
pub fn get_student_profile(principal: Option<Principal>) -> Result<StudentProfile, String> {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    STUDENT_PROFILES.with(|profiles| {
        profiles.borrow().get(&target_principal)
            .ok_or_else(|| "Student profile not found".to_string())
    })
}

#[update]
pub fn update_student_profile(name: Option<String>, email: Option<String>, bio: Option<String>) -> Result<StudentProfile, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    STUDENT_PROFILES.with(|profiles| {
        let mut profiles_map = profiles.borrow_mut();
        if let Some(mut profile) = profiles_map.get(&caller) {
            if let Some(n) = name { profile.name = n; }
            if let Some(e) = email { profile.email = e; }
            if let Some(b) = bio { profile.bio = b; }
            profile.updated_at = now;
            
            profiles_map.insert(caller, profile.clone());
            Ok(profile)
        } else {
            Err("Student profile not found".to_string())
        }
    })
}

#[update]
pub fn enroll_in_course(course_id: String) -> Result<Enrollment, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let enrollment_key = format!("{}_{}", caller.to_text(), course_id);
    
    // Check if already enrolled
    ENROLLMENTS.with(|enrollments| {
        if enrollments.borrow().contains_key(&enrollment_key) {
            return Err("Already enrolled in this course".to_string());
        }
        
        let enrollment = Enrollment {
            student_id: caller,
            course_id,
            enrolled_at: now,
            progress: Vec::new(),
            completed: false,
            completed_at: None,
        };
        
        enrollments.borrow_mut().insert(enrollment_key, enrollment.clone());
        Ok(enrollment)
    })
}

#[update]
pub fn mark_section_complete(course_id: String, section_id: String) -> Result<Enrollment, String> {
    let caller = ic_cdk::caller();
    let enrollment_key = format!("{}_{}", caller.to_text(), course_id);
    
    ENROLLMENTS.with(|enrollments| {
        let mut enrollments_map = enrollments.borrow_mut();
        if let Some(mut enrollment) = enrollments_map.get(&enrollment_key) {
            if !enrollment.progress.contains(&section_id) {
                enrollment.progress.push(section_id);
                enrollments_map.insert(enrollment_key, enrollment.clone());
            }
            Ok(enrollment)
        } else {
            Err("Enrollment not found".to_string())
        }
    })
}

#[update]
pub fn complete_course(course_id: String, course_title: String) -> Result<Certificate, String> {
    let caller = ic_cdk::caller();
    let enrollment_key = format!("{}_{}", caller.to_text(), course_id);
    let now = time();
    
    // Get student profile
    let student_profile = STUDENT_PROFILES.with(|profiles| {
        profiles.borrow().get(&caller)
            .ok_or_else(|| "Student profile not found".to_string())
    })?;
    
    // Mark enrollment as completed
    ENROLLMENTS.with(|enrollments| {
        let mut enrollments_map = enrollments.borrow_mut();
        if let Some(mut enrollment) = enrollments_map.get(&enrollment_key) {
            enrollment.completed = true;
            enrollment.completed_at = Some(now);
            enrollments_map.insert(enrollment_key, enrollment);
        }
    });
    
    // Generate certificate
    let certificate_id = format!("{}_{}", caller.to_text(), course_id);
    let certificate = Certificate {
        student_id: caller,
        course_id,
        student_name: student_profile.name,
        course_title,
        completion_date: now,
        certificate_id: certificate_id.clone(),
    };
    
    CERTIFICATES.with(|certificates| {
        certificates.borrow_mut().insert(certificate_id, certificate.clone());
    });
    
    Ok(certificate)
}

#[query]
pub fn get_student_enrollments() -> Vec<Enrollment> {
    let caller = ic_cdk::caller();
    
    ENROLLMENTS.with(|enrollments| {
        enrollments.borrow().iter()
            .filter(|(_, enrollment)| enrollment.student_id == caller)
            .map(|(_, enrollment)| enrollment)
            .collect()
    })
}

#[query]
pub fn get_student_certificates() -> Vec<Certificate> {
    let caller = ic_cdk::caller();
    
    CERTIFICATES.with(|certificates| {
        certificates.borrow().iter()
            .filter(|(_, certificate)| certificate.student_id == caller)
            .map(|(_, certificate)| certificate)
            .collect()
    })
}