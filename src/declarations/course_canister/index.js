import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from "./course_canister.did.js";
export { idlFactory } from "./course_canister.did.js";

/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
export const canisterId =
  process.env.CANISTER_ID_COURSE_CANISTER ||
  "by6od-j4aaa-aaaaa-qaadq-cai";
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

export const course_canister = createActor(canisterId);
*/
export const idlFactory = ({ IDL }: any) => {
  const Course = IDL.Record({
    'id': IDL.Text,
    'title': IDL.Text,
    'description': IDL.Text,
    'instructor': IDL.Text,
    'duration': IDL.Nat,
    'difficulty': IDL.Variant({
      'beginner': IDL.Null,
      'intermediate': IDL.Null,
      'advanced': IDL.Null,
    }),
    'enrolledStudents': IDL.Vec(IDL.Text),
    'maxStudents': IDL.Nat,
    'tokenReward': IDL.Nat,
  });
  return IDL.Service({
    'createCourse': IDL.Func([Course], [Course], []),
    'getCourse': IDL.Func([IDL.Text], [IDL.Opt(Course)], ['query']),
    'getAllCourses': IDL.Func([], [IDL.Vec(Course)], ['query']),
    'updateCourse': IDL.Func([IDL.Text, Course], [IDL.Bool], []),
    'deleteCourse': IDL.Func([IDL.Text], [IDL.Bool], []),
    'enrollStudent': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
  });
};

export interface Course {
  id: string;
  title: string;
  description: string;
  educator_id: string;
  sections: CourseSection[];
  created_at: number;
  updated_at: number;
  published: boolean;
  token_reward: number;
}

export interface CourseSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface EducatorProfile {
  principal: string;
  name: string;
  bio: string;
  expertise: string[];
  created_at: number;
  updated_at: number;
}

export interface CourseCanister {
  create_course: (title: string, description: string, token_reward: number) => Promise<Course>;
  get_course: (id: string) => Promise<Course | null>;
  get_published_courses: () => Promise<Course[]>;
  get_educator_courses: () => Promise<Course[]>;
  create_educator_profile: (name: string, bio: string, expertise: string[]) => Promise<EducatorProfile>;
  get_educator_profile: (principal?: string) => Promise<EducatorProfile | null>;
  add_course_section: (course_id: string, title: string, content: string) => Promise<boolean>;
  publish_course: (course_id: string) => Promise<boolean>;
  get_course: (id: string) => Promise<Course | null>;
}

// Mock canister instance
export const course_canister: CourseCanister = {
  create_course: async (title: string, description: string, token_reward: number) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      educator_id: 'mock-educator',
      sections: [],
      created_at: Date.now() * 1000000,
      updated_at: Date.now() * 1000000,
      published: true,
      token_reward
    };
  },
  get_course: async (id: string) => {
    return {
      id,
      title: "Introduction to Blockchain",
      description: "Learn the fundamentals of blockchain technology",
      educator_id: "Dr. Smith",
      sections: [
        {
          id: "section1",
          title: "Introduction",
          content: "Welcome to blockchain basics",
          order: 0
        }
      ],
      created_at: Date.now() * 1000000,
      updated_at: Date.now() * 1000000,
      published: true,
      token_reward: 10
    };
  },
  get_published_courses: async () => {
    return [
      {
        id: "course1",
        title: "Introduction to Blockchain",
        description: "Learn the fundamentals of blockchain technology",
        educator_id: "Dr. Smith",
        sections: [
          {
            id: "section1",
            title: "Introduction",
            content: "Welcome to blockchain basics",
            order: 0
          }
        ],
        created_at: Date.now() * 1000000,
        updated_at: Date.now() * 1000000,
        published: true,
        token_reward: 10
      },
      {
        id: "course2",
        title: "Advanced Smart Contracts",
        description: "Deep dive into smart contract development",
        educator_id: "Prof. Johnson",
        sections: [
          {
            id: "section1",
            title: "Smart Contract Basics",
            content: "Understanding smart contracts",
            order: 0
          },
          {
            id: "section2",
            title: "Advanced Patterns",
            content: "Complex smart contract patterns",
            order: 1
          }
        ],
        created_at: Date.now() * 1000000,
        updated_at: Date.now() * 1000000,
        published: true,
        token_reward: 25
      }
    ];
  },
  get_educator_courses: async () => {
    return [];
  },
  create_educator_profile: async (name: string, bio: string, expertise: string[]) => {
    return {
      principal: 'mock-principal',
      name,
      bio,
      expertise,
      created_at: Date.now() * 1000000,
      updated_at: Date.now() * 1000000
    };
  },
  get_educator_profile: async (principal?: string) => {
    return {
      principal: principal || 'mock-principal',
      name: "Mock Educator",
      bio: "Experienced educator",
      expertise: ["Blockchain", "Programming"],
      created_at: Date.now() * 1000000,
      updated_at: Date.now() * 1000000
    };
  },
  add_course_section: async (course_id: string, title: string, content: string) => {
    return true;
  },
  publish_course: async (course_id: string) => {
    return true;
  }
};