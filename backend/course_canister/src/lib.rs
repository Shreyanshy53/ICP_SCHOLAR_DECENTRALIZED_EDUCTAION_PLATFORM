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
pub struct CourseSection {
    pub id: String,
    pub title: String,
    pub content: String,
    pub order: u32,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Course {
    pub id: String,
    pub title: String,
    pub description: String,
    pub educator_id: Principal,
    pub sections: Vec<CourseSection>,
    pub created_at: u64,
    pub updated_at: u64,
    pub published: bool,
    pub token_reward: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct EducatorProfile {
    pub principal: Principal,
    pub name: String,
    pub bio: String,
    pub expertise: Vec<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for Course {
    const BOUND: Bound = Bound::Bounded { max_size: 8192, is_fixed_size: false };

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}


impl Storable for EducatorProfile {
    const BOUND: Bound = Bound::Bounded { max_size: 2048, is_fixed_size: false };

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

    static COURSES: RefCell<StableBTreeMap<String, Course, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static EDUCATOR_PROFILES: RefCell<StableBTreeMap<Principal, EducatorProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
}

#[update]
pub fn create_educator_profile(name: String, bio: String, expertise: Vec<String>) -> Result<EducatorProfile, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    let profile = EducatorProfile {
        principal: caller,
        name,
        bio,
        expertise,
        created_at: now,
        updated_at: now,
    };
    
    EDUCATOR_PROFILES.with(|profiles| {
        profiles.borrow_mut().insert(caller, profile.clone());
    });
    
    Ok(profile)
}

#[query]
pub fn get_educator_profile(principal: Option<Principal>) -> Result<EducatorProfile, String> {
    let target_principal = principal.unwrap_or(ic_cdk::caller());
    
    EDUCATOR_PROFILES.with(|profiles| {
        profiles.borrow().get(&target_principal)
            .ok_or_else(|| "Educator profile not found".to_string())
    })
}

#[update]
pub fn create_course(title: String, description: String, token_reward: u64) -> Result<Course, String> {
    let caller = ic_cdk::caller();
    let now = time();
    let course_id = format!("{}_{}", caller.to_text(), now);
    
    // Check if educator profile exists
    EDUCATOR_PROFILES.with(|profiles| {
        if !profiles.borrow().contains_key(&caller) {
            return Err("Educator profile not found".to_string());
        }
        Ok(())
    })?;
    
    let course = Course {
        id: course_id.clone(),
        title,
        description,
        educator_id: caller,
        sections: Vec::new(),
        created_at: now,
        updated_at: now,
        published: false,
        token_reward,
    };
    
    COURSES.with(|courses| {
        courses.borrow_mut().insert(course_id, course.clone());
    });
    
    Ok(course)
}

#[update]
pub fn add_course_section(course_id: String, title: String, content: String) -> Result<Course, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        if let Some(mut course) = courses_map.get(&course_id) {
            if course.educator_id != caller {
                return Err("Only the course creator can add sections".to_string());
            }
            
            let section_id = format!("{}_{}", course_id, course.sections.len());
            let section = CourseSection {
                id: section_id,
                title,
                content,
                order: course.sections.len() as u32,
            };
            
            course.sections.push(section);
            course.updated_at = now;
            courses_map.insert(course_id, course.clone());
            Ok(course)
        } else {
            Err("Course not found".to_string())
        }
    })
}

#[update]
pub fn publish_course(course_id: String) -> Result<Course, String> {
    let caller = ic_cdk::caller();
    let now = time();
    
    COURSES.with(|courses| {
        let mut courses_map = courses.borrow_mut();
        if let Some(mut course) = courses_map.get(&course_id) {
            if course.educator_id != caller {
                return Err("Only the course creator can publish".to_string());
            }
            
            if course.sections.is_empty() {
                return Err("Course must have at least one section".to_string());
            }
            
            course.published = true;
            course.updated_at = now;
            courses_map.insert(course_id, course.clone());
            Ok(course)
        } else {
            Err("Course not found".to_string())
        }
    })
}

#[query]
pub fn get_course(course_id: String) -> Result<Course, String> {
    COURSES.with(|courses| {
        courses.borrow().get(&course_id)
            .ok_or_else(|| "Course not found".to_string())
    })
}

#[query]
pub fn get_published_courses() -> Vec<Course> {
    COURSES.with(|courses| {
        courses.borrow().iter()
            .filter(|(_, course)| course.published)
            .map(|(_, course)| course)
            .collect()
    })
}

#[query]
pub fn get_educator_courses() -> Vec<Course> {
    let caller = ic_cdk::caller();
    
    COURSES.with(|courses| {
        courses.borrow().iter()
            .filter(|(_, course)| course.educator_id == caller)
            .map(|(_, course)| course)
            .collect()
    })
}