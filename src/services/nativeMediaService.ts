import { supabase } from '../lib/supabaseClient';

export interface SelectedMediaFile {
  file?: File;
  blob?: Blob;
  previewUrl: string;
  name: string;
  type: 'image' | 'video';
  source: 'phone_gallery' | 'native_camera' | 'device_storage';
}

/**
 * Helper sécurisé pour détecter l'environnement natif Capacitor / Cordova
 */
function isCapacitorAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.() || !!(window as any).Capacitor?.Plugins?.Camera;
}

/**
 * 1. SÉLECTION DEPUIS LA GALERIE LOCALE DU TÉLÉPHONE
 * RÈGLE FONDAMENTALE : Ne JAMAIS inclure l'attribut `capture` sur cet <input type="file">.
 * L'absence de l'attribut `capture` permet à Android et iOS d'ouvrir directement
 * la galerie photo locale du téléphone plutôt que de forcer Google Photos ou la caméra.
 */
export async function pickImageFromPhoneGallery(): Promise<SelectedMediaFile> {
  // Option A : Environnement natif Capacitor / Cordova avec plugin Camera
  if (isCapacitorAvailable()) {
    try {
      const capacitorPlugins = (window as any).Capacitor?.Plugins;
      if (capacitorPlugins?.Camera) {
        // CameraSource.Photos = 1 (Ouvre la galerie locale de l'appareil)
        const photo = await capacitorPlugins.Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'uri', // ou 'dataUrl'
          source: 'PHOTOS', // CameraSource.Photos
        });

        const webPath = photo.webPath || photo.path;
        const response = await fetch(webPath);
        const blob = await response.blob();
        return {
          blob,
          previewUrl: webPath,
          name: `gallery_photo_${Date.now()}.jpg`,
          type: 'image',
          source: 'phone_gallery',
        };
      }
    } catch (err: any) {
      console.warn('Capacitor Camera.Photos non disponible ou annulé, passage au sélecteur web :', err);
    }
  }

  // Option B : Sélecteur Web / PWA optimisé pour la galerie locale
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    // STRICTEMENT image/* SANS attribut capture pour forcer la galerie locale du téléphone
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('Aucun fichier sélectionné'));
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        blob: file,
        previewUrl,
        name: file.name,
        type: 'image',
        source: 'phone_gallery',
      });
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      reject(new Error('Sélection annulée'));
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 2. CAPTURE EN DIRECT DEPUIS L'APPAREIL PHOTO PHYSIQUE (CAMÉRA)
 */
export async function takePhotoFromNativeCamera(): Promise<SelectedMediaFile> {
  // Option A : Plugin natif Capacitor avec source = CAMERA
  if (isCapacitorAvailable()) {
    try {
      const capacitorPlugins = (window as any).Capacitor?.Plugins;
      if (capacitorPlugins?.Camera) {
        const photo = await capacitorPlugins.Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'uri',
          source: 'CAMERA', // CameraSource.Camera
        });

        const webPath = photo.webPath || photo.path;
        const response = await fetch(webPath);
        const blob = await response.blob();
        return {
          blob,
          previewUrl: webPath,
          name: `camera_photo_${Date.now()}.jpg`,
          type: 'image',
          source: 'native_camera',
        };
      }
    } catch (err) {
      console.warn('Capacitor Camera non disponible, fallback Web :', err);
    }
  }

  // Option B : Web avec attribut capture activé UNIQUEMENT pour la caméra
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment'); // Déclenche spécifiquement l'appareil photo
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('Aucune capture effectuée'));
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        blob: file,
        previewUrl,
        name: file.name,
        type: 'image',
        source: 'native_camera',
      });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 3. SÉLECTION D'UNE VIDÉO DEPUIS LA GALERIE LOCALE
 * Sans attribut capture pour garantir l'ouverture de la galerie vidéo du téléphone
 */
export async function pickVideoFromPhoneGallery(): Promise<SelectedMediaFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('Aucune vidéo sélectionnée'));
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        blob: file,
        previewUrl,
        name: file.name,
        type: 'video',
        source: 'phone_gallery',
      });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 4. TÉLÉVERSEMENT AUTOMATIQUE VERS SUPABASE STORAGE
 * Buckets supportés : avatars, covers, logos, post-media
 */
export async function uploadMediaToSupabase(
  media: SelectedMediaFile,
  bucket: 'avatars' | 'covers' | 'logos' | 'post-media',
  userId: string,
  category: 'avatar' | 'cover' | 'logo' | 'video'
): Promise<string> {
  const content = media.file || media.blob;
  if (!content) {
    throw new Error('Fichier introuvable pour le téléversement');
  }

  const ext = media.type === 'video' ? 'mp4' : 'jpg';
  const fileName = `${userId}/${category}_${Date.now()}.${ext}`;

  // Récupération de l'URL Supabase active
  const activeSupabaseUrl =
    (supabase as any).supabaseUrl ||
    (typeof window !== 'undefined' && ((window as any).__SUPABASE_URL__ || (import.meta as any)?.env?.VITE_SUPABASE_URL)) ||
    'https://xscnbjmiinznzepxzcvn.supabase.co';

  console.log(`[PANU Storage] Upload en cours -> Bucket: '${bucket}' | Supabase URL: '${activeSupabaseUrl}' | Fichier: '${fileName}'`, {
    bucket,
    supabaseUrl: activeSupabaseUrl,
    fileName,
    sizeBytes: content.size,
    mimeType: media.type === 'video' ? 'video/mp4' : 'image/jpeg'
  });

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, content, {
    upsert: true,
    contentType: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
  });

  if (error) {
    console.error(`[PANU Storage] Échec upload bucket '${bucket}' sur '${activeSupabaseUrl}':`, error);

    // Si le bucket spécifique n'existe pas, fallback sur le bucket universel post-media
    if (bucket !== 'post-media') {
      console.warn(`[PANU Storage] Tentative de repli (fallback) sur le bucket 'post-media' sur '${activeSupabaseUrl}'...`);
      const fallback = await supabase.storage.from('post-media').upload(fileName, content, {
        upsert: true,
      });
      if (fallback.error) {
        console.error(`[PANU Storage] Échec fallback sur bucket 'post-media':`, fallback.error);
        throw new Error(
          `Bucket '${bucket}' ou 'post-media' introuvable sur ${activeSupabaseUrl} (${fallback.error.message}). Créez le bucket public dans Supabase Storage.`
        );
      }
      const { data: publicData } = supabase.storage.from('post-media').getPublicUrl(fileName);
      console.log(`[PANU Storage] Succès upload fallback -> Bucket: 'post-media' | URL: ${publicData.publicUrl}`);
      return publicData.publicUrl;
    }

    const detailedErr = error.message?.includes('Bucket not found') || (error as any).statusCode === '404'
      ? `Bucket '${bucket}' introuvable sur '${activeSupabaseUrl}' (404 NoSuchBucket). Créez le bucket public '${bucket}' dans le dashboard Supabase Storage.`
      : `Échec upload Supabase Storage (Bucket: '${bucket}', URL: '${activeSupabaseUrl}') : ${error.message}`;

    throw new Error(detailedErr);
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  console.log(`[PANU Storage] Upload RÉUSSI -> Bucket: '${bucket}' | URL publique: ${publicData.publicUrl}`);
  return publicData.publicUrl;
}
