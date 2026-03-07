function MainContent() {
  return (
    <main className="relative flex-1 overflow-y-auto rounded-tl-3xl bg-[#F0FBFD] p-6 shadow-inner scroll-smooth md:p-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <a className="transition-colors hover:text-primary-dark" href="/">
              Home
            </a>
            <span className="text-slate-300">/</span>
            <a className="transition-colors hover:text-primary-dark" href="/">
              Resources
            </a>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-primary-dark">Knowledge Base</span>
          </div>

          <div className="group relative w-full md:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within:text-primary-dark">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="block w-full rounded-xl border-none bg-white py-2.5 pl-10 pr-3 text-slate-900 shadow-sm transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
              placeholder="Search terms (e.g., 'Atrial Fibrillation')"
              type="text"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-800 md:text-5xl">ECG Knowledge Base</h1>
          <p className="max-w-2xl text-lg font-light text-slate-600">
            Master the fundamentals of electrocardiography. Explore our comprehensive library of cardiac pathologies,
            waveform analysis, and clinical guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-primary/10 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-between p-8">
              <div>
                <span className="mb-4 inline-block rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary-dark">
                  FEATURED GUIDE
                </span>
                <h3 className="mb-2 text-2xl font-bold text-slate-800 transition-colors group-hover:text-primary-dark">
                  Understanding the Normal Sinus Rhythm
                </h3>
                <p className="mb-6 text-slate-600">
                  A complete breakdown of the P-QRS-T complex, normal intervals, and how to identify a healthy heart rhythm
                  on a 12-lead ECG.
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>10 min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>2.4k views</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#13daec] to-[#0ea5b5] p-6 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">lightbulb</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Quick Fact</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">The P-Wave</h4>
              <p className="mb-4 text-sm leading-relaxed text-blue-50">
                Represents atrial depolarization. In a normal sinus rhythm, it should be upright in leads I and II.
              </p>
            </div>
            <button className="relative z-10 self-start rounded-lg bg-white/20 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/30">
              View Waveforms
            </button>
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Browse by Category</h3>
            <a className="text-sm font-semibold text-primary-dark hover:text-primary hover:underline" href="/">
              View All
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-primary-dark transition-colors group-hover:bg-primary group-hover:text-white">
                <span className="material-symbols-outlined">ecg_heart</span>
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-800">ECG Interpretation</h4>
              <p className="mb-4 text-sm text-slate-500">Systematic approaches to reading ECG strips, calculating rate, and determining axis.</p>
              <a className="flex items-center gap-1 text-sm font-bold text-primary-dark transition-all hover:gap-2" href="/">
                Start Learning <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <div className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <span className="material-symbols-outlined">pacemaker</span>
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-800">Cardiac Pathology</h4>
              <p className="mb-4 text-sm text-slate-500">Detailed guides on ischemia, infarction, hypertrophy, and electrolyte imbalances.</p>
              <a className="flex items-center gap-1 text-sm font-bold text-blue-600 transition-all hover:gap-2" href="/">
                Explore Topics <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <div className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <span className="material-symbols-outlined">medical_services</span>
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-800">Clinical Management</h4>
              <p className="mb-4 text-sm text-slate-500">Treatment protocols and immediate actions for critical ECG findings.</p>
              <a className="flex items-center gap-1 text-sm font-bold text-indigo-600 transition-all hover:gap-2" href="/">
                View Protocols <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MainContent;
