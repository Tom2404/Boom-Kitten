import React from 'react';

// Click-based paging so viewport-fit pages never need a page-level scrollbar.
export default function Pager({ page, pageCount, onChange, label = 'Phân trang', status = '' }) {
    if (pageCount <= 1) return null;
    return (
        <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onChange(index)}
                    aria-current={index === page ? 'page' : undefined}
                    className={`vf-pager-button border-2 border-[var(--pop-black)] px-3 text-sm font-black uppercase shadow-[2px_2px_0_var(--pop-black)] focus:outline-none focus:ring-2 focus:ring-[var(--pop-red)] ${index === page ? 'bg-[var(--pop-red)] text-white' : 'bg-white'
                        }`}
                >
                    {index + 1}
                </button>
            ))}
            <span aria-live="polite" className="text-xs font-bold opacity-70">{status}</span>
        </nav>
    );
}
