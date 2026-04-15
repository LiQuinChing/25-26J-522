import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function MainSidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic classes for active vs inactive routes
    const navLinkClasses = ({ isActive }) => 
        `px-4 py-3 rounded-lg font-bold mb-2 transition-all duration-300 flex items-center gap-4 whitespace-nowrap overflow-hidden ${
            isActive ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-teal-100 hover:text-teal-700'
        }`;

    return (
        <aside 
            className={`bg-cyan-50 border-r border-cyan-100 h-full py-6 transition-all duration-300 ease-in-out z-40 flex flex-col shrink-0 overflow-hidden ${
                isExpanded ? 'w-64 px-4' : 'w-20 px-2'
            }`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="mb-6 flex-1">
                {/* Header that fades in/out */}
                <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Detect & Analyze</p>
                </div>

                <nav className="flex flex-col gap-2">
                    <NavLink to="/upload-ecg" className={navLinkClasses}>
                        <i className="fas fa-wave-square text-xl w-6 text-center"></i>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Arrhythmia</span>
                    </NavLink>
                    
                    <NavLink to="/upload-cad-ecg" className={navLinkClasses}>
                        <i className="fas fa-heart-broken text-xl w-6 text-center"></i>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>CAD (Ischemia)</span>
                    </NavLink>
                    
                    <NavLink to="/svt-analysis" className={navLinkClasses}>
                        <i className="fas fa-bolt text-xl w-6 text-center"></i>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>SVT</span>
                    </NavLink>

                    <NavLink to="/myocardial-infarction" className={navLinkClasses}>
                        <i className="fas fa-bolt text-xl w-6 text-center"></i>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Myocardial Infarction</span>
                    </NavLink>

                    <NavLink to="/img-csv" className={navLinkClasses}>
                        <i className="fas fa-file-csv text-xl w-6 text-center"></i>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Image to CSV</span>
                    </NavLink>
                </nav>
            </div>
        </aside>
    );
}