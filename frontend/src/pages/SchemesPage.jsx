import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getSchemes } from '../services/api.js';
import SchemeCard from '../components/SchemeCard.jsx';
import LoadingState from '../components/LoadingState.jsx';

export default function SchemesPage({ language }) {
  const [schemes, setSchemes] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    getSchemes().then(setSchemes);
  }, []);

  const filteredSchemes = (schemes || []).filter((s) => {
    const name = language === 'hi' ? s.hiName : s.name;
    const desc = language === 'hi' ? s.hiShortDesc : s.shortDesc;
    const cat = language === 'hi' ? s.hiCategory : s.category;

    const matchesCat = filterCategory === 'All' || cat.includes(filterCategory) || s.category.includes(filterCategory);
    const matchesQuery = name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="border-b border-slate-300 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1b365d]">{t('schemesTitle')}</h2>
          <p className="text-xs text-slate-600">{t('schemesSub')}</p>
        </div>

        <input
          type="search"
          aria-label={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border border-slate-300 rounded px-3 py-1.5 text-xs w-full md:w-64 focus:outline-none focus:border-[#1b365d]"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        {[
          { key: 'All', label: t('allCat') },
          { key: 'Agriculture', label: t('agriCat') },
          { key: 'Housing', label: t('housingCat') },
          { key: 'Social Welfare', label: t('socialCat') },
          { key: 'Healthcare', label: t('healthCat') },
          { key: 'Energy', label: t('energyCat') },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            aria-pressed={filterCategory === cat.key}
            className={`px-2.5 py-1 rounded border transition-colors ${filterCategory === cat.key ? 'bg-[#1b365d] text-white border-[#1b365d]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!schemes ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} language={language} onViewDetails={(id) => navigate(`/schemes/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
