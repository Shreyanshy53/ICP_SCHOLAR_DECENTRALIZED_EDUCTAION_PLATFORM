// Shared storage service that simulates blockchain data sharing across all users
// This uses a combination of localStorage and sessionStorage with cross-tab communication

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
    private storageKey = 'icp_scholar_shared_data';
    private updateCallbacks: Set<() => void> = new Set();
  
    constructor() {
      // Listen for storage changes from other tabs/windows
      try {
        window.addEventListener('storage', (e) => {
          if (e.key === this.storageKey) {
            this.notifyUpdates();
          }
        });
      } catch (error) {
        console.warn('Storage event listener setup failed:', error);
      }
  
      // Initialize with default data if empty
      this.initializeDefaultData();
    }
  
    private initializeDefaultData(): void {
      const existing = this.getSharedData();
      if (existing.courses.length === 0 && existing.peerNotes.length === 0) {
        // Add some default data to simulate existing blockchain state
        const defaultData: SharedData = {
          courses: [],
          peerNotes: [
            {
              id: 'default-note-1',
              course_id: 'course1',
              author: 'system',
              author_name: 'ICP Scholar Bot',
              content: 'Welcome to the peer exchange! Share your knowledge and help others learn.',
              note_type: 'Tip',
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              tips_received: 5
            }
          ],
          enrollments: [],
          certificates: [],
          educatorProfiles: {},
          studentProfiles: {},
          tokenBalances: {},
          transactions: {},
          lastUpdated: Date.now()
        };
        this.saveSharedData(defaultData);
      }
    }
  
    private getSharedData(): SharedData {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error('Error reading shared data:', error);
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
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        
        // Trigger storage event for cross-tab communication
        try {
          window.dispatchEvent(new StorageEvent('storage', {
            key: this.storageKey,
            newValue: JSON.stringify(data),
            storageArea: localStorage
          }));
        } catch (eventError) {
          console.warn('Storage event dispatch failed:', eventError);
        }
        
        // Also dispatch custom event for same-tab updates
        try {
          window.dispatchEvent(new CustomEvent('globalDataUpdate'));
        } catch (customEventError) {
          console.warn('Custom event dispatch failed:', customEventError);
        }
        
        this.notifyUpdates();
      } catch (error) {
        console.error('Error saving shared data:', error);
      }
    }
  
    private notifyUpdates(): void {
      this.updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in update callback:', error);
        }
      });
    }
  
    // Subscribe to data updates
    onUpdate(callback: () => void): () => void {
      this.updateCallbacks.add(callback);
      return () => this.updateCallbacks.delete(callback);
    }
  
    // Course operations
    addCourse(course: any): void {
      const data = this.getSharedData();
      // Remove any existing course with the same ID
      data.courses = data.courses.filter(c => c.id !== course.id);
      data.courses.push(course);
      this.saveSharedData(data);
    }
  
    getCourses(): any[] {
      return this.getSharedData().courses;
    }
  
    getPublishedCourses(): any[] {
      return this.getCourses().filter(course => course.published);
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
      }
    }
  
    getCourse(courseId: string): any | null {
      return this.getCourses().find(course => course.id === courseId) || null;
    }
  
    // Peer notes operations
    addPeerNote(note: any): void {
      const data = this.getSharedData();
      data.peerNotes.push(note);
      this.saveSharedData(data);
    }
  
    getPeerNotes(): any[] {
      return this.getSharedData().peerNotes;
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
      }
    }
  
    // Enrollment operations
    addEnrollment(enrollment: any): void {
      const data = this.getSharedData();
      // Remove existing enrollment for same student and course
      data.enrollments = data.enrollments.filter(
        e => !(e.student_id === enrollment.student_id && e.course_id === enrollment.course_id)
      );
      data.enrollments.push(enrollment);
      this.saveSharedData(data);
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
  
    // Certificate operations
    addCertificate(certificate: any): void {
      const data = this.getSharedData();
      data.certificates.push(certificate);
      this.saveSharedData(data);
    }
  
    getCertificates(): any[] {
      return this.getSharedData().certificates;
    }
  
    getStudentCertificates(studentId: string): any[] {
      return this.getCertificates().filter(c => c.student_id === studentId);
    }
  
    // Profile operations
    setEducatorProfile(principal: string, profile: any): void {
      const data = this.getSharedData();
      data.educatorProfiles[principal] = profile;
      this.saveSharedData(data);
    }
  
    getEducatorProfile(principal: string): any | null {
      return this.getSharedData().educatorProfiles[principal] || null;
    }
  
    setStudentProfile(principal: string, profile: any): void {
      const data = this.getSharedData();
      data.studentProfiles[principal] = profile;
      this.saveSharedData(data);
    }
  
    getStudentProfile(principal: string): any | null {
      return this.getSharedData().studentProfiles[principal] || null;
    }
  
    // Token operations
    getTokenBalance(principal: string): number {
      const data = this.getSharedData();
      return data.tokenBalances[principal] || 100; // Default balance
    }
  
    setTokenBalance(principal: string, balance: number): void {
      const data = this.getSharedData();
      data.tokenBalances[principal] = balance;
      this.saveSharedData(data);
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
      console.log('Shared Storage Data:', this.getSharedData());
    }
  }
  
  export const sharedStorage = new SharedStorageService();