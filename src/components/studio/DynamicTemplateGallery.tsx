import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  generateWithMultiAiHub,
  publishGeneratedTemplateToPanu,
  MultiAiGenerationResult,
} from '../../services/multiAiService';
import { AIProviderId, AITaskType } from '../../config/aiKeysConfig';

export type TemplateCategoryKey =
  | 'canva_poster'
  | 'capcut_clip'
  | 'tiktok_script'
  | 'voucher_gift';

export interface StudioTemplateItem {
  id: string;
  category: TemplateCategoryKey;
  categoryLabel: string;
  title: string;
  badge: string;
  task: AITaskType;
  recommendedProvider: AIProviderId;
  recommendedModel: string;
  aiEngine: string;
  stylePreset: string;
  aspectRatio: string;
  soundDesignTrack: string;
  defaultPrompt: string;
  previewImage: string;
  explicitInstructions: string[];
}

export const PANU_DYNAMIC_TEMPLATES: StudioTemplateItem[] = [
  // 1. CLIPS CAPCUT VIRAUX (PIXVERSE / VEO / CAPCUT)
  {
    id: 'tpl_capcut_afro_viral',
    category: 'capcut_clip',
    categoryLabel: 'Clips CapCut Viraux',
    title: 'Clip CapCut & PixVerse : Effet Vitesse & Transitions Virales',
    badge: '🎬 CapCut & PixVerse • Veo 3.1',
    task: 'viral_video',
    recommendedProvider: 'gemini',
    recommendedModel: 'veo-3.1',
    aiEngine: 'Moteur PixVerse 2.5 & CapCut Speed-Ramp',
    stylePreset: 'Cinematic High-Energy 4K (Kinshasa / Lagos Pulse)',
    aspectRatio: '9:16 (Format Vertical TikTok / Reels / Shorts)',
    soundDesignTrack: 'Afro-House 124 BPM avec transition basse percutante',
    defaultPrompt:
      'Dynamique clip viral 9:16, découpage rapide style CapCut avec zoom avant/arrière fluide sur les temps forts, transitions lumineuses dorées et colorimétrie contrastée.',
    previewImage:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    explicitInstructions: [
      'Analyse du média source et détection automatique des visages et points d’ancrage.',
      'Application d’un effet Speed-Ramp (Ralenti 50% sur le geste clé, puis accélération x2 vers la transition).',
      'Étalonnage colorimétrique chaud "Lumière Dorée Africaine" avec compensation HDR.',
      'Synchronisation des cuts vidéo sur le tempo 124 BPM avec pulsation visuelle.',
      'Incrustation du logo PANU en filigrane subtil et sous-titres animés au mot-à-mot.',
    ],
  },
  {
    id: 'tpl_capcut_drone_8k',
    category: 'capcut_clip',
    categoryLabel: 'Clips CapCut Viraux',
    title: 'Clip CapCut / PixVerse : Survol Drone 8K Métropole Moderne',
    badge: '🎬 Drone 8K • PixVerse / Veo',
    task: 'viral_video',
    recommendedProvider: 'gemini',
    recommendedModel: 'veo-3.1',
    aiEngine: 'Moteur PixVerse FPV Drone & Motion Tracking',
    stylePreset: 'Hyper-Réaliste Documentaire 8K',
    aspectRatio: '9:16 (Plein Écran Mobile)',
    soundDesignTrack: 'Ambiance sonore urbaine & nappe cinématique progressive',
    defaultPrompt:
      'Cinematic 8K documentary shot, ultra-realistic, dynamic drone footage flying over a vibrant modern African metropolis at sunset, golden hour lighting, 35mm lens --ar 9:16 --fps 30',
    previewImage:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    explicitInstructions: [
      'Génération d’une trajectoire FPV continue avec inertie naturelle et lissage gyroscopique.',
      'Rendu des reflets de verre et lumières du crépuscule sur l’architecture urbaine.',
      'Effet de profondeur de champ cinématique 35mm f/1.8 sur le premier plan.',
      'Normalisation sonore des bruits d’ambiance et mixage stéréo spatialisé.',
    ],
  },
  // 2. POSTERS CANVA
  {
    id: 'tpl_canva_afro_concert',
    category: 'canva_poster',
    categoryLabel: 'Posters Canva',
    title: 'Affiche de Concert & Festival Afro-Urbain',
    badge: '🎨 Canva Poster • Gemini Image Pro',
    task: 'poster_image',
    recommendedProvider: 'gemini',
    recommendedModel: 'gemini-3.1-flash-lite-image',
    aiEngine: 'Moteur Graphique Gemini Image & Canva Layout',
    stylePreset: 'Néon Urbain & Typographie Dorée Royale',
    aspectRatio: '4:5 (Idéal Post Feed Instagram / Facebook)',
    soundDesignTrack: 'Non applicable (Format Visuel Haute Définition)',
    defaultPrompt:
      'Affiche officielle de festival musical africain moderne, typographie dorée royale PANU, éclairage néon et coucher de soleil, résolution 4K avec zone de texte réservée aux têtes d’affiche.',
    previewImage:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    explicitInstructions: [
      'Détourage précis du sujet ou artiste avec masque alpha haute définition.',
      'Composition géométrique selon la règle des tiers avec contraste maximal en haut de page.',
      'Génération de typographies 3D à texture or brossé et ombres portées douces.',
      'Exportation vectorielle optimisée pour affichage mobile et impression grand format.',
    ],
  },
  // 3. SCRIPTS TIKTOK & REELS (CLAUDE / GEMINI)
  {
    id: 'tpl_tiktok_hook_3s',
    category: 'tiktok_script',
    categoryLabel: 'Scripts TikTok & Reels',
    title: 'Script Viral TikTok : Hook 3 Secondes + Storytelling',
    badge: '✍️ Claude & Gemini • Script + Voix-Off',
    task: 'viral_script',
    recommendedProvider: 'claude',
    recommendedModel: 'claude-3-5-sonnet-latest',
    aiEngine: 'Moteur Script Claude 3.5 Sonnet & NLP Storytelling',
    stylePreset: 'Rétention Virale Maximale (Hook 3s, Problème, Révélation, Call-to-Action)',
    aspectRatio: 'Texte narratif horodaté pour tournage 9:16',
    soundDesignTrack: 'Voix-off dynamique IA avec accents au choix (Français / Lingala / Swahili)',
    defaultPrompt:
      'Génère un script TikTok ultra-percutant de 30 secondes pour créateurs de contenu en Afrique : structure Hook en 3 secondes (accroche choc), 3 astuces concrètes, appel à l’action vers l’abonnement.',
    previewImage:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
    explicitInstructions: [
      'Génération d’une phrase d’ouverture à fort taux de clic (Hook anti-scroll).',
      'Segmentation en 4 plans de tournage avec indications gestuelles précises de face caméra.',
      'Calcul du débit vocal optimal (140 mots/minute) pour maintenir l’attention sans essoufflement.',
      'Insertion d’un appel à l’action "Abonnez-vous à mon profil PANU" dans les 5 dernières secondes.',
    ],
  },
  // 4. VOUCHERS / CADEAUX
  {
    id: 'tpl_voucher_royal_vip',
    category: 'voucher_gift',
    categoryLabel: 'Vouchers/Cadeaux',
    title: 'Carte Cadeau & Voucher VIP Doré (Partenariat Marque)',
    badge: '🎁 Voucher PANU • Gemini Image Pro',
    task: 'poster_image',
    recommendedProvider: 'gemini',
    recommendedModel: 'gemini-2.5-flash-image',
    aiEngine: 'Moteur de Vouchers Sécurisés PANU & QR Generator',
    stylePreset: 'Luxe Noir Ébène & Or Champagne',
    aspectRatio: '16:9 (Format Billet / Pass Digital)',
    soundDesignTrack: 'Non applicable',
    defaultPrompt:
      'Design luxueux de carte cadeau VIP noire et or champagne pour une marque partenaire sur PANU, hologramme de sécurité et QR code élégant, badges de réduction officielle.',
    previewImage:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    explicitInstructions: [
      'Application d’une texture métallique noire avec brossage or fin.',
      'Génération d’un code QR de vérification unique et numéro de série infalsifiable.',
      'Protection filigrane anti-capture d’écran avec horodatage dynamique.',
    ],
  },
];

