function Sidebar() {
  return (
    <aside className="hidden w-72 flex-col overflow-y-auto border-r border-white/20 bg-teal-bg/50 p-6 backdrop-blur-sm lg:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-xl bg-white/40 p-3 shadow-sm backdrop-blur-sm">
          <div className="rounded-full bg-primary/20 p-2 text-primary-dark">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-900">Learning Path</h1>
            <p className="text-xs text-slate-600">Intermediate Level</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Topics</h3>
          <a className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-primary-dark shadow-sm ring-1 ring-black/5" href="/">
            <span className="material-symbols-outlined">cardiology</span>
            <p className="text-sm font-bold">ECG Basics</p>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white/50 hover:text-slate-900" href="/upload-ecg">
            <span className="material-symbols-outlined">show_chart</span>
            <p className="text-sm font-medium">Arrhythmias</p>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white/50 hover:text-slate-900" href="/myocardial-infarction">
            <span className="material-symbols-outlined">warning</span>
            <p className="text-sm font-medium">Myocardial Infarction</p>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white/50 hover:text-slate-900" href="#">
            <span className="material-symbols-outlined">settings_input_component</span>
            <p className="text-sm font-medium">Lead Placement</p>
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Resources</h3>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white/50 hover:text-slate-900" href="#">
            <span className="material-symbols-outlined">video_library</span>
            <p className="text-sm font-medium">Video Tutorials</p>
          </a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white/50 hover:text-slate-900" href="#">
            <span className="material-symbols-outlined">quiz</span>
            <p className="text-sm font-medium">Practice Quizzes</p>
          </a>
        </div>

        <div className="mt-auto rounded-xl bg-gradient-to-br from-primary-dark to-blue-600 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-300">verified</span>
            <span className="text-sm font-bold">Pro Certification</span>
          </div>
          <p className="mb-3 text-xs text-blue-50 opacity-90">Unlock advanced cardiology modules.</p>
          <button className="w-full rounded-lg bg-white py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
