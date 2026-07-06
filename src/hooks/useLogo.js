import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../api';
import { FILE_EXTENSIONS, IMAGES } from '../constants/index';

const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [strideLogoUrl, setStrideLogoUrl] = useState(null);

  const loadLogo = useCallback(() => {
    const baseUrl = `${API_URL}/uploads/logos/institution-logo`;
    const extensions = FILE_EXTENSIONS.LOGO;

    const imagePromises = extensions.map(ext => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ found: true, url: baseUrl + ext });
        img.onerror = () => resolve({ found: false, url: baseUrl + ext });
        img.src = baseUrl + ext;
      });
    });

    Promise.all(imagePromises).then(results => {
      const found = results.find(r => r.found);
      setLogoUrl(found ? found.url : null);
    });
  }, []);

  const loadStrideLogo = useCallback(() => {
    const primary = `${API_URL}${IMAGES.STRIDE_LOGO}`;
    const fallback = `${API_URL}${IMAGES.STRIDE_LOGO_FALLBACK}`;

    const img = new Image();
    img.onload = () => setStrideLogoUrl(primary);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => setStrideLogoUrl(fallback);
      img2.onerror = () => setStrideLogoUrl(null);
      img2.src = fallback;
    };
    img.src = primary;
  }, []);

  useEffect(() => {
    loadLogo();
    loadStrideLogo();
  }, [loadLogo, loadStrideLogo]);

  return { logoUrl, strideLogoUrl, reload: loadLogo };
};

export default useLogo;
