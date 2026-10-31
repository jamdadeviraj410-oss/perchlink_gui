// PerchLink Survivor SOS - Main Application Container
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import SOSForm from './pages/SOSForm';
import SOSStatus from './pages/SOSStatus';
import EmergencyDetails from './pages/EmergencyDetails';
import Help from './pages/Help';
import { useDroneStatus } from './hooks/useDroneStatus';
import { useSOSStatus } from './hooks/useSOSStatus';
import {
  submitSOS,
  getActiveSOSId,
  clearActiveSOSId,
} from './services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // home | form | status | details | help
  const [activeSosId, setActiveSosId] = useState(getActiveSOSId());
  const [selectedInitialCategory, setSelectedInitialCategory] = useState('TRAPPED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusDetailsAdd, setFocusDetailsAdd] = useState(false);

  // Live Drone Status Hook
  const droneStatus = useDroneStatus();

  // Active SOS Status Hook
  const {
    sosRecord,
    loading: sosLoading,
    refresh: refreshSOS,
    addNote,
  } = useSOSStatus(activeSosId);

  // If there's an active SOS ID on boot, we can stay on home or let user jump to it
  useEffect(() => {
    const saved = getActiveSOSId();
    if (saved) {
      setActiveSosId(saved);
    }
  }, []);

  const handleNavigate = (screen, params = {}) => {
    if (params.sosId) {
      setActiveSosId(params.sosId);
    }
    if (params.focusAdd !== undefined) {
      setFocusDetailsAdd(params.focusAdd);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryAndOpenForm = (catId) => {
    setSelectedInitialCategory(catId);
    setCurrentScreen('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSOS = async (payload) => {
    setIsSubmitting(true);
    try {
      const record = await submitSOS(payload);
      setActiveSosId(record.id);
      setIsSubmitting(false);
      handleNavigate('status', { sosId: record.id });
    } catch (err) {
      setIsSubmitting(false);
      alert('Error recording emergency distress: ' + err.message);
    }
  };

  const handleStartNewSOS = () => {
    if (confirm('Create a new separate emergency case? Your previous record remains stored on the drone.')) {
      clearActiveSOSId();
      setActiveSosId(null);
      setCurrentScreen('form');
      setSelectedInitialCategory('TRAPPED');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Universal Fixed Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isSimulated={droneStatus.isSimulated}
      />

      {/* Main Responsive Viewport (Optimized for Mobile Smartphones) */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-5">
        {currentScreen === 'home' && (
          <Home
            droneStatus={droneStatus}
            activeSosId={activeSosId}
            onNavigate={handleNavigate}
            onSelectCategoryAndOpenForm={handleSelectCategoryAndOpenForm}
          />
        )}

        {currentScreen === 'form' && (
          <SOSForm
            initialCategory={selectedInitialCategory}
            onSubmit={handleSubmitSOS}
            onCancel={() => handleNavigate('home')}
            isSubmitting={isSubmitting}
          />
        )}

        {currentScreen === 'status' && (
          <SOSStatus
            sosRecord={sosRecord}
            loading={sosLoading}
            onNavigate={handleNavigate}
            onRetry={refreshSOS}
          />
        )}

        {currentScreen === 'details' && (
          <EmergencyDetails
            sosRecord={sosRecord}
            onNavigate={handleNavigate}
            onAddNote={addNote}
            focusAdd={focusDetailsAdd}
            onStartNewSOS={handleStartNewSOS}
          />
        )}

        {currentScreen === 'help' && (
          <Help onNavigate={handleNavigate} />
        )}
      </main>

      {/* Lightweight Offline Emergency Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-4 text-center text-[11px]">
        <div className="max-w-md mx-auto space-y-1">
          <p className="font-semibold text-slate-300">
            PerchLink Disaster-Zone Emergency Interface v2.0
          </p>
          <p className="text-slate-500">
            Hosted locally on Raspberry Pi 4B (192.168.4.1) • Zero External Cloud Dependency
          </p>
        </div>
      </footer>
    </div>
  );
}
