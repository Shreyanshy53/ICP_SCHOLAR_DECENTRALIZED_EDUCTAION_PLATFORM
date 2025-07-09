import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Identity } from '@dfinity/identity';
import { sharedStorage } from './sharedStorage';

// Import mock declarations for development
import { canisterId as studentCanisterId, idlFactory as studentIdlFactory } from '../declarations/student_canister';
import { canisterId as courseCanisterId, idlFactory as courseIdlFactory } from '../declarations/course_canister';
import { canisterId as tokenCanisterId, idlFactory as tokenIdlFactory } from '../declarations/token_canister';
import { canisterId as peerCanisterId, idlFactory as peerIdlFactory } from '../declarations/peer_canister';

// Detect if we're running through a canister URL
const isCanisterUrl = window.location.search.includes('canisterId=');
const host = import.meta.env.VITE_DFX_NETWORK === 'local' 
  ? (isCanisterUrl ? window.location.origin : 'http://localhost:4943')
  : 'https://ic0.app';

class AgentService {
  private agent: HttpAgent | null = null;
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private studentActor: any = null;
  private courseActor: any = null;
  private tokenActor: any = null;
  private peerActor: any = null;

  async init() {
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        },
        keyType: 'Ed25519'
      });
    } catch (error) {
      console.warn('AuthClient creation failed, using fallback:', error);
      // Create a mock auth client for development
      this.authClient = {
        getIdentity: () => ({
          getPrincipal: () => ({ 
            toText: () => 'mock-principal',
            isAnonymous: () => false 
          })
        }),
        login: (options: any) => {
          setTimeout(() => options.onSuccess?.(), 100);
          return Promise.resolve();
        },
        logout: () => Promise.resolve(),
        isAuthenticated: () => Promise.resolve(true)
      } as any;
    }
    
    this.identity = this.authClient.getIdentity();
    
    try {
      this.agent = new HttpAgent({
        host,
        identity: this.identity,
        retryTimes: 3,
        verifyQuerySignatures: false
      });

      if (import.meta.env.VITE_DFX_NETWORK === 'local') {
        try {
          await this.agent.fetchRootKey();
        } catch (rootKeyError) {
          console.warn('Failed to fetch root key, continuing without it:', rootKeyError);
        }
      }
    } catch (error) {
      console.warn('HttpAgent creation failed, using mock agent:', error);
      this.agent = null;
    }

    this.createActors();
  }

  private createActors() {
    // For development, use mock implementations
    this.studentActor = {
      create_student_profile: async (name: string, email: string, bio: string) => {
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          email,
          bio,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in shared storage
        sharedStorage.setStudentProfile(profile.principal, profile);
        
        return profile;
      },
      get_student_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentProfile(principal);
      },
      enroll_in_course: async (courseId: string) => {
        const enrollment = {
          student_id: this.identity?.getPrincipal().toText() || 'mock-principal',
          course_id: courseId,
          enrolled_at: Date.now() * 1000000,
          progress: [],
          completed: false,
          completed_at: null
        };
        
        // Store in shared storage
        sharedStorage.addEnrollment(enrollment);
        
        return enrollment;
      },
      get_student_enrollments: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentEnrollments(principal);
      },
      get_student_certificates: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentCertificates(principal);
      },
      mark_section_complete: async (courseId: string, sectionId: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const enrollments = sharedStorage.getStudentEnrollments(principal);
        const enrollment = enrollments.find((e: any) => e.course_id === courseId);
        
        if (enrollment) {
          // Add section to progress if not already there
          if (!enrollment.progress.includes(sectionId)) {
            const updatedProgress = [...enrollment.progress, sectionId];
            sharedStorage.updateEnrollment(principal, courseId, {
              progress: updatedProgress
            });
          }
          
          return sharedStorage.getStudentEnrollments(principal).find((e: any) => e.course_id === courseId);
        }
        
        throw new Error('Enrollment not found');
      },
      complete_course: async (courseId: string, courseTitle: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        
        // Update enrollment
        sharedStorage.updateEnrollment(principal, courseId, {
          completed: true,
          completed_at: Date.now() * 1000000
        });
        
        // Get student profile for certificate
        const studentProfile = sharedStorage.getStudentProfile(principal);
        const studentName = studentProfile?.name || 'Student';
        
        // Create certificate
        const certificate = {
          certificate_id: Math.random().toString(36).substr(2, 9),
          student_id: principal,
          course_id: courseId,
          course_title: courseTitle,
          completion_date: Date.now() * 1000000,
          student_name: studentName
        };
        
        // Store certificate
        sharedStorage.addCertificate(certificate);
        
        return certificate;
      }
    };

    this.peerActor = {
      create_peer_note: async (course_id: string, author_name: string, content: string, note_type: any) => {
        const note = {
          id: Math.random().toString(36).substr(2, 9),
          course_id,
          author: this.identity?.getPrincipal().toText() || 'mock-author',
          author_name,
          content,
          note_type: Object.keys(note_type)[0],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          tips_received: 0
        };
        
        // Store in shared storage
        sharedStorage.addPeerNote(note);
        
        return note;
      },
      get_user_notes: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getUserNotes(principal);
      },
      get_course_notes: async (course_id: string) => {
        return sharedStorage.getCourseNotes(course_id);
      },
      get_all_notes: async () => {
        return sharedStorage.getPeerNotes();
      },
      tip_peer_note: async (note_id: string, amount: number, message: string) => {
        // Find and update the note
        const notes = sharedStorage.getPeerNotes();
        const note = notes.find((n: any) => n.id === note_id);
        
        if (note) {
          sharedStorage.updatePeerNote(note_id, {
            tips_received: note.tips_received + amount
          });
        }
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          note_id,
          tipper: this.identity?.getPrincipal().toText() || 'mock-tipper',
          recipient: note?.author || 'mock-recipient',
          amount,
          timestamp: Date.now() * 1000000,
          message
        };
      }
    };

    this.courseActor = {
      create_educator_profile: async (name: string, bio: string, expertise: string[]) => {
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          bio,
          expertise,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in shared storage
        sharedStorage.setEducatorProfile(profile.principal, profile);
        
        return profile;
      },
      get_educator_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getEducatorProfile(principal);
      },
      create_course: async (title: string, description: string, token_reward: number) => {
        const course = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          description,
          educator_id: this.identity?.getPrincipal().toText() || 'mock-educator',
          sections: [],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          published: false,
          token_reward
        };
        
        // Store in shared storage
        sharedStorage.addCourse(course);
        
        return course;
      },
      get_educator_courses: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getEducatorCourses(principal);
      },
      get_published_courses: async () => {
        const publishedUserCourses = sharedStorage.getPublishedCourses();
        
        // Default courses that are always available
        const defaultCourses = [
            {
              id: "course1",
              title: "Introduction to Blockchain",
              description: "Master the fundamentals of blockchain technology, cryptocurrency, and distributed systems. This comprehensive course covers everything from basic concepts to advanced implementations.",
              educator_id: "prof-rajesh-kumar",
              educator_name: "Prof. Rajesh Kumar",
              institution: "IIT Bombay - Computer Science & Engineering",
              difficulty: "Beginner",
              duration: "6 weeks",
              rating: 4.8,
              enrolled_count: 1247,
              sections: [
                {
                  id: "intro-blockchain",
                  title: "What is Blockchain?",
                  content: `Welcome to the fascinating world of blockchain technology!

## Understanding Blockchain

Blockchain is a revolutionary technology that serves as a distributed ledger, maintaining a continuously growing list of records (blocks) that are linked and secured using cryptography. Think of it as a digital ledger that's shared across multiple computers, making it nearly impossible to hack or manipulate.

### Key Characteristics:

1. **Decentralization**: No single point of control
2. **Transparency**: All transactions are visible to network participants
3. **Immutability**: Once data is recorded, it's extremely difficult to change
4. **Security**: Cryptographic hashing ensures data integrity

### Real-World Applications:

- **Cryptocurrency**: Bitcoin, Ethereum, and other digital currencies
- **Supply Chain**: Tracking products from manufacture to consumer
- **Healthcare**: Secure patient record management
- **Voting Systems**: Transparent and tamper-proof elections
- **Real Estate**: Property ownership and transfer records

### How Blockchain Works:

1. **Transaction Initiation**: A user initiates a transaction
2. **Broadcasting**: The transaction is broadcast to the network
3. **Validation**: Network nodes validate the transaction
4. **Block Creation**: Valid transactions are bundled into a block
5. **Consensus**: The network agrees on the new block
6. **Addition**: The block is added to the chain

This process ensures that every transaction is verified by multiple parties, creating a trustless system where participants don't need to know or trust each other.

### Why Blockchain Matters:

Blockchain technology addresses fundamental issues in digital transactions:
- **Double Spending**: Prevents the same digital asset from being spent twice
- **Trust**: Eliminates the need for intermediaries
- **Censorship Resistance**: No single entity can block transactions
- **Global Access**: Available 24/7 worldwide

In the next section, we'll dive deeper into the cryptographic foundations that make blockchain secure and reliable.`,
                  order: 0
                },
                {
                  id: "crypto-foundations",
                  title: "Cryptographic Foundations",
                  content: `Understanding the cryptographic principles that secure blockchain networks.

## Hash Functions

Hash functions are mathematical algorithms that convert input data of any size into a fixed-size string of characters. In blockchain, we primarily use SHA-256 (Secure Hash Algorithm 256-bit).

### Properties of Cryptographic Hash Functions:

1. **Deterministic**: Same input always produces same output
2. **Fixed Output Size**: Always 256 bits for SHA-256
3. **Avalanche Effect**: Small input change drastically changes output
4. **One-Way Function**: Computationally infeasible to reverse
5. **Collision Resistant**: Nearly impossible to find two inputs with same output

### Example:
Input: "Hello, Blockchain!"
SHA-256 Output: 7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730

Input: "Hello, Blockchain?"
SHA-256 Output: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4

Notice how changing just one character completely changes the hash!

## Digital Signatures

Digital signatures provide authentication and non-repudiation in blockchain transactions.

### How Digital Signatures Work:

1. **Key Generation**: Create a public-private key pair
2. **Signing**: Use private key to sign transaction data
3. **Verification**: Others use public key to verify signature

### Benefits:
- **Authentication**: Proves who sent the transaction
- **Integrity**: Ensures data hasn't been tampered with
- **Non-repudiation**: Sender can't deny sending the transaction

## Merkle Trees

Merkle trees efficiently summarize all transactions in a block using a binary tree structure.

### Structure:
- **Leaf Nodes**: Individual transaction hashes
- **Internal Nodes**: Hash of two child nodes
- **Root**: Single hash representing entire block

### Advantages:
- **Efficient Verification**: Verify any transaction with log(n) hashes
- **Tamper Detection**: Any change invalidates the root hash
- **Scalability**: Handle millions of transactions efficiently

These cryptographic tools work together to create the security foundation that makes blockchain technology trustworthy and reliable.`,
                  order: 1
                },
                {
                  id: "consensus-mechanisms",
                  title: "Consensus Mechanisms",
                  content: `Learn how blockchain networks reach agreement without central authority.

## What is Consensus?

Consensus mechanisms are protocols that ensure all nodes in a blockchain network agree on the current state of the ledger. They solve the fundamental problem of achieving agreement in a distributed system.

## Proof of Work (PoW)

Used by Bitcoin and Ethereum (until 2022), PoW requires miners to solve computationally expensive puzzles.

### How PoW Works:

1. **Transaction Collection**: Miners gather pending transactions
2. **Block Creation**: Form a candidate block with transactions
3. **Puzzle Solving**: Find a nonce that makes block hash meet difficulty target
4. **Broadcasting**: Share the solution with the network
5. **Verification**: Other nodes verify and accept the block

### Advantages:
- **Security**: Extremely secure due to computational cost
- **Decentralization**: Anyone can participate as a miner
- **Proven Track Record**: Successfully securing Bitcoin since 2009

### Disadvantages:
- **Energy Consumption**: Requires massive computational power
- **Scalability**: Limited transaction throughput
- **Environmental Impact**: High electricity usage

## Proof of Stake (PoS)

Validators are chosen to create blocks based on their stake (ownership) in the network.

### How PoS Works:

1. **Staking**: Validators lock up tokens as collateral
2. **Selection**: Algorithm chooses validator based on stake and randomness
3. **Block Proposal**: Selected validator creates new block
4. **Attestation**: Other validators vote on the block's validity
5. **Finalization**: Block is added if it receives enough votes

### Advantages:
- **Energy Efficient**: No computational puzzles to solve
- **Scalability**: Faster transaction processing
- **Economic Security**: Validators lose stake for malicious behavior

### Disadvantages:
- **Wealth Concentration**: Rich validators get richer
- **Nothing at Stake**: Theoretical attack vector
- **Complexity**: More complex protocol design

## Other Consensus Mechanisms

### Delegated Proof of Stake (DPoS)
- Token holders vote for delegates who validate transactions
- Faster and more scalable than traditional PoS
- Used by EOS and Tron

### Proof of Authority (PoA)
- Pre-approved validators with known identities
- High performance and energy efficient
- Suitable for private and consortium blockchains

### Practical Byzantine Fault Tolerance (pBFT)
- Handles up to 1/3 malicious nodes
- Immediate finality
- Used in permissioned networks

## Choosing the Right Consensus

The choice of consensus mechanism depends on:
- **Security Requirements**: How much security is needed?
- **Scalability Needs**: How many transactions per second?
- **Decentralization Goals**: How distributed should the network be?
- **Energy Constraints**: What's the acceptable energy consumption?
- **Governance Model**: Who should control the network?

Understanding consensus mechanisms is crucial for evaluating different blockchain platforms and their trade-offs.`,
                  order: 2
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 50
            },
            {
              id: "course2",
              title: "Smart Contracts & DApp Development",
              description: "Master smart contract development and build decentralized applications. Learn Solidity, Web3.js, and modern DApp architecture patterns.",
              educator_id: "dr-priya-sharma",
              educator_name: "Dr. Priya Sharma",
              institution: "IIT Delhi - Computer Science & Engineering",
              difficulty: "Intermediate",
              duration: "8 weeks",
              rating: 4.9,
              enrolled_count: 892,
              sections: [
                {
                  id: "smart-contract-basics",
                  title: "Smart Contract Basics",
                  content: `Introduction to smart contracts and their revolutionary potential.

## What are Smart Contracts?

Smart contracts are self-executing contracts with terms directly written into code. They automatically execute when predetermined conditions are met, eliminating the need for intermediaries.

### Key Characteristics:

1. **Autonomous**: Execute automatically without human intervention
2. **Transparent**: Code is visible on the blockchain
3. **Immutable**: Cannot be changed once deployed (unless designed with upgrade mechanisms)
4. **Deterministic**: Same inputs always produce same outputs
5. **Distributed**: Executed across multiple nodes

### Benefits:

- **Trust**: No need to trust counterparties
- **Cost Reduction**: Eliminate intermediaries and their fees
- **Speed**: Instant execution when conditions are met
- **Accuracy**: Reduce human error in contract execution
- **Transparency**: All parties can verify contract terms

### Use Cases:

- **Insurance**: Automated claim processing
- **Supply Chain**: Automatic payments upon delivery
- **Real Estate**: Escrow and title transfers
- **Finance**: Lending, borrowing, and trading protocols
- **Gaming**: In-game asset ownership and trading

Understanding these fundamentals is crucial before diving into actual smart contract development.`,
                  order: 0
                },
                {
                  id: "solidity-programming",
                  title: "Solidity Programming Language",
                  content: `Master Solidity, the primary language for Ethereum smart contracts.

## Solidity Basics

Solidity is a statically-typed programming language designed for developing smart contracts on Ethereum.

### Contract Structure

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // State variables
    uint256 public myNumber;
    address public owner;
    
    // Events
    event NumberChanged(uint256 newNumber);
    
    // Constructor
    constructor() {
        owner = msg.sender;
        myNumber = 0;
    }
    
    // Functions
    function setNumber(uint256 _number) public {
        require(msg.sender == owner, "Only owner can set number");
        myNumber = _number;
        emit NumberChanged(_number);
    }
}
\`\`\`

### Data Types

#### Value Types
- **bool**: true or false
- **int/uint**: Signed/unsigned integers (8 to 256 bits)
- **address**: 20-byte Ethereum address
- **bytes**: Fixed-size byte arrays (bytes1 to bytes32)
- **string**: Dynamic UTF-8 encoded string

#### Reference Types
- **arrays**: Dynamic or fixed-size arrays
- **mapping**: Hash tables (key-value pairs)
- **struct**: Custom data structures

Mastering Solidity is essential for building secure and efficient smart contracts.`,
                  order: 1
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 75
            }
        ];
        
        // Combine default courses with all user-created published courses
        const allPublishedCourses = [...defaultCourses, ...publishedUserCourses];
        
        // Remove duplicates based on course ID
        const uniqueCourses = allPublishedCourses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
        
        return uniqueCourses;
      },
      get_course: async (id: string) => {
        // First check shared storage
        const sharedCourse = sharedStorage.getCourse(id);
        if (sharedCourse) {
          return sharedCourse;
        }
        
        // Then check default courses
        const allCourses = await this.courseActor.get_published_courses();
        return allCourses.find((c: any) => c.id === id) || null;
      },
      add_course_section: async (course_id: string, title: string, content: string) => {
        const course = sharedStorage.getCourse(course_id);
        
        if (course) {
          const newSection = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            content,
            order: course.sections.length
          };
          
          const updatedSections = [...course.sections, newSection];
          sharedStorage.updateCourse(course_id, {
            sections: updatedSections,
            updated_at: Date.now() * 1000000
          });
          
          return sharedStorage.getCourse(course_id);
        }
        
        throw new Error('Course not found');
      },
      publish_course: async (course_id: string) => {
        const course = sharedStorage.getCourse(course_id);
        
        if (course) {
          sharedStorage.updateCourse(course_id, {
            published: true,
            updated_at: Date.now() * 1000000
          });
          
          return sharedStorage.getCourse(course_id);
        }
        
        throw new Error('Course not found');
      }
    };

    this.tokenActor = {
      get_balance: async (principal?: string) => {
        const owner = principal || this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getTokenBalance(owner);
      },
      transfer_tokens: async (to: string, amount: number, memo: string) => {
        return {
          id: Math.random().toString(36).substr(2, 9),
          from: this.identity?.getPrincipal().toText() || 'mock-sender',
          to,
          amount,
          transaction_type: 'Transfer',
          timestamp: Date.now() * 1000000,
          memo
        };
      },
      get_transaction_history: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getTransactions(principal);
      },
      reward_course_completion: async (studentId: string, amount: number, courseId: string) => {
        // Update token balance in shared storage
        const currentBalance = sharedStorage.getTokenBalance(studentId);
        const newBalance = currentBalance + amount;
        sharedStorage.setTokenBalance(studentId, newBalance);
        
        // Store transaction record in shared storage
        const transaction = {
          id: `tx_${Date.now()}`,
          from: 'system',
          to: studentId,
          amount: amount,
          timestamp: Date.now() * 1000000,
          memo: `Course completion reward: ${courseId}`
        };
        sharedStorage.addTransaction(studentId, transaction);
        
        return {
          success: true,
          transaction_id: transaction.id,
          new_balance: newBalance
        };
      }
    };

    this.peerActor = {
      create_peer_note: async (course_id: string, author_name: string, content: string, note_type: any) => {
        const note = {
          id: Math.random().toString(36).substr(2, 9),
          course_id,
          author: this.identity?.getPrincipal().toText() || 'mock-author',
          author_name,
          content,
          note_type: Object.keys(note_type)[0],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          tips_received: 0
        };
        
        // Store note globally so all users can see it
        const allNotes = JSON.parse(localStorage.getItem('all_peer_notes') || '[]');
        allNotes.push(note);
        localStorage.setItem('all_peer_notes', JSON.stringify(allNotes));
        
        return note;
      },
      get_user_notes: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const allNotes = JSON.parse(localStorage.getItem('all_peer_notes') || '[]');
        
        // Return user's own notes
        return allNotes.filter((note: any) => note.author === principal);
      },
      get_course_notes: async (course_id: string) => {
        const allNotes = JSON.parse(localStorage.getItem('all_peer_notes') || '[]');
        
        // Return all notes for a specific course
        return allNotes.filter((note: any) => note.course_id === course_id);
      },
      get_all_notes: async () => {
        // Return all notes from all users
        return JSON.parse(localStorage.getItem('all_peer_notes') || '[]');
      },
      tip_peer_note: async (note_id: string, amount: number, message: string) => {
        // Update the note's tip count
        const allNotes = JSON.parse(localStorage.getItem('all_peer_notes') || '[]');
        const noteIndex = allNotes.findIndex((note: any) => note.id === note_id);
        
        if (noteIndex !== -1) {
          allNotes[noteIndex].tips_received += amount;
          localStorage.setItem('all_peer_notes', JSON.stringify(allNotes));
        }
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          note_id,
          tipper: this.identity?.getPrincipal().toText() || 'mock-tipper',
          recipient: 'mock-recipient',
          amount,
          timestamp: Date.now() * 1000000,
          message
        };
      }
    };
  }

  async login() {
    if (!this.authClient) return false;

    return new Promise<boolean>((resolve) => {
      try {
        this.authClient!.login({
          identityProvider: import.meta.env.VITE_DFX_NETWORK === 'local' 
            ? `${host}/?canisterId=${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY || 'rdmx6-jaaaa-aaaah-qdrqq-cai'}`
            : 'https://identity.ic0.app',
          onSuccess: () => {
            try {
              this.identity = this.authClient!.getIdentity();
              this.agent = new HttpAgent({
                host,
                identity: this.identity,
                verifyQuerySignatures: false
              });
              
              if (import.meta.env.VITE_DFX_NETWORK === 'local') {
                this.agent.fetchRootKey().catch(console.warn);
              }
              
              this.createActors();
              resolve(true);
            } catch (error) {
              console.warn('Login success handler failed:', error);
              resolve(false);
            }
          },
          onError: (error) => {
            console.warn('Login failed:', error);
            resolve(false);
          },
        });
      } catch (error) {
        console.warn('Login initiation failed:', error);
        resolve(false);
      }
    });
  }

  async logout() {
    if (!this.authClient) return;
    await this.authClient.logout();
    this.identity = null;
    this.agent = null;
    this.studentActor = null;
    this.courseActor = null;
    this.tokenActor = null;
    this.peerActor = null;
  }

  isAuthenticated(): boolean {
    return this.identity !== null && !this.identity.getPrincipal().isAnonymous();
  }

  getPrincipal() {
    return this.identity?.getPrincipal();
  }

  // Actor getters
  get student() {
    return this.studentActor;
  }

  get course() {
    return this.courseActor;
  }

  get token() {
    return this.tokenActor;
  }

  get peer() {
    return this.peerActor;
  }

  // Enhanced method to complete course with proper token rewards
  async completeCourseWithRewards(courseId: string, courseTitle: string, tokenReward: number): Promise<any> {
    if (!this.studentActor || !this.tokenActor || !this.identity) {
      throw new Error('Services not initialized');
    }

    try {
      // 1. Complete the course in student canister
      const certificate = await this.studentActor.complete_course(courseId, courseTitle);
      
      // 2. Award tokens to the student
      const principal = this.identity.getPrincipal().toText();
      await this.tokenActor.reward_course_completion(
        principal,
        tokenReward,
        courseId
      );

      // 3. Return certificate for PDF generation
      return certificate;
    } catch (error) {
      console.error('Error completing course with rewards:', error);
      throw error;
    }
  }

  // Method to get current token balance
  async getTokenBalance(): Promise<number> {
    if (!this.tokenActor || !this.identity) {
      return 0;
    }

    try {
      const principal = this.identity.getPrincipal().toText();
      return await this.tokenActor.get_balance(principal);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  // Method to refresh token balance
  async refreshTokenBalance(): Promise<number> {
    return await this.getTokenBalance();
  }
}

export const agentService = new AgentService();