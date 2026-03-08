import React from 'react'

const FAQ = () => {
  return (
    <div className="bg-cyan-100 font-display antialiased text-text-primary min-h-screen flex flex-col">
    
      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero / Search Section */}
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-12 space-y-6">
          <div className="bg-cyan-200/80 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50 shadow-sm inline-flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">help</span>
            <span className="text-accent-blue text-sm font-semibold">Help Center</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-accent-blue tracking-tight leading-tight">
            Frequently Asked Questions
          </h1>

          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Find clear answers about ECG tools, HIPAA compliance, and account management. Can't find what you need?
            Contact our support team.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl relative mt-4 shadow-xl shadow-primary/10 rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-primary/60">search</span>
            </div>
            <input
              className="block w-full pl-11 pr-4 py-4 rounded-xl border-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary bg-cyan-200 text-text-primary placeholder:text-text-secondary/50 text-base shadow-sm transition-all"
              placeholder="Search specifically for 'DICOM', 'Export', or 'Security'..."
              type="text"
            />
            <button className="absolute inset-y-2 right-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Two Column Layout: Sidebar + FAQ List */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation (Sticky) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="bg-cyan-200 rounded-xl shadow-sm border border-white/60 p-2">
              <nav className="flex flex-col space-y-1">
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-accent-blue font-semibold transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined fill-current">info</span>
                  General Usage
                </a>
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-secondary/50 hover:text-accent-blue font-medium transition-colors group"
                  href="#"
                >
                  <span className="material-symbols-outlined group-hover:text-primary transition-colors">
                    monitor_heart
                  </span>
                  ECG Analysis
                </a>
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-secondary/50 hover:text-accent-blue font-medium transition-colors group"
                  href="#"
                >
                  <span className="material-symbols-outlined group-hover:text-primary transition-colors">
                    verified_user
                  </span>
                  HIPAA &amp; Security
                </a>
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-secondary/50 hover:text-accent-blue font-medium transition-colors group"
                  href="#"
                >
                  <span className="material-symbols-outlined group-hover:text-primary transition-colors">
                    receipt_long
                  </span>
                  Billing &amp; Plans
                </a>
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-secondary/50 hover:text-accent-blue font-medium transition-colors group"
                  href="#"
                >
                  <span className="material-symbols-outlined group-hover:text-primary transition-colors">
                    manage_accounts
                  </span>
                  Account Settings
                </a>
              </nav>
            </div>

            {/* Contact Support Card */}
            <div className="mt-6 bg-linear-to-br from-cyan-300 to-blue-400 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <span className="material-symbols-outlined text-4xl mb-4 text-white/90">support_agent</span>
              <h3 className="text-lg font-bold mb-2">Still need help?</h3>
              <p className="text-white/80 text-sm mb-4">
                Our specialized support team is available 24/7 for urgent clinical queries.
              </p>
              <button className="w-full py-2 bg-white text-primary font-bold rounded-lg text-sm hover:bg-gray-50 transition-colors text-blue-400">
                Contact Support
              </button>
            </div>
          </aside>

          {/* FAQ Content Area */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Section Header */}
            <div className="flex items-baseline justify-between border-b border-accent-blue/10 pb-4">
              <h2 className="text-2xl font-bold text-accent-blue">General Usage</h2>
              <span className="text-sm text-text-secondary font-medium">5 articles</span>
            </div>

            {/* Accordions */}
            <div className="flex flex-col gap-4">
              {/* Accordion Item 1 */}
              <details className="group bg-cyan-200 rounded-xl border border-white/50 shadow-sm open:ring-2 open:ring-primary/20 open:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-open:bg-primary group-open:text-white transition-colors">
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      How do I upload a new ECG file?
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0 ml-[3.25rem]">
                  <p className="text-text-secondary leading-relaxed">
                    To upload an ECG file, navigate to the "Upload" tab in the top navigation bar. You can drag and drop
                    your file directly into the upload zone or click "Select File" to browse your computer. We currently
                    support standard <strong className="text-accent-blue">DICOM</strong>,{' '}
                    <strong className="text-accent-blue">HL7 aECG</strong>, and{' '}
                    <strong className="text-accent-blue">PDF</strong> formats. Once uploaded, the analysis will begin
                    automatically.
                  </p>
                  <div className="mt-4 p-4 bg-background-light/50 rounded-lg border border-primary/10 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">lightbulb</span>
                    <p className="text-sm text-accent-blue font-medium">
                      Pro Tip: For batch uploads of more than 50 files, please use our desktop companion app for faster
                      processing.
                    </p>
                  </div>
                </div>
              </details>

              {/* Accordion Item 2 */}
              <details className="group bg-cyan-200 rounded-xl border border-white/50 shadow-sm open:ring-2 open:ring-primary/20 open:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-open:bg-primary group-open:text-white transition-colors">
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      Can I export analysis reports to PDF?
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0 ml-[3.25rem]">
                  <p className="text-text-secondary leading-relaxed mb-3">
                    Yes, absolutely. Every analysis generates a comprehensive report that can be exported.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-text-secondary">
                    <li>Open the specific patient record or analysis result.</li>
                    <li>
                      Click the <strong className="text-text-primary">"Export"</strong> button located at the top right
                      of the dashboard.
                    </li>
                    <li>Select "PDF Report" from the dropdown menu.</li>
                    <li>Choose your layout preference (Summary vs. Detailed) and click download.</li>
                  </ol>
                </div>
              </details>

              {/* Accordion Item 3 */}
              <details className="group bg-cyan-200 rounded-xl border border-white/50 shadow-sm open:ring-2 open:ring-primary/20 open:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-open:bg-primary group-open:text-white transition-colors">
                      <span className="material-symbols-outlined text-sm">group_add</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      How do I invite a colleague to view a record?
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0 ml-[3.25rem]">
                  <p className="text-text-secondary leading-relaxed">
                    Collaboration is secure and simple. On any patient record, click the "Share" icon. Enter your
                    colleague's registered email address. They will receive a secure link to view the record. Please
                    note, for HIPAA compliance, external sharing is disabled by default; you can only share with verified
                    accounts within your organization.
                  </p>
                </div>
              </details>

              {/* Accordion Item 4 */}
              <details className="group bg-cyan-200 rounded-xl border border-white/50 shadow-sm open:ring-2 open:ring-primary/20 open:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-open:bg-primary group-open:text-white transition-colors">
                      <span className="material-symbols-outlined text-sm">lock_person</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      How do I reset my password securely?
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0 ml-[3.25rem]">
                  <p className="text-text-secondary leading-relaxed">
                    Go to the login page and click "Forgot Password". Enter your email, and we will send a time-sensitive
                    link. For security reasons, this link expires in 15 minutes. If you have 2FA enabled, you will also
                    need your authenticator code to complete the reset process.
                  </p>
                </div>
              </details>

              {/* Accordion Item 5 */}
              <details className="group bg-cyan-200 rounded-xl border border-white/50 shadow-sm open:ring-2 open:ring-primary/20 open:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-open:bg-primary group-open:text-white transition-colors">
                      <span className="material-symbols-outlined text-sm">browser_updated</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                      Which browsers are supported?
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary transition-transform duration-300 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0 ml-[3.25rem]">
                  <p className="text-text-secondary leading-relaxed">
                    For the most accurate rendering of ECG waveforms, we recommend the latest versions of{' '}
                    <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Firefox</strong>. Safari
                    support is currently in beta. Internet Explorer is not supported.
                  </p>
                </div>
              </details>
            </div>

            {/* Pagination / More */}
            <div className="flex justify-center mt-8">
              <button className="text-accent-blue font-semibold hover:text-primary transition-colors flex items-center gap-2">
                <span>Load more questions</span>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default FAQ
