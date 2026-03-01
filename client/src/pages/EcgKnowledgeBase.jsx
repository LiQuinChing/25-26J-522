import MainContent from '../components/ecg/MainContent';
import Sidebar from '../components/ecg/Sidebar';
import TopNav from '../components/ecg/TopNav';

function EcgKnowledgeBase() {
  return (
    <>
      <TopNav />
      <div className="layout-container flex h-[calc(100vh-65px)] w-full overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </>
  );
}

export default EcgKnowledgeBase;
