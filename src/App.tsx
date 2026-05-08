/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/authContext';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Feed from './pages/Feed';
import GroupDiscovery from './pages/GroupDiscovery';
import GroupPage from './pages/GroupPage';
import CreateGroup from './pages/CreateGroup';
import Marketplace from './pages/Marketplace';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import GroupMembers from './pages/GroupMembers';
import Notifications from './pages/Notifications';
import Brainstorming from './pages/Brainstorming';
import Messages from './pages/Messages';
import EventsCalendar from './pages/EventsCalendar';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import DepartmentHub from './pages/DepartmentHub';
import JoinGroup from './pages/JoinGroup';
import FindFriends from './pages/FindFriends';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-serif text-primary italic">Mylasued...</div>;
  if (!user) return <Navigate to="/signin" />;
  return <>{children}</>;
}

import ReminderService from './services/ReminderService';

export default function App() {
  return (
    <AuthProvider>
      <ReminderService />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          
          <Route path="/feed" element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          } />

          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupDiscovery />
            </ProtectedRoute>
          } />

          <Route path="/groups/create" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />

          <Route path="/groups/:groupId" element={
            <ProtectedRoute>
              <GroupPage />
            </ProtectedRoute>
          } />

          <Route path="/groups/:groupId/members" element={
             <ProtectedRoute>
                <GroupMembers />
             </ProtectedRoute>
          } />

          <Route path="/marketplace" element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>
          } />

          <Route path="/marketplace/create" element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/brainstorm" element={
            <ProtectedRoute>
              <Brainstorming />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />

          <Route path="/broadcasts" element={
            <ProtectedRoute>
              <EventsCalendar />
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/department/:deptName" element={
            <ProtectedRoute>
              <DepartmentHub />
            </ProtectedRoute>
          } />

          <Route path="/join/:code" element={
            <ProtectedRoute>
              <JoinGroup />
            </ProtectedRoute>
          } />

          <Route path="/find-friends" element={
            <ProtectedRoute>
              <FindFriends />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