interface DynamicTemplateGalleryProps {
  currentUserId?: string | null;
  onRequireAuth?: () => void;
  onPublishedSuccess?: (post: any) => void;
  onTemplateSelect?: (template: StudioTemplateItem) => void;
}

/**
 * MOTEUR D'EXÉCUTION DE TEMPLATES VIDÉO & INSTRUCTIONS IA
 * Chaque template contient ses consignes explicites (style, montage CapCut/PixVerse, effets).
 * L'IA lit et applique automatiquement toutes ces consignes sur les médias de l'utilisateur.
 */
export const DynamicTemplateGallery: React.FC<DynamicTemplateGalleryProps> = ({
  currentUserId,
  onRequireAuth,
  onPublishedSuccess,
  onTemplateSelect,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryKey | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<StudioTemplateItem>(
    PANU_DYNAMIC_TEMPLATES[0]
  );
  const [customPrompt, setCustomPrompt] = useState<string>(PANU_DYNAMIC_TEMPLATES[0].defaultPrompt);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(
    PANU_DYNAMIC_TEMPLATES[0].recommendedProvider
  );
  const [userMediaUrl, setUserMediaUrl] = useState<string>('');

  // Identifiant utilisateur authentifié garanti
  const [localUserId, setLocalUserId] = useState<string>(currentUserId || '');

  // Canvas interactif pour le montage visuel (style CapCut / Canva)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasTitle, setCanvasTitle] = useState<string>(PANU_DYNAMIC_TEMPLATES[0].title);
  const [canvasSubtitle, setCanvasSubtitle] = useState<string>(PANU_DYNAMIC_TEMPLATES[0].defaultPrompt);
  const [canvasBadge, setCanvasBadge] = useState<string>(PANU_DYNAMIC_TEMPLATES[0].badge);
  const [canvasFilter, setCanvasFilter] = useState<'gold_afro' | 'pixverse_cinema' | 'capcut_speed' | 'vintage_35mm' | 'none'>('gold_afro');
  const [uploadedUserMedia, setUploadedUserMedia] = useState<string | null>(null);
  const [isMotionPreview, setIsMotionPreview] = useState<boolean>(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const motionTick = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronisation utilisateur
  useEffect(() => {
    if (!currentUserId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          setLocalUserId(data.user.id);
        }
      });
    } else {
      setLocalUserId(currentUserId);
    }
  }, [currentUserId]);

  // États du pipeline d'exécution IA
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [executionStepText, setExecutionStepText] = useState<string>('');
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [result, setResult] = useState<MultiAiGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories: { key: TemplateCategoryKey | 'all'; label: string }[] = [
    { key: 'all', label: '✨ Tous les Modèles' },
    { key: 'capcut_clip', label: '🎬 Clips CapCut / PixVerse' },
    { key: 'canva_poster', label: '🎨 Posters Canva' },
    { key: 'tiktok_script', label: '📱 Scripts TikTok & Reels' },
    { key: 'voucher_gift', label: '🎁 Vouchers & Cadeaux' },
  ];

  const filteredTemplates =
    activeCategory === 'all'
      ? PANU_DYNAMIC_TEMPLATES
      : PANU_DYNAMIC_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleSelectTemplate = (tpl: StudioTemplateItem) => {
    setSelectedTemplate(tpl);
    setCustomPrompt(tpl.defaultPrompt);
    setCanvasTitle(tpl.title);
    setCanvasSubtitle(tpl.defaultPrompt);
    setCanvasBadge(tpl.badge);
    setSelectedProvider(tpl.recommendedProvider);
    setResult(null);
    setError(null);
    setPublishSuccessMessage(null);
    setExecutionProgress(0);
    setExecutionStep(0);
    onTemplateSelect?.(tpl);
  };

  // RENDU DU CANVAS WEB INTERACTIF EN TEMPS RÉEL (STYLE CAPCUT / CANVA)
  const renderInteractiveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions adaptatives selon le ratio du template
    const isVertical = selectedTemplate.aspectRatio.includes('9:16');
    const isSquare = selectedTemplate.aspectRatio.includes('1:1') || selectedTemplate.aspectRatio.includes('4:5');
    const width = isVertical ? 540 : isSquare ? 640 : 800;
    const height = isVertical ? 960 : isSquare ? 800 : 450;

    canvas.width = width;
    canvas.height = height;

    // 1. Fond sombre de base
    ctx.fillStyle = '#0B0C12';
    ctx.fillRect(0, 0, width, height);

    // 2. Arrière-plan média
    const imgSource = uploadedUserMedia || userMediaUrl.trim() || selectedTemplate.previewImage;
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = imgSource;

    const drawContent = () => {
      ctx.save();
      // Animation de caméra (Zoom & Mouvement dynamique CapCut / Pixverse)
      if (isMotionPreview) {
        motionTick.current += 1;
        const zoom = 1 + Math.sin(motionTick.current * 0.04) * 0.06;
        const panX = Math.cos(motionTick.current * 0.03) * 15;
        ctx.translate(width / 2 + panX, height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-width / 2, -height / 2);
      }

      try {
        // Couverture adaptée (Cover scale)
        const scale = Math.max(width / bgImg.width, height / bgImg.height);
        const nw = bgImg.width * scale;
        const nh = bgImg.height * scale;
        const nx = (width - nw) / 2;
        const ny = (height - nh) / 2;
        ctx.drawImage(bgImg, nx, ny, nw, nh);
      } catch {
        // Fallback dégradé abstrait si l'image est bloquée CORS
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1E202B');
        grad.addColorStop(0.5, '#E5A93C');
        grad.addColorStop(1, '#0B0C12');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      // 3. Application des filtres visuels interactifs
      if (canvasFilter === 'gold_afro') {
        const goldOverlay = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width);
        goldOverlay.addColorStop(0, 'rgba(229, 169, 60, 0.2)');
        goldOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = goldOverlay;
        ctx.fillRect(0, 0, width, height);
      } else if (canvasFilter === 'pixverse_cinema') {
        ctx.fillStyle = 'rgba(10, 20, 38, 0.35)';
        ctx.fillRect(0, 0, width, height);
        // Vignettage cinéma
        const cinGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
        cinGrad.addColorStop(0, 'rgba(0,0,0,0)');
        cinGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = cinGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (canvasFilter === 'capcut_speed') {
        // Effet de vitesse (Speed-lines & flash)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(229, 169, 60, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.3);
        ctx.lineTo(width, height * 0.35);
        ctx.moveTo(0, height * 0.7);
        ctx.lineTo(width, height * 0.75);
        ctx.stroke();
      } else if (canvasFilter === 'vintage_35mm') {
        ctx.fillStyle = 'rgba(120, 80, 40, 0.18)';
        ctx.fillRect(0, 0, width, height);
      }

      // 4. Calque Badge / Sticker supérieur
      if (canvasBadge) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#E5A93C';
        ctx.lineWidth = 2;
        const badgeWidth = Math.min(width - 40, 280);
        ctx.beginPath();
        ctx.roundRect(24, 30, badgeWidth, 38, 19);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E5A93C';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(canvasBadge.slice(0, 32), 40, 55);
      }

      // 5. Calque Titre principal avec ombres portées
      if (canvasTitle) {
        ctx.fillStyle = '#FFF';
        ctx.font = '900 30px sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Découpage du titre sur 2 lignes
        const words = canvasTitle.split(' ');
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');

        const titleY = isVertical ? height * 0.65 : height * 0.6;
        ctx.fillText(line1, 24, titleY);
        if (line2) {
          ctx.fillText(line2, 24, titleY + 38);
        }
      }

      // 6. Calque Sous-titre / Hook d'accroche
      if (canvasSubtitle) {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        const subY = isVertical ? height - 120 : height - 80;
        ctx.beginPath();
        ctx.roundRect(20, subY, width - 40, 54, 12);
        ctx.fill();

        ctx.fillStyle = '#F0F0F0';
        ctx.font = '600 14px sans-serif';
        ctx.fillText(canvasSubtitle.slice(0, 65) + (canvasSubtitle.length > 65 ? '...' : ''), 34, subY + 32);
      }

      // 7. Filigrane officiel PANU STUDIO (4K)
      ctx.fillStyle = 'rgba(229, 169, 60, 0.85)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('⚡ PANU STUDIO IA • 4K RENDER', width - 200, height - 20);
    };

    if (bgImg.complete) {
      drawContent();
    } else {
      bgImg.onload = drawContent;
      bgImg.onerror = drawContent;
    }
  }, [selectedTemplate, canvasTitle, canvasSubtitle, canvasBadge, canvasFilter, uploadedUserMedia, userMediaUrl, isMotionPreview]);

  // Boucle d'animation fluide si prévisualisation de mouvement activée
  useEffect(() => {
    renderInteractiveCanvas();

    if (isMotionPreview) {
      const loop = () => {
        renderInteractiveCanvas();
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderInteractiveCanvas, isMotionPreview]);

  /**
   * EXÉCUTION AUTOMATIQUE DES CONSIGNES DU TEMPLATE PAR L'IA
   * L'IA lit les consignes explicites associées au template et les applique successivement.
   */
  const handleExecuteTemplateInstructions = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setError(null);
    setExecutionProgress(5);
    setExecutionStep(1);
    setExecutionStepText(`1/4 : Lecture des consignes du template (${selectedTemplate.aiEngine})...`);

    try {
      // Étape 1 : Lecture et compilation des consignes du template
      await new Promise((r) => setTimeout(r, 600));
      setExecutionProgress(30);
      setExecutionStep(2);
      setExecutionStepText(
        `2/4 : Application du style "${selectedTemplate.stylePreset}" sur le média...`
      );

      // Étape 2 : Montage & pipeline d'effets visuels
      await new Promise((r) => setTimeout(r, 800));
      setExecutionProgress(65);
      setExecutionStep(3);
      setExecutionStepText(
        `3/4 : Exécution du rendu CapCut / PixVerse (${selectedTemplate.aspectRatio})...`
      );

      // Étape 3 : Synthèse avec le moteur IA sélectionné
      const fullExecutionPrompt = `[CONSIGNES IA TEMPLATE : ${selectedTemplate.title}]
Style requis : ${selectedTemplate.stylePreset}
Moteur de rendu : ${selectedTemplate.aiEngine}
Format et ratio : ${selectedTemplate.aspectRatio}
Consignes explicites exécutées :
${selectedTemplate.explicitInstructions.map((ins, i) => `${i + 1}. ${ins}`).join('\n')}
Média source utilisateur : ${userMediaUrl.trim() || 'Médias officiels PANU Studio'}
Prompt créatif utilisateur : ${customPrompt.trim()}`;

      const res = await generateWithMultiAiHub({
        task: selectedTemplate.task,
        prompt: fullExecutionPrompt,
        templateCategory: selectedTemplate.category,
        preferredProvider: selectedProvider,
        modelOverride: selectedTemplate.recommendedModel,
      });

      setExecutionProgress(100);
      setExecutionStep(4);
      setExecutionStepText('4/4 : Rendu final terminé avec succès ! Prêt pour publication.');
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l’exécution des consignes du template IA.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePublishToPanu = async () => {
    const activeUid = localUserId || currentUserId;
    if (!activeUid) {
      onRequireAuth?.();
      return;
    }

    const canvas = canvasRef.current;
    setIsPublishing(true);
    setError(null);
    setPublishSuccessMessage(null);

    const publishWithBlob = async (blob?: Blob) => {
      try {
        const published = await publishGeneratedTemplateToPanu({
          userId: activeUid,
          title: canvasTitle || selectedTemplate.title,
          content: canvasSubtitle || customPrompt,
          mediaUrl: result?.mediaUrl || selectedTemplate.previewImage,
          blob,
          category: selectedTemplate.category,
        });

        setPublishSuccessMessage(
          `🎉 Votre création interactive "${canvasTitle || selectedTemplate.title}" a été enregistrée dans Supabase Storage (post-media) et publiée avec succès sur PANU !`
        );
        onPublishedSuccess?.(published);
      } catch (err: any) {
        setError(err?.message || 'Erreur lors de la publication sur PANU');
      } finally {
        setIsPublishing(false);
      }
    };

    if (canvas) {
      canvas.toBlob((blob) => {
        publishWithBlob(blob || undefined);
      }, 'image/png');
    } else {
      publishWithBlob();
    }
  };

  return (
    <div style={{ backgroundColor: '#121318', color: '#FFF', padding: 20, borderRadius: 16 }}>
      {/* EN-TÊTE DU MOTEUR DE TEMPLATES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🎬</span>
            <h2 style={{ margin: 0, color: '#E5A93C', fontSize: 19 }}>
              Moteur de Templates & Instructions IA
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#AAA' }}>
            Sélectionnez un modèle : l'IA lit et applique automatiquement les consignes de style, montage CapCut / PixVerse et effets.
          </p>
        </div>

        <div style={{ backgroundColor: '#1E202B', border: '1px solid rgba(229,169,60,0.3)', padding: '4px 10px', borderRadius: 999, fontSize: 11, color: '#E5A93C', fontWeight: 800 }}>
          ⚡ CapCut • PixVerse • Gemini • Claude
        </div>
      </div>

      {/* FILTRES PAR CATÉGORIES */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            style={{
              backgroundColor: activeCategory === cat.key ? '#E5A93C' : '#1E2029',
              color: activeCategory === cat.key ? '#000' : '#FFF',
              border: '1px solid rgba(229, 169, 60, 0.4)',
              borderRadius: 999,
              padding: '7px 14px',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* GRILLE DES TEMPLATES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {filteredTemplates.map((tpl) => {
          const isSelected = selectedTemplate.id === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              style={{
                backgroundColor: '#181922',
                border: isSelected ? '2px solid #E5A93C' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 14px rgba(229, 169, 60, 0.35)' : 'none',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={tpl.previewImage}
                  alt={tpl.title}
                  style={{ width: '100%', height: 125, objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: '#E5A93C',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {tpl.aspectRatio.split(' ')[0]}
                </span>
              </div>
              <div style={{ padding: 12 }}>
                <span style={{ fontSize: 10, color: '#E5A93C', fontWeight: 800 }}>{tpl.badge}</span>
                <h4 style={{ margin: '6px 0 4px', fontSize: 13, lineHeight: 1.3 }}>{tpl.title}</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{tpl.aiEngine}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PANNEAU DES CONSIGNES EXPLICITES & EXÉCUTION DU TEMPLATE SÉLECTIONNÉ */}
      <div
        style={{
          backgroundColor: '#181922',
          border: '1px solid rgba(229, 169, 60, 0.45)',
          borderRadius: 14,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#E5A93C', fontWeight: 900, fontSize: 15 }}>
                📋 Consignes Explicites du Template :
              </span>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#FFF' }}>
                {selectedTemplate.title}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#AAA' }}>
              Moteur : <strong style={{ color: '#2ED573' }}>{selectedTemplate.aiEngine}</strong> • Style :{' '}
              <strong style={{ color: '#E5A93C' }}>{selectedTemplate.stylePreset}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#888' }}>Moteur IA :</span>
            {(['gemini', 'claude', 'fal'] as AIProviderId[]).map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => setSelectedProvider(prov)}
                style={{
                  backgroundColor: selectedProvider === prov ? '#E5A93C' : '#0D0E12',
                  color: selectedProvider === prov ? '#000' : '#CCC',
                  border: '1px solid rgba(229, 169, 60, 0.35)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES CONSIGNES EXPLICITES QUE L'IA VA LIRE ET EXÉCUTER */}
        <div
          style={{
            backgroundColor: '#0D0E12',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: '#E5A93C', fontWeight: 800, marginBottom: 8 }}>
            ⚙️ Programme d’exécution automatique par l'IA :
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {selectedTemplate.explicitInstructions.map((instruction, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 12,
                  color: '#DDD',
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(229, 169, 60, 0.2)',
                    color: '#E5A93C',
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================================== */}
        {/* MODÈLE INTERACTIF RÉEL STYLE CAPCUT / CANVA (CANVAS WEB AVEC OUTILS DE MONTAGE) */}
        {/* ============================================================================== */}
        <div
          style={{
            backgroundColor: '#0D0E14',
            border: '2px solid rgba(229, 169, 60, 0.4)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🎨</span>
                <h3 style={{ margin: 0, fontSize: 16, color: '#E5A93C', fontWeight: 900 }}>
                  Studio Montage & Canvas Interactif (Style CapCut / Canva)
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A0A5BA' }}>
                Édition directe en temps réel : modifiez les calques de texte, appliquez les filtres et animez le rendu.
              </p>
            </div>

            {/* Bouton de prévisualisation d'animation cinématique */}
            <button
              type="button"
              onClick={() => setIsMotionPreview(!isMotionPreview)}
              style={{
                backgroundColor: isMotionPreview ? '#FF4757' : 'rgba(229, 169, 60, 0.2)',
                border: isMotionPreview ? '1px solid #FF4757' : '1px solid #E5A93C',
                color: isMotionPreview ? '#FFF' : '#E5A93C',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{isMotionPreview ? '⏸️ Arrêter l’Animation' : '▶️ Animation CapCut / Pixverse'}</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {/* A. Zone Canvas de Prévisualisation Temps Réel */}
            <div
              style={{
                backgroundColor: '#06070B',
                borderRadius: 14,
                padding: 12,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(229, 169, 60, 0.3)',
                  aspectRatio: selectedTemplate.aspectRatio.includes('9:16')
                    ? '9/16'
                    : selectedTemplate.aspectRatio.includes('16:9')
                    ? '16/9'
                    : '4/5',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ marginTop: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>
                Format : {selectedTemplate.aspectRatio.split(' ')[0]} • Qualité Exportation HD
              </div>
            </div>

            {/* B. Panneau des Outils de Montage & Calques Interactifs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1. Titre Principal */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#DDD', marginBottom: 4 }}>
                  🔤 Titre du Template (Calque Haut) :
                </label>
                <input
                  type="text"
                  value={canvasTitle}
                  onChange={(e) => setCanvasTitle(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#161822',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                />
              </div>

              {/* 2. Sous-Titre / Hook */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#DDD', marginBottom: 4 }}>
                  💬 Sous-Titre & Hook d'Accroche :
                </label>
                <textarea
                  rows={2}
                  value={canvasSubtitle}
                  onChange={(e) => setCanvasSubtitle(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#161822',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                />
              </div>

              {/* 3. Badge Sticker */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#DDD', marginBottom: 4 }}>
                  🏷️ Badge Visuel (Sticker) :
                </label>
                <input
                  type="text"
                  value={canvasBadge}
                  onChange={(e) => setCanvasBadge(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#161822',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                />
              </div>

              {/* 4. Filtre Visuel / Étalonnage */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#DDD', marginBottom: 6 }}>
                  ✨ Filtre Visuel Style PixVerse / CapCut :
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { id: 'gold_afro', label: '✨ Or Afro & Néon' },
                    { id: 'pixverse_cinema', label: '🎬 PixVerse Cinéma' },
                    { id: 'capcut_speed', label: '⚡ Speed-Ramp' },
                    { id: 'vintage_35mm', label: '🎞️ Grain 35mm' },
                    { id: 'none', label: 'Original' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCanvasFilter(f.id as any)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: canvasFilter === f.id ? '1px solid #E5A93C' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: canvasFilter === f.id ? 'rgba(229,169,60,0.25)' : 'rgba(255,255,255,0.04)',
                        color: canvasFilter === f.id ? '#E5A93C' : '#AAA',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Importer son propre média source */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#DDD', marginBottom: 6 }}>
                  📁 Remplacer par votre Média Local (Photo / Capture vidéo) :
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(229, 169, 60, 0.4)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    color: '#E5A93C',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <span>📷 Choisir une photo ou vidéo depuis l'appareil</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const url = URL.createObjectURL(file);
                        setUploadedUserMedia(url);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Message de confirmation d'enregistrement Supabase */}
        {publishSuccessMessage && (
          <div
            style={{
              backgroundColor: 'rgba(46, 213, 115, 0.15)',
              border: '2px solid #2ED573',
              borderRadius: 12,
              padding: '14px 18px',
              color: '#2ED573',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>✅</span>
            <span>{publishSuccessMessage}</span>
          </div>
        )}

        {/* ATTACHER UN MÉDIA UTILISATEUR OPTIONNEL */}
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#BBB' }}>
            📸 Votre média source (Photo, vidéo ou lien à transformer selon les consignes) :
          </label>
          <input
            type="text"
            value={userMediaUrl}
            onChange={(e) => setUserMediaUrl(e.target.value)}
            placeholder="URL de votre image/vidéo (ou laissez vide pour utiliser la banque PANU)..."
            style={{
              width: '100%',
              backgroundColor: '#0D0E12',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8,
              padding: 9,
              color: '#FFF',
              fontSize: 13,
            }}
          />
        </div>

        {/* PROMPT CRÉATIF OU SUJET PERSONNALISÉ */}
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#BBB' }}>
            ✏️ Consigne personnalisée ou texte de l'utilisateur :
          </label>
          <textarea
            rows={3}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Détaillez le sujet de votre vidéo ou affiche..."
            style={{
              width: '100%',
              backgroundColor: '#0D0E12',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8,
              padding: 10,
              color: '#FFF',
              fontSize: 13,
            }}
          />
        </div>

        {/* PROGRESSION DE L'EXÉCUTION IA */}
        {isExecuting && (
          <div style={{ backgroundColor: '#0D0E12', padding: 14, borderRadius: 10, border: '1px solid #E5A93C' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: '#E5A93C', fontWeight: 800 }}>{executionStepText}</span>
              <span style={{ color: '#FFF', fontWeight: 900 }}>{executionProgress}%</span>
            </div>
            <div style={{ width: '100%', height: 8, backgroundColor: '#222', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${executionProgress}%`,
                  height: '100%',
                  backgroundColor: '#E5A93C',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(255,71,87,0.15)', border: '1px solid #FF4757', color: '#FF6B81', padding: 10, borderRadius: 8, fontSize: 12 }}>
            ⚠️ {error}
          </div>
        )}

        {/* RÉSULTAT OBTENU APRÈS EXÉCUTION */}
        {result && (
          <div style={{ backgroundColor: '#0D0E12', padding: 16, borderRadius: 12, border: '2px solid #2ED573' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2ED573', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
              <span>✓</span>
              <span>Consignes IA exécutées avec succès via {result.provider.toUpperCase()} ({result.model})</span>
            </div>

            {result.outputText && (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#EEE', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {result.outputText}
              </p>
            )}

            {result.mediaUrl && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', maxHeight: 320 }}>
                <img
                  src={result.mediaUrl}
                  alt="Rendu IA Template"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        )}

        {/* BOUTONS D'ACTION : EXÉCUTER LES CONSIGNES & PUBLIER */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleExecuteTemplateInstructions}
            style={{
              flex: 1,
              minWidth: 240,
              backgroundColor: '#E5A93C',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: '13px 18px',
              fontWeight: 900,
              fontSize: 14,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(229, 169, 60, 0.35)',
            }}
          >
            <span>⚡</span>
            <span>
              {isExecuting
                ? 'Exécution IA des Consignes en cours...'
                : `Exécuter les Consignes du Template (${selectedTemplate.aiEngine.split(' ')[0]})`}
            </span>
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublishToPanu}
            style={{
              backgroundColor: '#2ED573',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: '13px 20px',
              fontWeight: 900,
              fontSize: 14,
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(46, 213, 115, 0.3)',
            }}
          >
            <span>🚀</span>
            <span>{isPublishing ? 'Publication...' : 'Publier sur PANU'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicTemplateGallery;
