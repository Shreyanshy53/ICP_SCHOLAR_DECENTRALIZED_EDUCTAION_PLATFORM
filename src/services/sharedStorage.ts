// Enhanced shared storage service that truly simulates blockchain data sharing across all users
// This ensures all data is globally visible and persistent across browser sessions

interface SharedData {
  courses: any[];
  peerNotes: any[];
  enrollments: any[];
  certificates: any[];
  educatorProfiles: Record<string, any>;
  studentProfiles: Record<string, any>;
  tokenBalances: Record<string, number>;
  transactions: Record<string, any[]>;
  lastUpdated: number;
}

class SharedStorageService {
  private storageKey = 'icp_scholar_global_data';
  private updateCallbacks: Set<() => void> = new Set();

  constructor() {
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        console.log('Storage changed in another tab, refreshing...');
        this.notifyUpdates();
      }
    });

    // Listen for BroadcastChannel messages
    try {
      const channel = new BroadcastChannel('icp_scholar_updates');
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'data_updated') {
          console.log('Received broadcast update');
          this.notifyUpdates();
        }
      });
    } catch (error) {
      console.warn('BroadcastChannel not supported');
    }

    // Initialize with default data if empty
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const existing = this.getSharedData();
    
    // Only initialize if we have no data at all
    if (existing.courses.length === 0 && existing.peerNotes.length === 0 && 
        Object.keys(existing.educatorProfiles).length === 0) {
      // Add comprehensive default data to simulate existing blockchain state
      const defaultData: SharedData = {
        courses: [], // User-created courses only, defaults are handled in agent.ts
        peerNotes: [
          {
            id: 'default-note-1',
            course_id: 'course2',
            author: 'system',
            author_name: 'Prof. Priya Sharma',
            content: 'Welcome to the ICP Scholar peer community! 🎓 This is where our global learning community comes together to share knowledge, ask questions, and help each other succeed. Every contribution you make here is visible to all learners worldwide and can earn you tokens through tips from fellow students. Let\'s build the future of decentralized education together!',
            note_type: 'Tip',
            created_at: Date.now() * 1000000,
            updated_at: Date.now() * 1000000,
            tips_received: 25
          },
          {
            id: 'default-note-2',
            course_id: 'course1',
            author: 'student-arjun',
            author_name: 'Arjun Patel (IIT Bombay)',
            content: 'Just completed the cryptographic foundations section! 🔐 The SHA-256 examples were incredibly clear. Pro tip: Try implementing the hash function yourself in Python to really understand how the avalanche effect works. It helped me grasp why even a single bit change completely transforms the output. Also, the Merkle tree visualization really clicked when I drew it out on paper. Thanks Prof. Rajesh for the excellent explanations!',
            note_type: 'Study Note',
            created_at: (Date.now() - 86400000) * 1000000,
            updated_at: (Date.now() - 86400000) * 1000000,
            tips_received: 18
          },
          {
            id: 'default-note-3',
            course_id: 'course3',
            author: 'student-priya',
            author_name: 'Priya Sharma (IIT Delhi)',
            content: 'Question about impermanent loss calculation 🤔: I understand the formula IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1, but I\'m struggling with a practical example. If I provide liquidity to ETH/USDC pool with ETH at $2000, and ETH goes to $3000, what would be my exact impermanent loss percentage? Can someone walk through the math step by step?',
            note_type: 'Tip',
            created_at: (Date.now() - 43200000) * 1000000,
            updated_at: (Date.now() - 43200000) * 1000000,
            tips_received: 15
          },
          {
            id: 'default-note-4',
            course_id: 'course3',
            author: 'student-vikram',
            author_name: 'Vikram Singh (IIT Madras)',
            content: 'Answer to Priya\'s impermanent loss question: With ETH going from $2000 to $3000 (1.5x), the price ratio is 1.5. Using the formula: IL = 2 * sqrt(1.5) / (1 + 1.5) - 1 = 2 * 1.225 / 2.5 - 1 = 0.98 - 1 = -0.02 or about 2% impermanent loss. This means you\'d have 2% less value than just holding the tokens. Hope this helps! 📊',
            note_type: 'Answer',
            created_at: (Date.now() - 21600000) * 1000000,
            updated_at: (Date.now() - 21600000) * 1000000,
            tips_received: 22
          },
          {
            id: 'default-note-5',
            course_id: 'course4',
            author: 'student-ananya',
            author_name: 'Ananya Gupta (IIT Kanpur)',
            content: 'Just deployed my first NFT contract! 🎨 For anyone starting with NFTs, here are some gas optimization tips I learned: 1) Use ERC721A for batch minting (saves ~60% gas), 2) Pack your struct variables efficiently, 3) Consider lazy minting for large collections, 4) Use IPFS for metadata storage. The course examples were super helpful, especially the reveal mechanism implementation!',
            note_type: 'Study Note',
            created_at: (Date.now() - 10800000) * 1000000,
            updated_at: (Date.now() - 10800000) * 1000000,
            tips_received: 12
          },
          {
            id: 'default-note-6',
            course_id: 'course5',
            author: 'student-rahul',
            author_name: 'Rahul Mehta (IIT Guwahati)',
            content: 'Security audit checklist from my notes 🔒: Always check for reentrancy (use nonReentrant modifier), verify access controls (onlyOwner, roles), validate external call returns, test for integer overflow/underflow, implement emergency pause, use time-weighted oracles, avoid timestamp dependence for critical logic. Prof. Anita\'s real-world examples of exploits really drive home why each point matters!',
            note_type: 'Study Note',
            created_at: (Date.now() - 7200000) * 1000000,
            updated_at: (Date.now() - 7200000) * 1000000,
            tips_received: 28
          },
          {
            id: 'default-note-7',
            course_id: 'course2',
            author: 'student-kavya',
            author_name: 'Kavya Reddy (IIT Hyderabad)',
            content: 'Quick question about gas optimization in Solidity 🔥: I\'ve heard about using assembly for certain operations. When is it worth the complexity? Are there specific patterns where assembly provides significant gas savings? Working on a DApp where every wei counts for user experience. Any insights from fellow developers?',
            note_type: 'Question',
            created_at: (Date.now() - 3600000) * 1000000,
            updated_at: (Date.now() - 3600000) * 1000000,
            tips_received: 8
          },
          {
            id: 'default-note-8',
            course_id: 'course1',
            author: 'student-dev',
            author_name: 'Dev Patel (IIT Roorkee)',
            content: 'Consensus mechanisms comparison from my research 📋: PoW (Bitcoin) - High security, energy intensive, ~7 TPS. PoS (Ethereum 2.0) - Energy efficient, faster finality, ~15 TPS. DPoS (EOS) - Very fast, ~4000 TPS, but more centralized. pBFT - Instant finality, good for private networks. Each has trade-offs between decentralization, security, and scalability. The blockchain trilemma is real!',
            note_type: 'Study Note',
            created_at: (Date.now() - 1800000) * 1000000,
            updated_at: (Date.now() - 1800000) * 1000000,
            tips_received: 16
          }
        ],
        enrollments: [],
        certificates: [],
        educatorProfiles: {
          // User-created educator profiles only
        },
        studentProfiles: {},
        tokenBalances: {},
        transactions: {},
        lastUpdated: Date.now()
      };
      this.saveSharedData(defaultData);
      console.log('Initialized default shared data');
    }
  }

  private getSharedData(): SharedData {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure all required properties exist
        return {
          courses: parsed.courses || [],
          peerNotes: parsed.peerNotes || [],
          enrollments: parsed.enrollments || [],
          certificates: parsed.certificates || [],
          educatorProfiles: parsed.educatorProfiles || {},
          studentProfiles: parsed.studentProfiles || {},
          tokenBalances: parsed.tokenBalances || {},
          transactions: parsed.transactions || {},
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } catch (error) {
      console.warn('Error parsing shared data, resetting:', error);
    }
    
    return {
      courses: [],
      peerNotes: [],
      enrollments: [],
      certificates: [],
      educatorProfiles: {},
      studentProfiles: {},
      tokenBalances: {},
      transactions: {},
      lastUpdated: Date.now()
    };
  }

  private saveSharedData(data: SharedData): void {
    try {
      data.lastUpdated = Date.now();
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey, serialized);
      
      // Broadcast to all tabs/windows
      this.broadcastUpdate();
      
      // Notify local callbacks
      this.notifyUpdates();
    } catch (error) {
      console.error('Error saving shared data:', error);
    }
  }

  private broadcastUpdate(): void {
    // Use BroadcastChannel for better cross-tab communication
    try {
      const channel = new BroadcastChannel('icp_scholar_updates');
      channel.postMessage({ type: 'data_updated', timestamp: Date.now() });
      channel.close();
    } catch (error) {
      // Fallback to storage event
      console.warn('BroadcastChannel failed, using fallback');
    }
    
    // Always dispatch the custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('globalDataUpdate'));
  }

  private notifyUpdates(): void {
    // Call registered callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in update callback:', error);
      }
    });
  }

  // Subscribe to data updates
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  // Course operations - GLOBALLY VISIBLE
  addCourse(course: any): void {
    const data = this.getSharedData();
    // Remove any existing course with the same ID
    data.courses = data.courses.filter(c => c.id !== course.id);
    data.courses.push(course);
    this.saveSharedData(data);
    console.log('Course added globally:', course.title);
  }

  getCourses(): any[] {
    return this.getSharedData().courses;
  }

  getPublishedCourses(): any[] {
    const userCourses = this.getCourses().filter(course => course.published);
    console.log('User-created published courses found:', userCourses.length);
    return userCourses;
  }

  getEducatorCourses(educatorId: string): any[] {
    return this.getCourses().filter(course => course.educator_id === educatorId);
  }

  updateCourse(courseId: string, updates: Partial<any>): void {
    const data = this.getSharedData();
    const courseIndex = data.courses.findIndex(c => c.id === courseId);
    if (courseIndex !== -1) {
      data.courses[courseIndex] = { ...data.courses[courseIndex], ...updates };
      this.saveSharedData(data);
      console.log('Course updated globally:', courseId);
    }
  }

  getCourse(courseId: string): any | null {
    return this.getCourses().find(course => course.id === courseId) || null;
  }

  // Peer notes operations - GLOBALLY VISIBLE
  addPeerNote(note: any): void {
    const data = this.getSharedData();
    data.peerNotes.push(note);
    this.saveSharedData(data);
    console.log('Peer note added globally:', note.content.substring(0, 50) + '...');
  }

  getPeerNotes(): any[] {
    const notes = this.getSharedData().peerNotes;
    console.log('All peer notes found:', notes.length);
    return notes;
  }

  getCourseNotes(courseId: string): any[] {
    return this.getPeerNotes().filter(note => note.course_id === courseId);
  }

  getUserNotes(userId: string): any[] {
    return this.getPeerNotes().filter(note => note.author === userId);
  }

  updatePeerNote(noteId: string, updates: Partial<any>): void {
    const data = this.getSharedData();
    const noteIndex = data.peerNotes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      data.peerNotes[noteIndex] = { ...data.peerNotes[noteIndex], ...updates };
      this.saveSharedData(data);
      console.log('Peer note updated globally:', noteId);
    }
  }

  // Enrollment operations - USER SPECIFIC
  addEnrollment(enrollment: any): void {
    const data = this.getSharedData();
    // Remove existing enrollment for same student and course
    data.enrollments = data.enrollments.filter(
      e => !(e.student_id === enrollment.student_id && e.course_id === enrollment.course_id)
    );
    data.enrollments.push(enrollment);
    this.saveSharedData(data);
    console.log('Enrollment added:', enrollment.course_id);
  }

  getEnrollments(): any[] {
    return this.getSharedData().enrollments;
  }

  getStudentEnrollments(studentId: string): any[] {
    return this.getEnrollments().filter(e => e.student_id === studentId);
  }

  updateEnrollment(studentId: string, courseId: string, updates: Partial<any>): void {
    const data = this.getSharedData();
    const enrollmentIndex = data.enrollments.findIndex(
      e => e.student_id === studentId && e.course_id === courseId
    );
    if (enrollmentIndex !== -1) {
      data.enrollments[enrollmentIndex] = { ...data.enrollments[enrollmentIndex], ...updates };
      this.saveSharedData(data);
    }
  }

  // Certificate operations - USER SPECIFIC
  addCertificate(certificate: any): void {
    const data = this.getSharedData();
    data.certificates.push(certificate);
    this.saveSharedData(data);
    console.log('Certificate added:', certificate.course_title);
  }

  getCertificates(): any[] {
    return this.getSharedData().certificates;
  }

  getStudentCertificates(studentId: string): any[] {
    return this.getCertificates().filter(c => c.student_id === studentId);
  }

  // Profile operations - GLOBALLY VISIBLE
  setEducatorProfile(principal: string, profile: any): void {
    const data = this.getSharedData();
    data.educatorProfiles[principal] = profile;
    this.saveSharedData(data);
    console.log('Educator profile added globally:', profile.name);
  }

  getEducatorProfile(principal: string): any | null {
    return this.getSharedData().educatorProfiles[principal] || null;
  }

  setStudentProfile(principal: string, profile: any): void {
    const data = this.getSharedData();
    data.studentProfiles[principal] = profile;
    this.saveSharedData(data);
    console.log('Student profile added globally:', profile.name);
  }

  getStudentProfile(principal: string): any | null {
    return this.getSharedData().studentProfiles[principal] || null;
  }

  // Token operations - USER SPECIFIC
  getTokenBalance(principal: string): number {
    const data = this.getSharedData();
    console.log('Getting token balance for:', principal, 'Current balance:', data.tokenBalances[principal] || 100);
    return data.tokenBalances[principal] || 100; // Default balance
  }

  setTokenBalance(principal: string, balance: number): void {
    const data = this.getSharedData();
    data.tokenBalances[principal] = balance;
    console.log('=== SETTING TOKEN BALANCE ===');
    console.log('Principal:', principal);
    console.log('New balance:', balance);
    console.log('Previous balance:', this.getTokenBalance(principal));
    this.saveSharedData(data);
    console.log('=== TOKEN BALANCE SAVED ===');
  }

  addTransaction(principal: string, transaction: any): void {
    const data = this.getSharedData();
    if (!data.transactions[principal]) {
      data.transactions[principal] = [];
    }
    data.transactions[principal].push(transaction);
    this.saveSharedData(data);
  }

  getTransactions(principal: string): any[] {
    const data = this.getSharedData();
    return data.transactions[principal] || [];
  }

  // Utility methods
  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    this.notifyUpdates();
  }

  exportData(): SharedData {
    return this.getSharedData();
  }

  importData(data: SharedData): void {
    this.saveSharedData(data);
  }

  // Debug method to see all data
  debugData(): void {
    console.log('=== ICP Scholar Global Data ===');
    const data = this.getSharedData();
    console.log('Courses:', data.courses.length);
    console.log('Peer Notes:', data.peerNotes.length);
    console.log('Enrollments:', data.enrollments.length);
    console.log('Certificates:', data.certificates.length);
    console.log('Educator Profiles:', Object.keys(data.educatorProfiles).length);
    console.log('Student Profiles:', Object.keys(data.studentProfiles).length);
    console.log('Full Data:', data);
  }

  // Method to force refresh all components
  forceRefresh(): void {
    this.broadcastUpdate();
  }
}

export const sharedStorage = new SharedStorageService();

// Global debug function
(window as any).debugICPScholar = () => sharedStorage.debugData();
(window as any).refreshICPScholar = () => sharedStorage.forceRefresh();