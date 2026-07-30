import { useState, useCallback } from 'react';
import { API_URL } from '../api';

const useUserPhoto = () => {
  const [userPhoto, setUserPhoto] = useState(null);

  const loadPhoto = useCallback((fotoPerfil) => {
    if (!fotoPerfil) {
      setUserPhoto(null);
      return;
    }

    const urlsToTry = [
      `${API_URL}/uploads/personal/${fotoPerfil}`,
      `${API_URL}/api/university/personal/foto/${fotoPerfil}`,
    ];

    const tryLoad = (index) => {
      if (index >= urlsToTry.length) {
        setUserPhoto(null);
        return;
      }

      const img = new Image();
      img.onload = () => setUserPhoto(urlsToTry[index]);
      img.onerror = () => tryLoad(index + 1);
      img.src = urlsToTry[index];
    };

    tryLoad(0);
  }, []);

  return { userPhoto, loadPhoto };
};

export default useUserPhoto;
