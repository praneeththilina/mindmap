/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { MindMapEditor } from './pages/MindMapEditor';
import { Ranks } from './pages/Ranks';
import { SettingsView } from './pages/SettingsView';
import { StudyPlan } from './pages/StudyPlan';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { PasswordResetSuccess } from './pages/PasswordResetSuccess';
import { OnboardingStep1 } from './pages/OnboardingStep1';
import { OnboardingStep2 } from './pages/OnboardingStep2';
import { OnboardingStep3 } from './pages/OnboardingStep3';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
          <Route path="/onboarding/1" element={<OnboardingStep1 />} />
          <Route path="/onboarding/2" element={<OnboardingStep2 />} />
          <Route path="/onboarding/3" element={<OnboardingStep3 />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/map/:id" element={<ProtectedRoute><MindMapEditor /></ProtectedRoute>} />
          <Route path="/ranks" element={<ProtectedRoute><Ranks /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
