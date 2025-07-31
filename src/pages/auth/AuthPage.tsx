import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Please enter a valid address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms and Conditions',
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Create floating bubbles effect
  useEffect(() => {
    const createBubbles = () => {
      const bubblesContainer = document.getElementById('bubbles');
      if (!bubblesContainer) return;
      
      // Clear existing bubbles
      bubblesContainer.innerHTML = '';
      
      for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 60 + 20;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.animationDelay = Math.random() * 6 + 's';
        bubble.style.animationDuration = (Math.random() * 3 + 3) + 's';
        bubblesContainer.appendChild(bubble);
      }
    };

    createBubbles();
  }, []);

  // Create sparkles animation when success is shown
  useEffect(() => {
    if (showSuccess) {
      const createSparkles = () => {
        const sparklesContainer = document.getElementById('sparkles');
        if (!sparklesContainer) return;
        
        const sparkleSymbols = ['✨', '⭐', '💫', '🌟', '✦', '✧'];
        
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.textContent = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = Math.random() * 2 + 's';
            sparkle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            sparklesContainer.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
              if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
              }
            }, 4000);
          }, i * 100);
        }
      };

      createSparkles();
      
      // Prevent body scroll when overlay is active
      document.body.style.overflow = 'hidden';
      
      // Re-enable scroll when hiding overlay (after navigation)
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [showSuccess]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    signupForm.reset();
  };

  const switchToSignup = () => {
    setIsLogin(false);
    loginForm.reset();
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .bubbles {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        .auth-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          width: 400px;
          max-width: 90vw;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
          transform: translateY(0);
          transition: transform 0.3s ease;
        }

        .auth-container:hover {
          transform: translateY(-5px);
        }

        .logo {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo h1 {
          color: #2563EB;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .logo p {
          color: #666;
          font-size: 14px;
        }

        .form-toggle {
          display: flex;
          background: #F1F5F9;
          border-radius: 25px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }

        .toggle-btn {
          flex: 1;
          padding: 12px;
          text-align: center;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.3s ease;
          font-weight: 600;
          z-index: 2;
          position: relative;
          color: #0F172A;
        }

        .toggle-btn.active {
          color: white;
        }

        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          border-radius: 25px;
          transition: transform 0.3s ease;
          z-index: 1;
          transform: ${isLogin ? 'translateX(0)' : 'translateX(100%)'};
        }

        .form-group {
          position: relative;
          margin-bottom: 25px;
        }

        .form-input {
          width: 100%;
          padding: 15px 20px 15px 50px;
          border: 2px solid #e0e0e0;
          border-radius: 25px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
          color: #0F172A;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          transform: scale(1.02);
        }

        .form-input:focus + .input-icon {
          color: #2563EB;
          transform: scale(1.1);
        }

        .input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 18px;
          transition: all 0.3s ease;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-label {
          position: absolute;
          left: 50px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 16px;
          pointer-events: none;
          transition: all 0.3s ease;
        }

                 .form-input:focus ~ .floating-label,
         .form-input:not(:placeholder-shown) ~ .floating-label {
           top: -8px;
           left: 20px;
           font-size: 12px;
           color: #2563EB;
           background: white;
           padding: 0 5px;
         }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .social-login {
          margin-top: 20px;
          text-align: center;
        }

        .social-btn {
          display: inline-block;
          width: 50px;
          height: 50px;
          margin: 0 10px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 50%;
          color: #666;
          font-size: 20px;
          text-decoration: none;
          line-height: 46px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .social-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          border-color: #2563EB;
        }

        .forgot-password {
          text-align: center;
          margin-top: 15px;
        }

        .forgot-password a {
          color: #2563EB;
          text-decoration: none;
          font-size: 14px;
        }

        .success-message {
          background: #10B981;
          color: white;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          display: none;
        }

        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #50C878 0%, #40E0D0 25%, #48D1CC 50%, #20B2AA 75%, #008B8B 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.5s ease;
          z-index: 1000;
        }

        .success-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .success-content {
          text-align: center;
          color: white;
          transform: scale(0.5) translateY(30px);
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          padding: 20px;
          max-width: 90vw;
        }

        .success-overlay.active .success-content {
          transform: scale(1) translateY(0);
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 1s ease-in-out;
          filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 15px;
          text-shadow: 0 3px 10px rgba(0,0,0,0.3);
          animation: slideInUp 0.8s ease-out 0.3s both;
        }

        .success-subtitle {
          font-size: 18px;
          font-weight: 300;
          opacity: 0.9;
          margin-bottom: 25px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
          animation: slideInUp 0.8s ease-out 0.5s both;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sparkles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          animation: sparkleFloat 3s infinite ease-in-out;
        }

        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translateY(-60px) rotate(180deg);
            opacity: 1;
          }
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulseRing 2s infinite ease-out;
        }

        @keyframes pulseRing {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .floating-elements {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .floating-element {
          position: absolute;
          opacity: 0.2;
          animation: float 6s infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
          }
        }

        .glow-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow 4s infinite ease-in-out;
        }

        @keyframes glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.1;
          }
        }

        .welcome-message {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 20px;
          margin-top: 15px;
          animation: slideInUp 0.8s ease-out 0.7s both;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }

        .welcome-message h3 {
          margin-bottom: 10px;
          font-size: 16px;
          font-weight: 600;
        }

        .welcome-message p {
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }

                 .error-message {
           color: #EF4444;
           font-size: 12px;
           margin-top: 5px;
           margin-left: 20px;
         }

         .password-toggle {
           position: absolute;
           right: 18px;
           top: 50%;
           transform: translateY(-50%);
           color: #999;
           cursor: pointer;
           transition: all 0.3s ease;
           width: 20px;
           height: 20px;
           display: flex;
           align-items: center;
           justify-content: center;
           z-index: 3;
         }

         .password-toggle:hover {
           color: #2563EB;
           transform: translateY(-50%) scale(1.1);
         }

         .icon {
           width: 20px;
           height: 20px;
         }

         .cleaning-icon {
           width: 24px;
           height: 24px;
         }
      `}</style>

      <div className="bubbles" id="bubbles"></div>
      
      <div className="auth-container">
        <div className="logo">
          <h1>
            <svg className="cleaning-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.36 2.72L20.78 4.14L15.06 9.85C16.13 11.39 16.28 13.24 15.38 14.44L9.06 8.12C10.26 7.22 12.11 7.37 13.65 8.44L19.36 2.72M5.93 17.57C3.92 15.56 2.69 13.16 2.35 10.92L7.23 8.83L14.67 16.27L12.58 21.15C10.34 20.81 7.94 19.58 5.93 17.57Z"/>
            </svg>
            SparklePro
          </h1>
          <p>Professional home cleaning service</p>
        </div>

        <div className="success-message">
          Welcome! Form submitted successfully ✨
        </div>

        <div className="form-toggle">
          <button 
            className={`toggle-btn ${isLogin ? 'active' : ''}`} 
            onClick={switchToLogin}
            type="button"
          >
            Login
          </button>
          <button 
            className={`toggle-btn ${!isLogin ? 'active' : ''}`} 
            onClick={switchToSignup}
            type="button"
          >
            Sign Up
          </button>
          <div className="toggle-slider"></div>
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                placeholder=" " 
                {...loginForm.register('email')}
              />
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,5.11 21.1,4 20,4Z"/>
                </svg>
              </div>
              <label className="floating-label">Email Address</label>
              {loginForm.formState.errors.email && (
                <div className="error-message">{loginForm.formState.errors.email.message}</div>
              )}
            </div>

                         <div className="form-group">
               <input 
                 type={showLoginPassword ? "text" : "password"} 
                 className="form-input" 
                 placeholder=" " 
                 {...loginForm.register('password')}
               />
               <div className="input-icon">
                 <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                 </svg>
               </div>
               <label className="floating-label">Password</label>
               <div 
                 className="password-toggle"
                 onClick={() => setShowLoginPassword(!showLoginPassword)}
               >
                 {showLoginPassword ? (
                   <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                   </svg>
                 ) : (
                   <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"/>
                   </svg>
                 )}
               </div>
               {loginForm.formState.errors.password && (
                 <div className="error-message">{loginForm.formState.errors.password.message}</div>
               )}
             </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>

            {/* Google Sign-In Button */}
            <div style={{ margin: '20px 0' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '20px 0',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                <span style={{ padding: '0 15px' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              </div>
              <GoogleSignInButton text="Sign in with Google" />
            </div>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleSignup)}>
            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                placeholder=" " 
                {...signupForm.register('fullName')}
              />
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
              </div>
              <label className="floating-label">Full Name</label>
              {signupForm.formState.errors.fullName && (
                <div className="error-message">{signupForm.formState.errors.fullName.message}</div>
              )}
            </div>

            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                placeholder=" " 
                {...signupForm.register('email')}
              />
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,5.11 21.1,4 20,4Z"/>
                </svg>
              </div>
              <label className="floating-label">Email Address</label>
              {signupForm.formState.errors.email && (
                <div className="error-message">{signupForm.formState.errors.email.message}</div>
              )}
            </div>

            <div className="form-group">
              <input 
                type="tel" 
                className="form-input" 
                placeholder=" " 
                {...signupForm.register('phone')}
              />
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                </svg>
              </div>
              <label className="floating-label">Phone Number</label>
              {signupForm.formState.errors.phone && (
                <div className="error-message">{signupForm.formState.errors.phone.message}</div>
              )}
            </div>

            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                placeholder=" " 
                {...signupForm.register('address')}
              />
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                </svg>
              </div>
              <label className="floating-label">Address</label>
              {signupForm.formState.errors.address && (
                <div className="error-message">{signupForm.formState.errors.address.message}</div>
              )}
            </div>

                         <div className="form-group">
               <input 
                 type={showSignupPassword ? "text" : "password"} 
                 className="form-input" 
                 placeholder=" " 
                 {...signupForm.register('password')}
               />
               <div className="input-icon">
                 <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                 </svg>
               </div>
               <label className="floating-label">Password</label>
               <div 
                 className="password-toggle"
                 onClick={() => setShowSignupPassword(!showSignupPassword)}
               >
                 {showSignupPassword ? (
                   <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                   </svg>
                 ) : (
                   <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"/>
                   </svg>
                 )}
               </div>
               {signupForm.formState.errors.password && (
                 <div className="error-message">{signupForm.formState.errors.password.message}</div>
               )}
             </div>

            {/* Terms and Conditions Checkbox */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px',
                fontSize: '14px',
                color: '#666'
              }}>
                <input
                  type="checkbox"
                  id="termsAccepted"
                  {...signupForm.register('termsAccepted')}
                  style={{
                    marginTop: '2px',
                    width: '16px',
                    height: '16px',
                    accentColor: '#10b981',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="termsAccepted" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                  I agree with{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit'
                    }}
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
              {signupForm.formState.errors.termsAccepted && (
                <div className="error-message" style={{ marginTop: '5px' }}>
                  {signupForm.formState.errors.termsAccepted.message}
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Google Sign-In Button for Signup */}
            <div style={{ margin: '20px 0' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '20px 0',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                <span style={{ padding: '0 15px' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              </div>
              <GoogleSignInButton text="Sign up with Google" />
            </div>
          </form>
        )}

      </div>

      {/* Success Overlay */}
      <div className={`success-overlay ${showSuccess ? 'active' : ''}`} id="successOverlay">
        <div className="glow-effect"></div>
        <div className="pulse-ring"></div>
        <div className="pulse-ring" style={{animationDelay: '0.5s'}}></div>
        <div className="pulse-ring" style={{animationDelay: '1s'}}></div>
        
        <div className="floating-elements">
          <div className="floating-element" style={{top: '15%', left: '15%', fontSize: '20px'}}>✨</div>
          <div className="floating-element" style={{top: '25%', right: '20%', fontSize: '18px', animationDelay: '1s'}}>⭐</div>
          <div className="floating-element" style={{bottom: '35%', left: '25%', fontSize: '22px', animationDelay: '2s'}}>💫</div>
          <div className="floating-element" style={{bottom: '25%', right: '15%', fontSize: '19px', animationDelay: '3s'}}>🌟</div>
          <div className="floating-element" style={{top: '55%', left: '10%', fontSize: '21px', animationDelay: '4s'}}>✨</div>
          <div className="floating-element" style={{top: '65%', right: '10%', fontSize: '17px', animationDelay: '5s'}}>⭐</div>
        </div>

        <div className="sparkles" id="sparkles"></div>
        
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h1 className="success-title">{isLogin ? 'Welcome Back!' : 'Welcome to SparklePro!'}</h1>
          <p className="success-subtitle">{isLogin ? 'Happy to see you again' : 'Account created successfully'}</p>
          
          <div className="welcome-message">
            <h3>✨ You're all set!</h3>
            <p>
              Ready to make your space sparkle? Let's get started with your next cleaning adventure!
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Service Agreement</h3>
                  <p>
                    By using SparklePro cleaning services, you agree to our professional cleaning standards 
                    and service delivery terms. Our team is committed to providing high-quality cleaning 
                    services for residential and commercial properties.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Booking and Scheduling</h3>
                  <p>
                    All bookings must be made through our platform. We require at least 24 hours notice 
                    for booking confirmations and 4 hours notice for cancellations. Same-day bookings 
                    are subject to availability.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Payment Terms</h3>
                  <p>
                    Payment is due upon completion of services unless otherwise arranged. We accept 
                    various payment methods including credit cards and digital payments. All prices 
                    are subject to applicable taxes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Property Access and Security</h3>
                  <p>
                    Customers must provide secure access to the property during scheduled service times. 
                    SparklePro is not responsible for lost keys or access issues. We recommend being 
                    present during the first cleaning service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Service Quality and Satisfaction</h3>
                  <p>
                    We guarantee satisfaction with our cleaning services. If you're not satisfied, 
                    please contact us within 24 hours of service completion, and we'll arrange to 
                    address any concerns at no additional cost.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Liability and Insurance</h3>
                  <p>
                    SparklePro maintains comprehensive insurance coverage for all cleaning operations. 
                    Our liability is limited to the cost of the cleaning service. We are not responsible 
                    for pre-existing damage or items of extraordinary value.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Privacy and Data Protection</h3>
                  <p>
                    We respect your privacy and protect your personal information in accordance with 
                    applicable data protection laws. Your information is used solely for service 
                    delivery and customer communication purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8. Service Modifications</h3>
                  <p>
                    SparklePro reserves the right to modify these terms and our services with 
                    appropriate notice to customers. Continued use of our services constitutes 
                    acceptance of any modifications.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <p className="text-sm text-gray-600">
                    <strong>Last updated:</strong> {new Date().toLocaleDateString()}<br />
                    <strong>Contact:</strong> For questions about these terms, please contact our 
                    customer service team through the app or visit our website.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage; 