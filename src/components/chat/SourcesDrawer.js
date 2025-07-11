import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ArrowTopRightOnSquareIcon, BookOpenIcon } from "@heroicons/react/24/outline";

export default function SourcesDrawer({ isOpen, onClose, sources }) {
  if (!sources || sources.length === 0) return null;

  const handleSourceClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[80%] max-w-md bg-white dark:bg-[#181818] shadow-xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-[#3B3B3B]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-[#3B3B3B]/50 rounded-xl">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Sources</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{sources.length} references</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-[#3B3B3B] rounded-xl transition-colors text-slate-600 dark:text-slate-200 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <XMarkIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Sources list */}
            <motion.div 
              className="flex flex-col overflow-y-auto overflow-x-hidden bg-white dark:bg-[#181818]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-full">
                {sources.map((source, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSourceClick(source.url)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full text-left"
                  >
                    <div className="group/card cursor-pointer relative p-6 transition-all duration-200 
                      hover:border-blue-200 dark:hover:border-[#3B3B3B]/50 hover:bg-gray-200 dark:hover:bg-[#3B3B3B]/50 border-b border-b-gray-200 dark:border-[#3B3B3B]"
                    >
                      {/* Title */}
                      {source.title && (
                        <h3 className="font-regular text-[14px] text-slate-700 dark:text-slate-200 line-clamp-3 break-words">
                          {source.title}
                        </h3>
                      )}

                      {/* Link preview */}
                      {source.url && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 dark:group-hover/card:text-blue-600 group-hover/card:text-blue-700">
                          <span className="underline-offset-2 group-hover/card:underline break-all">{source.url}</span>
                        </div>
                      )}

                      {/* Snippet */}
                      {source.snippet && (
                        <div className="mt-2 relative">
                          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white group-hover/card:from-blue-50/30 to-transparent pointer-events-none transition-colors" />
                          <p className="text-sm text-slate-600 group-hover/card:text-slate-700 line-clamp-3 break-words">
                            {source.snippet}
                          </p>
                        </div>
                      )}

                      {/* Source metadata */}
                      {source.metadata && (
                        <div className="mt-3 pt-3 border-t border-slate-100 group-hover/card:border-blue-100 flex items-center gap-3 transition-colors">
                          {source.metadata.date && (
                            <span className="text-xs text-slate-500 group-hover/card:text-slate-600">
                              {source.metadata.date}
                            </span>
                          )}
                          {source.metadata.author && (
                            <span className="text-xs text-slate-500 group-hover/card:text-slate-600">
                              By {source.metadata.author}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 