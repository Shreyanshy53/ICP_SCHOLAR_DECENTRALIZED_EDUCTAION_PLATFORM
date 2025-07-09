// Global storage service to simulate blockchain data sharing
// In a real application, this would be handled by the blockchain canisters

interface GlobalData {
    courses: any[];
    peerNotes: any[];
    enrollments: any[];
    certificates: any[];
    educatorProfiles: Record<string, any>;
    studentProfiles: Record<string, any>;
    lastUpdated: number;
  }
  
  class GlobalStorageService {
    private storageKey = 'icp_scholar_global_data';
    private updateCallbacks: Set<() => void> = new Set();
  
    private getGlobalData(): GlobalData {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error('Error reading global data:', error);
      }
      
      return {
        courses: [],
        peerNotes: [],
        enrollments: [],
        certificates: [],
        educatorProfiles: {},
        studentProfiles: {},
        lastUpdated: Date.now()
      };
    }
  
    private saveGlobalData(data: GlobalData): void {
      try {
        data.lastUpdated = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this.notifyUpdates();
      } catch (error) {
        console.error('Error saving global data:', error);
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
      const data = this.getGlobalData();
      // Remove any existing course with the same ID
      data.courses = data.courses.filter(c => c.id !== course.id);
      data.courses.push(course);
      this.saveGlobalData(data);
    }
  
    getCourses(): any[] {
      return this.getGlobalData().courses;
    }
  
    getPublishedCourses(): any[] {
      return this.getCourses().filter(course => course.published);
    }
  
    getEducatorCourses(educatorId: string): any[] {
      return this.getCourses().filter(course => course.educator_id === educatorId);
    }
  
    updateCourse(courseId: string, updates: Partial<any>): void {
      const data = this.getGlobalData();
      const courseIndex = data.courses.findIndex(c => c.id === courseId);
      if (courseIndex !== -1) {
        data.courses[courseIndex] = { ...data.courses[courseIndex], ...updates };
        this.saveGlobalData(data);
      }
    }
  
    getCourse(courseId: string): any | null {
      return this.getCourses().find(course => course.id === courseId) || null;
    }
  
    // Peer notes operations
    addPeerNote(note: any): void {
      const data = this.getGlobalData();
      data.peerNotes.push(note);
      this.saveGlobalData(data);
    }
  
    getPeerNotes(): any[] {
      return this.getGlobalData().peerNotes;
    }
  
    getCourseNotes(courseId: string): any[] {
      return this.getPeerNotes().filter(note => note.course_id === courseId);
    }
  
    getUserNotes(userId: string): any[] {
      return this.getPeerNotes().filter(note => note.author === userId);
    }
  
    updatePeerNote(noteId: string, updates: Partial<any>): void {
      const data = this.getGlobalData();
      const noteIndex = data.peerNotes.findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        data.peerNotes[noteIndex] = { ...data.peerNotes[noteIndex], ...updates };
        this.saveGlobalData(data);
      }
    }
  
    // Enrollment operations
    addEnrollment(enrollment: any): void {
      const data = this.getGlobalData();
      // Remove existing enrollment for same student and course
      data.enrollments = data.enrollments.filter(
        e => !(e.student_id === enrollment.student_id && e.course_id === enrollment.course_id)
      );
      data.enrollments.push(enrollment);
      this.saveGlobalData(data);
    }
  
    getEnrollments(): any[] {
      return this.getGlobalData().enrollments;
    }
  
    getStudentEnrollments(studentId: string): any[] {
      return this.getEnrollments().filter(e => e.student_id === studentId);
    }
  
    updateEnrollment(studentId: string, courseId: string, updates: Partial<any>): void {
      const data = this.getGlobalData();
      const enrollmentIndex = data.enrollments.findIndex(
        e => e.student_id === studentId && e.course_id === courseId
      );
      if (enrollmentIndex !== -1) {
        data.enrollments[enrollmentIndex] = { ...data.enrollments[enrollmentIndex], ...updates };
        this.saveGlobalData(data);
      }
    }
  
    // Certificate operations
    addCertificate(certificate: any): void {
      const data = this.getGlobalData();
      data.certificates.push(certificate);
      this.saveGlobalData(data);
    }
  
    getCertificates(): any[] {
      return this.getGlobalData().certificates;
    }
  
    getStudentCertificates(studentId: string): any[] {
      return this.getCertificates().filter(c => c.student_id === studentId);
    }
  
    // Profile operations
    setEducatorProfile(principal: string, profile: any): void {
      const data = this.getGlobalData();
      data.educatorProfiles[principal] = profile;
      this.saveGlobalData(data);
    }
  
    getEducatorProfile(principal: string): any | null {
      return this.getGlobalData().educatorProfiles[principal] || null;
    }
  
    setStudentProfile(principal: string, profile: any): void {
      const data = this.getGlobalData();
      data.studentProfiles[principal] = profile;
      this.saveGlobalData(data);
    }
  
    getStudentProfile(principal: string): any | null {
      return this.getGlobalData().studentProfiles[principal] || null;
    }
  
    // Utility methods
    clearAllData(): void {
      localStorage.removeItem(this.storageKey);
      this.notifyUpdates();
    }
  
    exportData(): GlobalData {
      return this.getGlobalData();
    }
  
    importData(data: GlobalData): void {
      this.saveGlobalData(data);
    }
  }
  
  export const globalStorage = new GlobalStorageService();