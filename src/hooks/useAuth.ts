import { useState, useEffect } from 'react';
import { agentService } from '../services/agent';
import toast from 'react-hot-toast';

interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    principal: null,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      await agentService.init();
      const isAuthenticated = agentService.isAuthenticated();
      const principal = agentService.getPrincipal();
      
      setAuthState({
        isAuthenticated,
        principal: principal?.toText() || null,
        isLoading: false,
      });
    };

    initAuth();
  }, []);

  const login = async () => {
    const success = await agentService.login();
    if (success) {
      // Check for pending user details from onboarding
      const pendingDetails = localStorage.getItem('pendingUserDetails');
      if (pendingDetails) {
        try {
          const userDetails = JSON.parse(pendingDetails);
          
          // Create appropriate profile based on user type
          if (userDetails.userType === 'educator') {
            await agentService.course?.create_educator_profile(
              userDetails.name,
              userDetails.bio || 'Educator on ICP Scholar',
              []
            );
            toast.success(`Welcome ${userDetails.name}! Your educator profile has been created.`);
          } else {
            await agentService.student?.create_student_profile(
              userDetails.name,
              userDetails.email,
              userDetails.bio || 'Student on ICP Scholar'
            );
            toast.success(`Welcome ${userDetails.name}! Your student profile has been created.`);
          }
          
          // Store user details in localStorage for persistence
          localStorage.setItem('userProfile', JSON.stringify({
            ...userDetails,
            principal: agentService.getPrincipal()?.toText()
          }));
          
          // Clear pending details
          localStorage.removeItem('pendingUserDetails');
        } catch (error) {
          console.error('Error creating profile:', error);
          toast.error('Profile created but there was an issue saving some details');
        }
      }
      
      const principal = agentService.getPrincipal();
      setAuthState({
        isAuthenticated: true,
        principal: principal?.toText() || null,
        isLoading: false,
      });
    }
    return success;
  };

  const logout = async () => {
    await agentService.logout();
    localStorage.removeItem('userProfile');
    localStorage.removeItem('pendingUserDetails');
    setAuthState({
      isAuthenticated: false,
      principal: null,
      isLoading: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
    getUserProfile: () => {
      const profile = localStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    }
  };
};