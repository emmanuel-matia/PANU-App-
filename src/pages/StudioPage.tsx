import React, { useEffect, useState } from 'react';
import { MultiTrackTimeline } from '../components/studio/MultiTrackTimeline';
import { StudioToolbar, StudioToolId, AspectRatioType, VideoAdjustments } from '../components/studio/StudioToolbar';
import { VideoExportPanel } from '../components/studio/VideoExportPanel';
import { PhotoAiStudio } from '../components/studio/PhotoAiStudio';
import { DynamicTemplateGallery } from '../components/studio/DynamicTemplateGallery';
import { PanuTopNavbar } from '../components/nav/PanuTopNavbar';
import {
  getLocalStudioDrafts,
  initOfflinePwaAndAutoSync,
  OfflineStudioDraft,
  saveDraftLocallyOfflineFirst,
  syncPendingOfflineDraftsToSupabase,
} from '../services/offlineSyncService';

/**
 * PAGE PRINCIPALE : PANU STUDIO IA PROFESSIONNEL (STYLE CAPCUT / CANVA / TIKTOK STUDIO)
 * - Éditeur vidéo complet avec Timeline multi-pistes (Vidéo, PIP, Audio, Sous-titres)
 * - Barre d'outils de montage (Découpage, Filtres, Ajustements, Stickers, Arrière-plan, Ratio)
 * - Panneau d'exportation avec simulation dynamique du bitrate et taille de fichier + IA Ultra HD
 * - Studio Photo & Outils Marketing IA (Détourage, Photos Produits, Affiches, Téléprompteur)
 * - Mode Gratuit & Mode Hors-ligne PWA avec synchronisation automatique Supabase
 */
