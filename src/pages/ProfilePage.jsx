import { useEffect, useState } from 'react';
import { getTranslation } from '../utils/translations.js';
import { getProfile } from '../services/api.js';
import LoadingState from '../components/LoadingState.jsx';

const fieldClass = 'w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800';

export default function ProfilePage({ language }) {
  const [profile, setProfile] = useState(null);
  const hi = language === 'hi';
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="border-b border-slate-300 pb-2">
        <h2 className="text-xl font-bold text-[#1b365d]">{t('profileHeader')}</h2>
        <p className="text-xs text-slate-600">{t('profileHeaderSub')}</p>
      </div>

      {!profile ? (
        <LoadingState />
      ) : (
        <div className="bg-white border border-slate-300 rounded p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label htmlFor="p-name" className="font-bold text-slate-700">{t('fullName')}</label>
              <input id="p-name" type="text" readOnly value={hi ? profile.hiName : profile.name} className={fieldClass} />
            </div>

            <div className="space-y-1">
              <label htmlFor="p-age" className="font-bold text-slate-700">{t('ageGender')}</label>
              <input id="p-age" type="text" readOnly value={`${profile.age} ${hi ? 'वर्ष' : 'Years'} / ${hi ? profile.hiGender : profile.gender}`} className={fieldClass} />
            </div>

            <div className="space-y-1">
              <label htmlFor="p-income" className="font-bold text-slate-700">{t('annIncome')}</label>
              <input id="p-income" type="text" readOnly value={profile.income} className={fieldClass} />
            </div>

            <div className="space-y-1">
              <label htmlFor="p-occ" className="font-bold text-slate-700">{t('primaryOcc')}</label>
              <input id="p-occ" type="text" readOnly value={hi ? profile.hiOccupation : profile.occupation} className={fieldClass} />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button className="bg-[#1b365d] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#122440]">
              {t('updateProfile')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
