import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../firebase';

interface SiteSettings {
  logoUrl: string | null;
  siteName: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: null,
    siteName: 'Indiy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings({
          logoUrl: data.logoUrl || null,
          siteName: data.siteName || 'Indiy'
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching site settings:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { settings, loading };
};