export const StudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'photo' | 'templates' | 'drafts'>('video');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [drafts, setDrafts] = useState<OfflineStudioDraft[]>(() => getLocalStudioDrafts());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // États du lecteur et de la Timeline vidéo
  const [currentTime, setCurrentTime] = useState<number>(14.5);
  const [totalDuration, setTotalDuration] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // États des outils de montage
  const [activeTool, setActiveTool] = useState<StudioToolId | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [backgroundType, setBackgroundType] = useState<'blur' | 'color' | 'gradient' | 'image'>('blur');
  const [backgroundColor, setBackgroundColor] = useState<string>('#1A1C29');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const [adjustments, setAdjustments] = useState<VideoAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    vignette: 0,
    sharpness: 0,
  });

  // Gestion du retour en ligne & synchronisation PWA
  useEffect(() => {
    initOfflinePwaAndAutoSync((syncedCount) => {
      setDrafts(getLocalStudioDrafts());
      setSyncMessage(`🔄 ${syncedCount} projet(s) hors-ligne synchronisé(s) automatiquement avec Supabase !`);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAutoGenerateSubtitles = () => {
    setIsGeneratingSubtitles(true);
    setTimeout(() => {
      setIsGeneratingSubtitles(false);
      setSyncMessage('✅ Sous-titres IA générés et synchronisés sur la piste texte !');
      setTimeout(() => setSyncMessage(null), 4000);
    }, 1800);
  };

  const handleSplitCurrentClip = () => {
    setSyncMessage(`✂️ Clip scindé avec succès à ${currentTime.toFixed(1)}s`);
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // Dimensions dynamiques selon le ratio vidéo sélectionné
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case '9:16': return { width: 230, height: 408 };
      case '16:9': return { width: 440, height: 248 };
      case '1:1': return { width: 320, height: 320 };
      case '4:5': return { width: 260, height: 325 };
      case '21:9': return { width: 460, height: 198 };
      default: return { width: 240, height: 426 };
    }
  };

  const canvasDim = getCanvasDimensions();

  return (
    <div style={{ backgroundColor: '#0B0C12', color: '#F8F9FA', minHeight: '100vh' }}>
      <PanuTopNavbar />
      <div style={{ padding: '16px 20px 80px', maxWidth: 1400, margin: '0 auto' }}>
      {/* En-tête statut & sélecteur des onglets principaux */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, color: '#E5A93C', fontWeight: 900 }}>
              PANU STUDIO PRO
            </h1>
            <span
              style={{
                backgroundColor: isOnline ? 'rgba(46, 213, 115, 0.16)' : 'rgba(255, 71, 87, 0.16)',
                border: isOnline ? '1px solid #2ED573' : '1px solid #FF4757',
                color: isOnline ? '#2ED573' : '#FF4757',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {isOnline ? '● EN LIGNE (CLOUD)' : '📴 HORS-LIGNE (LOCAL)'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#888F9E', fontSize: 12 }}>
            Éditeur vidéo professionnel style CapCut • Multi-IA (Gemini, Claude, Fal.ai) & PWA locale
          </p>
        </div>

        {/* Bouton Exporter Direct */}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          style={{
            backgroundColor: '#E5A93C',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(229, 169, 60, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🚀</span>
          <span>Paramètres d'Exportation</span>
        </button>
      </div>

      {/* Onglets de navigation du Studio */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#12141D',
          padding: 6,
          borderRadius: 12,
          border: '1px solid #222636',
          marginBottom: 20,
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'video', label: '🎬 Éditeur Vidéo & Timeline (CapCut)', desc: 'Montage multi-pistes' },
          { key: 'photo', label: '📸 Studio Photo & Marketing IA', desc: 'Détourage, E-Commerce' },
          { key: 'templates', label: '🎨 Templates Prêts à l’Emploi', desc: 'Canva, Reels' },
          { key: 'drafts', label: '💾 Projets & Brouillons Hors-ligne', desc: `${drafts.length} projet(s)` },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: isSelected ? '#E5A93C' : 'transparent',
                color: isSelected ? '#000' : '#BBB',
                border: 'none',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div>{tab.label}</div>
            </button>
          );
        })}
      </div>

      {syncMessage && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, backgroundColor: '#1A2E22', border: '1px solid #2ED573', color: '#2ED573', fontSize: 13, fontWeight: 700 }}>
          {syncMessage}
        </div>
      )}

      {/* 1. ONGLET : ÉDITEUR VIDÉO & TIMELINE MULTI-PISTES */}
      {activeTab === 'video' && (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Zone de prévisualisation centrale Canvas + Fond stylé */}
          <div
            style={{
              backgroundColor: '#11131B',
              border: '1px solid #252838',
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 460,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Arrière-plan flou ou couleur */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: backgroundType === 'color' ? backgroundColor : '#0A0B10',
                filter: backgroundType === 'blur' ? 'blur(30px)' : 'none',
                opacity: 0.6,
                backgroundImage:
                  backgroundType === 'gradient'
                    ? 'linear-gradient(135deg, #1A1C29 0%, #3A2B18 100%)'
                    : 'none',
              }}
            />

            {/* Canvas du Moniteur Vidéo avec le format sélectionné */}
            <div
              style={{
                width: canvasDim.width,
                height: canvasDim.height,
                backgroundColor: '#000',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
                border: '2px solid rgba(229, 169, 60, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              {/* Vidéo / Image de simulation avec filtres appliqués */}
              <img
                src={
                  coverImageUrl ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
                }
                alt="Player"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: `brightness(${100 + adjustments.brightness}%) contrast(${
                    100 + adjustments.contrast
                  }%) saturate(${100 + adjustments.saturation}%)`,
                }}
              />

              {/* Incrustation Sous-titres Auto */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 12,
                  right: 12,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  color: '#FFD700',
                  fontWeight: 900,
                  fontSize: 13,
                  textShadow: '0 2px 4px #000',
                }}
              >
                🔥 "Créer du contenu viral en Afrique avec PANU Studio !"
              </div>

              {/* Badge Format */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#E5A93C',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {aspectRatio}
              </div>
            </div>
          </div>

          {/* Barre d'Outils de Montage CapCut */}
          <StudioToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            aspectRatio={aspectRatio}
            onChangeAspectRatio={setAspectRatio}
            adjustments={adjustments}
            onChangeAdjustments={setAdjustments}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            backgroundType={backgroundType}
            backgroundColor={backgroundColor}
            onChangeBackground={(type, val) => {
              setBackgroundType(type);
              setBackgroundColor(val);
            }}
            coverImageUrl={coverImageUrl}
            onSelectCoverImage={() => {
              setCoverImageUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80');
              setSyncMessage('✅ Image de couverture mise à jour depuis la galerie !');
              setTimeout(() => setSyncMessage(null), 3000);
            }}
            onAutoGenerateSubtitles={handleAutoGenerateSubtitles}
            isGeneratingSubtitles={isGeneratingSubtitles}
            onOpenTeleprompter={() => setActiveTab('photo')}
            onOpenExportPanel={() => setShowExportModal(true)}
          />

          {/* Timeline Multi-Pistes Interactive */}
          <MultiTrackTimeline
            currentTime={currentTime}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
            onSeek={setCurrentTime}
            onTogglePlay={handleTogglePlay}
            onSplitCurrentClip={handleSplitCurrentClip}
          />
        </div>
      )}

      {/* 2. ONGLET : STUDIO PHOTO & MARKETING IA */}
      {activeTab === 'photo' && <PhotoAiStudio />}

      {/* 3. ONGLET : TEMPLATES DYNAMIQUES */}
      {activeTab === 'templates' && <DynamicTemplateGallery />}

      {/* 4. ONGLET : BROUILLONS & MODE HORS-LIGNE */}
      {activeTab === 'drafts' && (
        <div style={{ backgroundColor: '#141622', border: '1px solid #282C3D', borderRadius: 14, padding: 18 }}>
          <h3 style={{ margin: '0 0 10px', color: '#E5A93C' }}>
            💾 Projets Locaux en Cache PWA (Mode Gratuit & Hors-ligne)
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#AAA' }}>
            Tous vos montages et brouillons sont sauvegardés localement dans le stockage sécurisé de votre navigateur et synchronisés automatiquement avec Supabase dès que vous retrouvez la connexion.
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            {drafts.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 13 }}>
                Aucun projet hors-ligne enregistré pour le moment.
              </div>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    backgroundColor: '#1B1E2E',
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid #2E3347',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#FFF' }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      Catégorie : {d.category} • Format : {d.exportFormat} • {new Date(d.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: d.synced ? 'rgba(46, 213, 115, 0.15)' : 'rgba(229, 169, 60, 0.15)',
                      color: d.synced ? '#2ED573' : '#E5A93C',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {d.synced ? '✓ Synchronisé' : '⏳ En attente de réseau'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modale d'Exportation Vidéo & Upscaling IA */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <VideoExportPanel
              isOpen={showExportModal}
              videoDurationSeconds={totalDuration}
              onClose={() => setShowExportModal(false)}
              onStartExport={(settings) => {
                setSyncMessage(`🚀 Exportation ${settings.resolution} (${settings.framerate} FPS, ${settings.bitrateMbps} Mbit/s) lancée avec succès !`);
                setShowExportModal(false);
                setTimeout(() => setSyncMessage(null), 5000);
              }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudioPage;
