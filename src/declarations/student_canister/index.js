import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from "./student_canister.did.js";
export { idlFactory } from "./student_canister.did.js";

/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
export const canisterId =
  process.env.CANISTER_ID_STUDENT_CANISTER ||
  "asrmz-lmaaa-aaaaa-qaaeq-cai";
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

export const student_canister = createActor(canisterId);
*/
export const idlFactory = ({ IDL }: any) => {
  const Student = IDL.Record({
    'id': IDL.Text,
    'name': IDL.Text,
    'email': IDL.Text,
    'enrolledCourses': IDL.Vec(IDL.Text),
    'completedCourses': IDL.Vec(IDL.Text),
    'tokens': IDL.Nat,
  });
  return IDL.Service({
    'createStudent': IDL.Func([IDL.Text, IDL.Text], [Student], []),
    'getStudent': IDL.Func([IDL.Text], [IDL.Opt(Student)], ['query']),
    'updateStudent': IDL.Func([IDL.Text, Student], [IDL.Bool], []),
    'enrollInCourse': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'completeCourse': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'getStudentTokens': IDL.Func([IDL.Text], [IDL.Nat], ['query']),
  });
};

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  completedCourses: string[];
  tokens: number;
}

export interface StudentCanister {
  createStudent: (name: string, email: string) => Promise<Student>;
  getStudent: (id: string) => Promise<Student | null>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<boolean>;
  enrollInCourse: (studentId: string, courseId: string) => Promise<boolean>;
  completeCourse: (studentId: string, courseId: string) => Promise<boolean>;
  getStudentTokens: (studentId: string) => Promise<number>;
  enroll_in_course: (courseId: string) => Promise<any>;
  get_student_enrollments: () => Promise<any[]>;
  get_student_certificates: () => Promise<any[]>;
  mark_section_complete: (courseId: string, sectionId: string) => Promise<any>;
  complete_course: (courseId: string, courseTitle: string) => Promise<any>;
}

// Mock canister instance
export const student_canister: StudentCanister = {
  createStudent: async (name: string, email: string) => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      enrolledCourses: [],
      completedCourses: [],
      tokens: 0
    };
  },
  getStudent: async (id: string) => {
    // Mock implementation
    return {
      id,
      name: "Mock Student",
      email: "student@example.com",
      enrolledCourses: ["course1", "course2"],
      completedCourses: ["course3"],
      tokens: 100
    };
  },
  updateStudent: async (id: string, student: Partial<Student>) => {
    return true;
  },
  enrollInCourse: async (studentId: string, courseId: string) => {
    return true;
  },
  completeCourse: async (studentId: string, courseId: string) => {
    return true;
  },
  getStudentTokens: async (studentId: string) => {
    return 100;
  }
};