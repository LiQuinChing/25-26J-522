function TopNav() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-white/20 bg-teal-bg/95 px-10 py-3 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-4 text-slate-900">
        <div className="flex size-8 items-center justify-center text-primary-dark">
          <span className="material-symbols-outlined text-4xl">monitor_heart</span>
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-slate-900">ECG Hub</h2>
      </div>

      <div className="flex flex-1 justify-end gap-8">
        <nav className="hidden items-center gap-9 md:flex">
          <a className="text-sm font-medium leading-normal text-slate-700 transition-colors hover:text-primary-dark" href="#">
            Dashboard
          </a>
          <a className="text-sm font-medium leading-normal text-slate-700 transition-colors hover:text-primary-dark" href="#">
            Analysis
          </a>
          <a className="text-sm font-medium leading-normal text-slate-700 transition-colors hover:text-primary-dark" href="#">
            Patients
          </a>
          <a className="text-sm font-bold leading-normal text-primary-dark" href="#">
            Knowledge Base
          </a>
          <a className="text-sm font-medium leading-normal text-slate-700 transition-colors hover:text-primary-dark" href="#">
            Settings
          </a>
        </nav>

        <div
          aria-label="Doctor profile picture"
          className="aspect-square size-10 cursor-pointer rounded-full border-2 border-white bg-cover bg-center bg-no-repeat shadow-sm"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBxVHXLvaTQNNkddCva1iDnjXgVqm8RMPp6xhp3CoE4H5ht-3f0BOYHYINCOHAFRErlPMlgt8nSmFOnmu_obFN3qwhxBSvux4P8cE88khMzyRbANlr88p9QuJnpQdWJpNo7jRFrRP8NIdjWPjpzmC6Q9OwwMvENFLO3-2SAuZsPfXGSli3kgPdDJfbVHH8uXgqc84q5A331iqe1PTuHpFVNpm8eIE-au31hDB7s3GRK4cZLrilgomB1rXmOn_xsmsw6LKJMm39x590")',
          }}
        />
      </div>
    </header>
  );
}

export default TopNav;
