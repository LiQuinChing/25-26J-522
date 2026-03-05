import MainContent from '../components/ecg/MainContent';
import Sidebar from '../components/ecg/Sidebar';
import TopNav from '../components/ecg/TopNav';

function EcgKnowledgeBase({ onNavigate }) {
  return (
    <div className="min-h-screen bg-teal-bg font-display text-slate-800 antialiased">
      <TopNav onNavigate={onNavigate} />
      <div className="layout-container flex h-[calc(100vh-65px)] w-full overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

export default EcgKnowledgeBase;
