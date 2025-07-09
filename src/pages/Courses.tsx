import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  StarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { agentService } from '../services/agent';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  educator_id: string;
  educator_name?: string;
  institution?: string;
  department?: string;
  sections: any[];
  created_at: number;
  token_reward: number;
  published: boolean;
  difficulty?: string;
  duration?: string;
  rating?: number;
  enrolled_count?: number;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        if (agentService.course) {
          // Fetch all published courses from shared storage
          const coursesData = await agentService.course.get_published_courses();
          setCourses(coursesData);
          setFilteredCourses(coursesData);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
    
    // Listen for global data updates
    const handleGlobalUpdate = () => {
      fetchCourses();
    };
    
    window.addEventListener('globalDataUpdate', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('globalDataUpdate', handleGlobalUpdate);
    };
  }, []);

  useEffect(() => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category (for now, we'll use a simple categorization)
    if (selectedCategory !== 'all') {
      // This is a placeholder - in a real app, courses would have categories
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        course.description.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, selectedCategory, courses]);

  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'blockchain', name: 'Blockchain' },
    { id: 'smart', name: 'Smart Contracts' },
    { id: 'defi', name: 'DeFi' },
    { id: 'nft', name: 'NFTs' },
    { id: 'security', name: 'Security' },
    { id: 'web3', name: 'Web3 Development' },
  ];

  const handleEnroll = async (courseId: string) => {
    try {
      if (agentService.student) {
        await agentService.student.enroll_in_course(courseId);
        toast.success('Successfully enrolled in course!');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎓 Explore Blockchain Courses
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Learn from top IIT professors and earn ICP Scholar tokens
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {course.title}
                      </h3>
                      {course.educator_name && course.institution && (
                        <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                          <span className="font-medium">{course.educator_name}</span>
                          <span className="mx-2">•</span>
                          <span>{course.institution}</span>
                        </div>
                      )}
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                        {course.description}
                      </p>
                    </div>
                    {course.difficulty && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.difficulty === 'Beginner' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : course.difficulty === 'Intermediate'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {course.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        {course.sections.length} sections
                      </div>
                      {course.duration && (
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {course.duration}
                        </div>
                      )}
                      {course.enrolled_count && (
                        <div className="flex items-center">
                          <span>{course.enrolled_count.toLocaleString()} enrolled</span>
                        </div>
                      )}
                    </div>
                    {course.rating && (
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{course.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Course Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                      <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                      <span className="font-semibold">{course.token_reward} ICP tokens</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/course/${course.id}`}
                        className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                      >
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        Enroll
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses match your criteria
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or browse all courses
            </p>
          </motion.div>
        )}

        {/* Featured Educators Section */}
        {filteredCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              🏛️ Featured IIT Educators
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Prof. Rajesh Kumar", institution: "IIT Bombay", expertise: "Blockchain Fundamentals" },
                { name: "Dr. Priya Sharma", institution: "IIT Delhi", expertise: "Smart Contracts" },
                { name: "Prof. Arjun Menon", institution: "IIT Madras", expertise: "DeFi Protocols" },
                { name: "Dr. Vikram Singh", institution: "IIT Kanpur", expertise: "Web3 Development" }
              ].map((educator, index) => (
                <motion.div
                  key={educator.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {educator.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {educator.name}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">
                    {educator.institution}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {educator.expertise}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Courses;