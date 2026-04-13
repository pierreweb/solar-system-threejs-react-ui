import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  language: 'EN' | 'FR';
  isDark: boolean;
  initialDate: Date;
}

type SeasonalShortcutKey =
  | 'springEquinox'
  | 'summerSolstice'
  | 'autumnEquinox'
  | 'winterSolstice';

const SEASONAL_SHORTCUT_CONFIG: Record<
  SeasonalShortcutKey,
  { monthIndex: number; day: number; label: { EN: string; FR: string } }
> = {
  springEquinox: {
    monthIndex: 2,
    day: 20,
    label: { EN: 'Spring Equinox', FR: 'Equinoxe de printemps' },
  },
  summerSolstice: {
    monthIndex: 5,
    day: 21,
    label: { EN: 'Summer Solstice', FR: 'Solstice d’été' },
  },
  autumnEquinox: {
    monthIndex: 8,
    day: 22,
    label: { EN: 'Autumn Equinox', FR: 'Equinoxe d’automne' },
  },
  winterSolstice: {
    monthIndex: 11,
    day: 21,
    label: { EN: 'Winter Solstice', FR: 'Solstice d’hiver' },
  },
};

function getSeasonalShortcutDate(
  season: SeasonalShortcutKey,
  year: number,
) {
  const { monthIndex, day } = SEASONAL_SHORTCUT_CONFIG[season];
  return new Date(year, monthIndex, day);
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ isOpen, onClose, onSelect, language, isDark, initialDate }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  
  // Update local state when initialDate changes (e.g. when modal re-opens)
  React.useEffect(() => {
    if (isOpen) {
      setCurrentDate(initialDate);
    }
  }, [isOpen, initialDate]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = language === 'EN' 
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i); // 1900 to 2100
  const seasonalShortcutRows: SeasonalShortcutKey[][] = [
    ['springEquinox', 'autumnEquinox'],
    ['summerSolstice', 'winterSolstice'],
  ];

  const applySelectedDate = (date: Date) => {
    onSelect(date);
    onClose();
  };

  const handleMonthChange = (monthIndex: number) => {
    const year = currentDate.getFullYear();
    const lastDayOfNewMonth = new Date(year, monthIndex + 1, 0).getDate();
    const day = Math.min(currentDate.getDate(), lastDayOfNewMonth);
    setCurrentDate(new Date(year, monthIndex, day));
    setShowMonthSelector(false);
  };

  const handleYearChange = (year: number) => {
    const month = currentDate.getMonth();
    const lastDayOfNewMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(currentDate.getDate(), lastDayOfNewMonth);
    setCurrentDate(new Date(year, month, day));
    setShowYearSelector(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "relative w-full max-w-md glass-panel rounded-2xl overflow-hidden p-6",
              isDark ? "text-white" : "text-black"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn(
                "text-lg font-medium flex items-center gap-2",
                isDark ? "text-gold-neon neon-text-gold" : "text-mist-primary"
              )}>
                <CalendarIcon size={20} />
                {language === 'FR' ? 'Date d’observation' : 'Observation Date'}
              </h3>
              <button 
                onClick={onClose}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                )}
              >
                <X size={20} />
              </button>
            </div>

            {/* Month/Year Toggles */}
             <div className="flex gap-2 mb-4">
              <button 
                onClick={() => {
                  setShowMonthSelector(!showMonthSelector);
                  setShowYearSelector(false);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 transition-all",
                  isDark ? "border-white/10 hover:border-gold-neon/50" : "border-black/10 hover:border-mist-primary/50"
                )}
              >
                {monthNames[currentDate.getMonth()]}
                <ChevronDown size={14} className={isDark ? "text-gold-neon" : "text-mist-primary"} />
              </button>
              <button 
                onClick={() => {
                  setShowYearSelector(!showYearSelector);
                  setShowMonthSelector(false);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 transition-all",
                  isDark ? "border-white/10 hover:border-gold-neon/50" : "border-black/10 hover:border-mist-primary/50"
                )}
              >
                {currentDate.getFullYear()}
                <ChevronDown size={14} className={isDark ? "text-gold-neon" : "text-mist-primary"} />
              </button>
            </div>

            {/* Scrollers (Conditional) */}
            <AnimatePresence mode="wait">
              {showMonthSelector && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 160 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "overflow-y-auto rounded-lg border p-1 mb-4 scrollbar-hide",
                    isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-white/20"
                  )}
                >
                  {monthNames.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => handleMonthChange(i)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs rounded transition-all",
                        currentDate.getMonth() === i
                          ? (isDark ? "bg-gold-neon text-black font-bold" : "bg-mist-primary text-white font-bold")
                          : (isDark ? "hover:bg-white/5" : "hover:bg-black/5")
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </motion.div>
              )}

              {showYearSelector && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 160 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "overflow-y-auto rounded-lg border p-1 mb-4 scrollbar-hide",
                    isDark ? "border-white/10 bg-black/20" : "border-black/10 bg-white/20"
                  )}
                >
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs rounded transition-all",
                        currentDate.getFullYear() === year
                          ? (isDark ? "bg-gold-neon text-black font-bold" : "bg-mist-primary text-white font-bold")
                          : (isDark ? "hover:bg-white/5" : "hover:bg-black/5")
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!showMonthSelector && !showYearSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-7 gap-1 mb-2"
              >
                {(language === 'EN' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['D', 'L', 'M', 'M', 'J', 'V', 'S']).map((d, i) => (
                  <div key={`${d}-${i}`} className={cn(
                    "text-center text-[10px] font-bold py-2 opacity-40"
                  )}>{d}</div>
                ))}
                {padding.map(i => <div key={`p-${i}`} />)}
                {days.map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                      setCurrentDate(selected);
                    }}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm rounded-lg transition-all",
                      d === currentDate.getDate()
                        ? (isDark ? "bg-gold-neon text-black font-bold" : "bg-mist-primary text-white font-bold")
                        : (isDark ? "hover:bg-gold-neon/20 hover:text-gold-neon" : "hover:bg-mist-primary/20 hover:text-mist-primary")
                    )}
                  >
                    {d}
                  </button>
                ))}
              </motion.div>
            )}

            <div className="mt-4">
              <div className="space-y-2">
                {seasonalShortcutRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    {row.map((seasonKey) => {
                      const seasonConfig = SEASONAL_SHORTCUT_CONFIG[seasonKey];

                      return (
                        <button
                          key={seasonKey}
                          onClick={() => {
                            const seasonalDate = getSeasonalShortcutDate(
                              seasonKey,
                              currentDate.getFullYear(),
                            );
                            setCurrentDate(seasonalDate);
                            applySelectedDate(seasonalDate);
                          }}
                          className={cn(
                            "flex-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide transition-all",
                            isDark
                              ? "border-white/10 text-white/75 hover:border-gold-neon/50 hover:text-gold-neon hover:bg-white/5"
                              : "border-black/10 text-black/75 hover:border-mist-primary/50 hover:text-mist-primary hover:bg-black/5",
                          )}
                        >
                          {seasonConfig.label[language]}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button 
                onClick={() => {
                  setCurrentDate(new Date());
                }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all border",
                  isDark 
                    ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5" 
                    : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"
                )}
              >
                {language === 'EN' ? 'Today' : 'Aujourd\'hui'}
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-colors",
                    isDark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"
                  )}
                >
                  {language === 'EN' ? 'Cancel' : 'Annuler'}
                </button>
                <button 
                  onClick={() => {
                    applySelectedDate(currentDate);
                  }}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-lg transition-transform hover:scale-105",
                    isDark ? "bg-gold-neon text-black neon-glow-gold" : "bg-mist-primary text-white shadow-lg"
                  )}
                >
                  {language === 'EN' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
