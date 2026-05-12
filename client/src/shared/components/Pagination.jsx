import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable Pagination component matching the dark UI theme.
 *
 * @param {number} currentPage - The current active page
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Called with the new page number when a button is clicked
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-white/10 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <span className="text-sm font-medium text-slate-400">
        Page <span className="text-white">{currentPage}</span> of{" "}
        <span className="text-white">{totalPages}</span>
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-white/10 rounded-xl hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
