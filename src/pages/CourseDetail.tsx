import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  StarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { agentService } from '../services/agent';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface CourseSection {
  id: string;
  title: string;
  content: string;
  order: number;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  educator_id: string;
  educator_name?: string;
  institution?: string;
  sections: CourseSection[];
  created_at: number;
  token_reward: number;
  published: boolean;
  difficulty?: string;
  duration?: string;
  rating?: number;
  enrolled_count?: number;
}

interface Enrollment {
  student_id: string;
  course_id: string;
  enrolled_at: number;
  progress: string[];
  completed: boolean;
  completed_at?: number;
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, getUserProfile } = useAuth();
  const userProfile = getUserProfile();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        
        // Get course details
        if (agentService.course) {
          const courseData = await agentService.course.get_course(courseId);
          setCourse(courseData);
        }
        
        // Check if user is enrolled
        if (isAuthenticated && agentService.student) {
          const enrollments = await agentService.student.get_student_enrollments();
          const userEnrollment = enrollments.find((e: Enrollment) => e.course_id === courseId);
          setEnrollment(userEnrollment || null);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll in courses');
      navigate('/login');
      return;
    }

    if (!courseId) return;

    try {
      setIsEnrolling(true);
      if (agentService.student) {
        const newEnrollment = await agentService.student.enroll_in_course(courseId);
        setEnrollment(newEnrollment);
        toast.success('Successfully enrolled in course!');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleMarkSectionComplete = async (sectionId: string) => {
    if (!enrollment || !courseId) return;

    try {
      if (agentService.student) {
        await agentService.student.mark_section_complete(courseId, sectionId);
        
        // Update local enrollment state
        const updatedProgress = [...enrollment.progress];
        if (!updatedProgress.includes(sectionId)) {
          updatedProgress.push(sectionId);
        }
        
        setEnrollment({
          ...enrollment,
          progress: updatedProgress
        });
        
        toast.success('Section marked as complete!');
        
        // Check if course is completed
        if (course && updatedProgress.length === course.sections.length) {
          handleCompleteCourse();
        }
      }
    } catch (error) {
      console.error('Error marking section complete:', error);
      toast.error('Failed to mark section as complete');
    }
  };

  const handleCompleteCourse = async () => {
    if (!course || !courseId || !userProfile) return;

    try {
      if (agentService.student) {
        const certificate = await agentService.student.complete_course(courseId, course.title);
        
        // Update enrollment status
        setEnrollment(prev => prev ? {
          ...prev,
          completed: true,
          completed_at: Date.now() * 1000000
        } : null);
        
        // Award tokens
        if (agentService.token) {
          await agentService.token.reward_course_completion(
            agentService.getPrincipal()?.toText() || '',
            course.token_reward,
            courseId
          );
        }
        
        toast.success(`🎉 Congratulations! You've completed the course and earned ${course.token_reward} tokens!`);
        
        // Generate certificate
        generateCertificate(certificate);
      }
    } catch (error) {
      console.error('Error completing course:', error);
      toast.error('Failed to complete course');
    }
  };

  const generateCertificate = (certificate: any) => {
    const doc = new jsPDF();
    
    // Certificate design
    doc.setFillColor(240, 248, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(3);
    doc.rect(10, 10, 190, 277);
    
    // Title
    doc.setFontSize(28);
    doc.setTextColor(79, 70, 229);
    doc.text('Certificate of Completion', 105, 50, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('ICP Scholar Platform', 105, 70, { align: 'center' });
    
    // Student name
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(`This certifies that`, 105, 110, { align: 'center' });
    
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.text(userProfile?.name || 'Student', 105, 130, { align: 'center' });
    
    // Course details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('has successfully completed the course', 105, 150, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text(course?.title || 'Course Title', 105, 170, { align: 'center' });
    
    // Date
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Completed on: ${new Date().toLocaleDateString()}`, 105, 200, { align: 'center' });
    
    // Certificate ID
    doc.text(`Certificate ID: ${certificate.certificate_id}`, 105, 220, { align: 'center' });
    
    // Signature line
    doc.setDrawColor(0, 0, 0);
    doc.line(60, 250, 150, 250);
    doc.text('ICP Scholar Platform', 105, 260, { align: 'center' });
    
    // Save the PDF
    doc.save(`${course?.title || 'Course'}_Certificate.pdf`);
  };

  const isSectionCompleted = (sectionId: string) => {
    return enrollment?.progress.includes(sectionId) || false;
  };

  const getProgressPercentage = () => {
    if (!course || !enrollment) return 0;
    return Math.round((enrollment.progress.length / course.sections.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course not found</h2>
          <button
            onClick={() => navigate('/courses')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Courses
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {course.title}
                </h1>
                
                {course.educator_name && course.institution && (
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <span className="font-medium">{course.educator_name}</span>
                    <span className="mx-2">•</span>
                    <span>{course.institution}</span>
                  </div>
                )}
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {course.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  {course.difficulty && (
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.difficulty === 'Beginner' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : course.difficulty === 'Intermediate'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {course.difficulty}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {course.duration || `${course.sections.length} sections`}
                  </div>
                  
                  {course.rating && (
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      {course.rating}
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                    {course.token_reward} tokens reward
                  </div>
                </div>
              </div>
              
              {/* Enrollment Panel */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                {enrollment ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Your Progress</h3>
                      {enrollment.completed && (
                        <TrophyIcon className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{getProgressPercentage()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {enrollment.progress.length} of {course.sections.length} sections completed
                    </div>
                    
                    {enrollment.completed ? (
                      <div className="text-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          Course Completed!
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          You earned {course.token_reward} tokens
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCurrentSection(0)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                      >
                        Continue Learning
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Ready to start learning?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enroll now to access all course content and earn tokens
                    </p>
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Content */}
        {enrollment && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sections Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Course Sections
              </h3>
              <div className="space-y-2">
                {course.sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                      currentSection === index
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isSectionCompleted(section.id) ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                          <PlayIcon className="w-5 h-5 text-gray-400 mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {section.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {index + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Section Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8"
            >
              {course.sections[currentSection] && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {course.sections[currentSection].title}
                    </h2>
                    {!isSectionCompleted(course.sections[currentSection].id) && (
                      <button
                        onClick={() => handleMarkSectionComplete(course.sections[currentSection].id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </button>
                    )}
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {course.sections[currentSection].content}
                    </div>
                  </div>
                  
                  {isSectionCompleted(course.sections[currentSection].id) && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-green-700 dark:text-green-300 font-medium">
                          Section completed!
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                      disabled={currentSection === 0}
                      className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentSection(Math.min(course.sections.length - 1, currentSection + 1))}
                      disabled={currentSection === course.sections.length - 1}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;