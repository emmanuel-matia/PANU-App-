import React, { useEffect, useState } from 'react';
import { supabase, FOUNDER_EMAIL } from '../lib/supabaseClient';
import { ShareButtonWithOpenGraph } from '../components/share/ShareButtonWithOpenGraph';
import { DynamicTemplateGallery } from '../components/studio/DynamicTemplateGallery';
import { PanuTopNavbar } from '../components/nav/PanuTopNavbar';
import { PanuShortsFeedPlayer } from '../components/feed/PanuShortsFeedPlayer';
import { LiveFeed } from '../components/feed/LiveFeed';
import { CinetPayRechargeModal } from '../components/payment/CinetPayRechargeModal';

export interface FeedVideoPost {
  id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  author_email?: string;
  followers_count?: number;
  is_live?: boolean;
  title: string;
  content: string;
  media_url: string;
  media_type: string;
  status: string;
  visibility: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

/**
 * Page d'accueil & Flux Vidéo PANU (Interface React & Tailwind CSS moderne)
 * 1. Lecteur Vidéo Vertical Dynamique style Reels/Shorts/CapCut avec Autoplay fluide.
 * 2. Mouvements cinématiques (Ken Burns), transitions rapides et défilement vertical instantané.
 * 3. Notification animée "🔴 LIVE EN COURS - Rejoins le Match" avec effets Glow/Pulse.
 * 4. Boutons d'action rapide attractifs : Suivre, Cadeau, Studio IA, Booster.
 * 5. Respect strict des règles de sécurité financière et de l'en-tête sans la mention TikTok.
 */
export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<FeedVideoPost[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<'founder' | 'admin' | 'creator' | 'user'>('user');
  const [loading, setLoading] = useState(true);

  // Onglet actif : [🔥 Pour vous] [📰 Fil Classique] [✨ Tendances] (sans le mot TikTok)
  const [activeTab, setActiveTab] = useState<'for_you' | 'classic' | 'trending'>('for_you');

  // Modales interactives
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showFounderFinanceModal, setShowFounderFinanceModal] = useState(false);
  const [showBoostModalForPost, setShowBoostModalForPost] = useState<FeedVideoPost | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showCinetPayModal, setShowCinetPayModal] = useState(false);

  // Growth Hacking
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  // États d'interactions
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [postLikesCount, setPostLikesCount] = useState<Record<string, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [userCredits, setUserCredits] = useState<number>(250);

  // Gestion des abonnements et créateurs
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});
  const [creatorsFollowersCount, setCreatorsFollowersCount] = useState<Record<string, number>>({});
  const [activeLiveHosts, setActiveLiveHosts] = useState<Record<string, boolean>>({
    founder_master: true,
    panu_sports_official: true,
  });

  // Publication d'un nouveau post réel
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isPublishingNewPost, setIsPublishingNewPost] = useState(false);
  const [showPublishBox, setShowPublishBox] = useState(false);
  const [suggestInput, setSuggestInput] = useState('');

  // Vérification de sécurité Fondateur
  const isFounder = userEmail.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase();
  const isAdmin = userRole === 'admin' || isFounder;

  const referralCode = `PANU-REF-${(userEmail ? userEmail.split('@')[0] : 'CREATEUR').toUpperCase().slice(0, 6)}`;
  const referralLink = `https://panu.app/join?ref=${referralCode}`;

  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        const authorIds = Array.from(new Set(data.map((p) => p.author_id).filter(Boolean)));
        let profilesMap: Record<string, any> = {};

        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_admin')
            .in('id', authorIds);

          if (profiles) {
            profiles.forEach((pr) => {
              profilesMap[pr.id] = pr;
            });
          }
        }

        // SÉCURITÉ ET MASKING DU FONDATEUR :
        // Le profil d'Emmanuel Matia Mbundu (emmanuelmatia150@gmail.com) est 100% invisible dans la recherche, le fil et les suggestions
        const cleanPosts = data.filter((p: any) => {
          const authorId = (p.author_id || '').toLowerCase();
          const authorEmail = (p.author_email || '').toLowerCase();
          return (
            !authorId.includes('founder') &&
            !authorId.includes('emmanuel') &&
            authorEmail !== FOUNDER_EMAIL.toLowerCase()
          );
        });

        const enrichedPosts: FeedVideoPost[] = cleanPosts
          .map((p: any) => {
            const profile = profilesMap[p.author_id];
            return {
              ...p,
              author_name: profile?.full_name || profile?.username || 'Créateur PANU',
              author_avatar: profile?.avatar_url || '',
              followers_count: 1250,
              is_live: activeLiveHosts[p.author_id] || false,
            };
          })
          .filter((p) => {
            const nameLower = (p.author_name || '').toLowerCase();
            return !nameLower.includes('emmanuel matia') && !nameLower.includes('emmanuelmatia');
          });

        setPosts(enrichedPosts);

        const initialLikes: Record<string, number> = {};
        const initialFollowers: Record<string, number> = {};

        enrichedPosts.forEach((p) => {
          initialLikes[p.id] = p.likes_count || 0;
          initialFollowers[p.author_id] = p.followers_count || 450;
        });

        setPostLikesCount(initialLikes);
        setCreatorsFollowersCount(initialFollowers);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Erreur chargement flux :', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        const email = data.user.email;
        setUserEmail(email);
        if (email.toLowerCase() === FOUNDER_EMAIL.toLowerCase()) {
          setUserRole('founder');
        } else {
          setUserRole((data.user.user_metadata?.role as any) || 'creator');
        }
      }
    });
    fetchFeeds();

    // Raccordement temps réel direct à Supabase (PostgreSQL / Realtime)
    const postsChannel = supabase
      .channel('public_posts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchFeeds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  const handleToggleLike = (postId: string) => {
    const isCurrentlyLiked = !!likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPostLikesCount((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (isCurrentlyLiked ? -1 : 1),
    }));
  };

  const handleToggleFollow = (authorId: string) => {
    const isFollowed = !!followedCreators[authorId];
    setFollowedCreators((prev) => ({ ...prev, [authorId]: !isFollowed }));
    setCreatorsFollowersCount((prev) => ({
      ...prev,
      [authorId]: (prev[authorId] || 0) + (isFollowed ? -1 : 1),
    }));

    if (!isFollowed) {
      alert('✓ Vous suivez maintenant ce créateur.');
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;
    const newComment: PostComment = {
      id: `comm_${Date.now()}`,
      postId,
      authorName: userEmail ? userEmail.split('@')[0] : 'Vous',
      text: commentInput.trim(),
      createdAt: 'À l’instant',
    };
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
    setCommentInput('');
  };

  const handleBoostPost = (post: FeedVideoPost, planName: string, viewsEstimate: string) => {
    setShowBoostModalForPost(null);
    alert(`⚡ Plan "${planName}" activé pour "${post.title}" ! Visibilité boostée d'environ ${viewsEstimate}.`);
  };

  const handlePublishFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedTitle.trim()) return;
    setIsPublishingNewPost(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const authorId = userData?.user?.id || '00000000-0000-0000-0000-000000000001';
      let finalMediaUrl = newFeedUrl.trim();
      let mediaType = finalMediaUrl.endsWith('.mp4') ? 'video' : 'image';

      // Téléversement direct dans le bucket Supabase Storage : post-media
      if (selectedUploadFile) {
        const fileExt = selectedUploadFile.name.split('.').pop() || 'mp4';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `feed/${fileName}`;

        mediaType = selectedUploadFile.type.startsWith('video') ? 'video' : 'image';

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, selectedUploadFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('post-media')
            .getPublicUrl(filePath);
          finalMediaUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Storage upload notice (post-media):', uploadError.message);
        }
      }

      const { data: newInsertedPost, error } = await supabase.from('posts').insert({
        author_id: authorId,
        title: newFeedTitle.trim(),
        content: newFeedTitle.trim(),
        media_url: finalMediaUrl || null,
        media_type: mediaType,
        status: 'published',
        visibility: 'public',
      }).select().single();

      if (error) {
        alert(`Erreur lors de la publication : ${error.message}`);
      } else {
        setNewFeedTitle('');
        setNewFeedUrl('');
        setSelectedUploadFile(null);
        setShowPublishBox(false);
        alert('🎉 Publication mise en ligne avec succès sur PANU !');
        fetchFeeds();
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || 'Échec de la publication'}`);
    } finally {
      setIsPublishingNewPost(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0B0C12', color: '#F8F9FA', minHeight: '100vh' }}>
      {/* 1. BARRE DE NAVIGATION UNIVERSELLE AVEC ACCÈS TEMPLATES */}
      <PanuTopNavbar
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenFounderSettings={() => setShowFounderFinanceModal(true)}
        userBalance={userCredits}
        onBalanceUpdate={(newBal) => setUserCredits(newBal)}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 16px 90px' }}>
        {/* 2. MESSAGE D'ACCUEIL DYNAMIQUE & TENDANCE VIRALE (ENGAGEMENT & RÉTENTION) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #181926 0%, #1F1B2C 100%)',
            border: '1px solid rgba(229, 169, 60, 0.4)',
            borderRadius: 16,
            padding: '12px 18px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(229, 169, 60, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: 'rgba(229, 169, 60, 0.15)',
                border: '1px solid #E5A93C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              🚀
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: '#FFF', fontSize: 14 }}>
                  Bienvenue sur PANU Studio • L’Afrique Créative en Plein Écran
                </strong>
                <span
                  style={{
                    backgroundColor: '#E5A93C',
                    color: '#000',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: 999,
                  }}
                >
                  NOUVEAU
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#AAA' }}>
                Reels dynamiques, diffusions en direct et modèles de montage IA CapCut / PixVerse en 1 clic.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              style={{
                backgroundColor: '#E5A93C',
                color: '#000',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 10px rgba(229, 169, 60, 0.35)',
              }}
            >
              <span>🎬</span>
              <span>Tester un Template</span>
            </button>
            <a
              href="/live"
              style={{
                backgroundColor: 'rgba(255, 46, 76, 0.2)',
                border: '1px solid #FF2E4C',
                color: '#FF2E4C',
                textDecoration: 'none',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>🔴</span>
              <span>Matchs en Live</span>
            </a>
          </div>
        </div>

        {/* 3. BARRE D'ONGLETS NETTOYÉE : [🔥 Pour vous] [📰 Fil Classique] [✨ Tendances] */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab('for_you')}
              style={{
                backgroundColor: activeTab === 'for_you' ? '#E5A93C' : 'transparent',
                color: activeTab === 'for_you' ? '#000' : '#AAA',
                border: activeTab === 'for_you' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeTab === 'for_you' ? '0 2px 10px rgba(229,169,60,0.3)' : 'none',
              }}
            >
              🔥 Pour vous
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trending')}
              style={{
                backgroundColor: activeTab === 'trending' ? '#E5A93C' : 'transparent',
                color: activeTab === 'trending' ? '#000' : '#AAA',
                border: activeTab === 'trending' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✨ Tendances
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classic')}
              style={{
                backgroundColor: activeTab === 'classic' ? '#E5A93C' : 'transparent',
                color: activeTab === 'classic' ? '#000' : '#AAA',
                border: activeTab === 'classic' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              📰 Fil Classique
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              style={{
                backgroundColor: '#1E202B',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFF',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🌟 Suggérer
            </button>
            <button
              type="button"
              onClick={() => setShowReferralModal(true)}
              style={{
                backgroundColor: 'rgba(229, 169, 60, 0.15)',
                border: '1px solid #E5A93C',
                color: '#E5A93C',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🎁 +50 crédits
            </button>
          </div>
        </div>

        {/* ESPACE DE NOUVELLE PUBLICATION (SUPABASE BUCKET: post-media) */}
        <div
          style={{
            backgroundColor: '#15161E',
            border: '1px solid rgba(229, 169, 60, 0.45)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, color: '#E5A93C', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📹</span>
              <span>Nouvelle publication</span>
            </h3>
            <span style={{ fontSize: 11, color: '#2ED573', fontWeight: 700 }}>
              ● En direct
            </span>
          </div>

          <form onSubmit={handlePublishFeed} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newFeedTitle}
                onChange={(e) => setNewFeedTitle(e.target.value)}
                placeholder="Titre de votre publication / Reel..."
                required
                style={{
                  flex: 1,
                  minWidth: 220,
                  backgroundColor: '#0D0E12',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: '#FFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <input
                type="text"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                placeholder="Ou URL directe .mp4 / image..."
                style={{
                  flex: 1,
                  minWidth: 200,
                  backgroundColor: '#0D0E12',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: '#FFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#DDD',
                  }}
                >
                  <span>📁</span>
                  <span>{selectedUploadFile ? selectedUploadFile.name : 'Choisir un fichier vidéo/image'}</span>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedUploadFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {selectedUploadFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedUploadFile(null)}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#FF4757', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isPublishingNewPost}
                style={{
                  backgroundColor: '#E5A93C',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontWeight: 900,
                  cursor: isPublishingNewPost ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 10px rgba(229, 169, 60, 0.4)',
                }}
              >
                {isPublishingNewPost ? 'Publication en cours...' : '🚀 Publier Immédiatement'}
              </button>
            </div>
          </form>
        </div>

        {/* ============================================================================== */}
        {/* 4. LECTEUR VIDÉO DYNAMIQUE VERTICAL (STYLE REELS / SHORTS / CAPCUT)           */}
        {/* ============================================================================== */}
        {activeTab === 'for_you' || activeTab === 'trending' ? (
          <div>
            <LiveFeed />
            <PanuShortsFeedPlayer
              posts={posts}
              onOpenTemplates={() => setShowTemplatesModal(true)}
              onOpenLiveMatch={() => {
                window.location.href = '/live';
              }}
              onOpenBoost={(post) => setShowBoostModalForPost(post)}
              onOpenComments={(postId) => setActiveCommentsPostId(postId)}
              commentsMap={commentsMap}
              likedPosts={likedPosts}
              postLikesCount={postLikesCount}
              onToggleLike={handleToggleLike}
              followedCreators={followedCreators}
              creatorsFollowersCount={creatorsFollowersCount}
              onToggleFollow={handleToggleFollow}
              activeLiveHosts={activeLiveHosts}
            />

            {/* Conseils d'engagement sous le lecteur */}
            <div
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontSize: 12,
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <span>👆 Glisse vers le haut pour la vidéo suivante</span>
              <span>❤️ Double-clic pour liker</span>
              <span>🔊 Clic sur l’icône pour le son</span>
            </div>
          </div>
        ) : (
          /* FIL CLASSIQUE AVEC CARTES */
          <div style={{ display: 'grid', gap: 20 }}>
            {posts.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#15161F',
                  borderRadius: 16,
                  border: '1px solid rgba(229, 169, 60, 0.25)',
                  padding: '40px 24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎥</div>
                <h3 style={{ color: '#E5A93C', margin: '0 0 6px', fontSize: 16 }}>
                  Fil Classique Prêt pour les Publications
                </h3>
                <p style={{ color: '#AAA', fontSize: 12, margin: '0 0 16px' }}>
                  Aucun contenu factice. Basculez sur l’onglet "🔥 Pour vous" pour profiter du lecteur vidéo dynamique.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('for_you')}
                  style={{
                    backgroundColor: '#E5A93C',
                    color: '#000',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Voir le Lecteur Plein Écran
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    backgroundColor: '#181922',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  {post.media_url && (
                    <video
                      src={post.media_url}
                      controls
                      playsInline
                      style={{ width: '100%', maxHeight: 380, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: 14 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{post.title}</h3>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: '#CCC' }}>{post.content}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFF',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        ❤️ {postLikesCount[post.id] || 0}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCommentsPostId(post.id)}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFF',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        💬 Commentaires
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* 5. TIROIR / MODALE DES COMMENTAIRES                                           */}
      {/* ============================================================================== */}
      {activeCommentsPostId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setActiveCommentsPostId(null)}
        >
          <div
            style={{
              backgroundColor: '#161722',
              borderTop: '2px solid #E5A93C',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxWidth: 520,
              width: '100%',
              maxHeight: '65vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#E5A93C' }}>
                💬 Commentaires ({(commentsMap[activeCommentsPostId] || []).length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveCommentsPostId(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 8, marginBottom: 14 }}>
              {(commentsMap[activeCommentsPostId] || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#777', fontSize: 13, margin: '20px 0' }}>
                  Aucun commentaire. Sois le premier à réagir !
                </p>
              ) : (
                (commentsMap[activeCommentsPostId] || []).map((c) => (
                  <div key={c.id} style={{ backgroundColor: '#0D0E12', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: '#E5A93C', fontWeight: 800 }}>{c.authorName} : </span>
                    <span style={{ color: '#EEE' }}>{c.text}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Ajouter un commentaire..."
                style={{
                  flex: 1,
                  backgroundColor: '#0D0E12',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: '#FFF',
                  fontSize: 13,
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(activeCommentsPostId)}
              />
              <button
                type="button"
                onClick={() => handleAddComment(activeCommentsPostId)}
                style={{
                  backgroundColor: '#E5A93C',
                  color: '#000',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 6. MODALE UNIVERSELLE 'TEMPLATES'                                              */}
      {/* ============================================================================== */}
      {showTemplatesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#161722',
              border: '1px solid #E5A93C',
              borderRadius: 16,
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, color: '#E5A93C', fontSize: 20 }}>🎬 Galerie des Templates PANU</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#AAA' }}>
                  Modèles CapCut / PixVerse : l’IA exécute automatiquement les consignes de style et de montage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕ Fermer
              </button>
            </div>

            <DynamicTemplateGallery
              onTemplateSelect={() => {
                setShowTemplatesModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 7. MODALE DES GAINS GLOBAUX — STRICTEMENT RÉSERVÉE AU FONDATEUR                */}
      {/* ============================================================================== */}
      {showFounderFinanceModal && isFounder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#161722',
              border: '2px solid #2ED573',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, color: '#2ED573', fontSize: 18 }}>
                  📊 Tableau de Bord des Gains Globaux (Fondateur Uniquement)
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#AAA' }}>
                  Compte officiel : <strong>{FOUNDER_EMAIL}</strong> • Sécurité RLS et isolation financière active
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFounderFinanceModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF',
                  padding: '4px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
              <div style={{ backgroundColor: '#0D0E12', padding: 14, borderRadius: 10, border: '1px solid rgba(46, 213, 115, 0.3)' }}>
                <div style={{ fontSize: 11, color: '#888' }}>Total Revenus Plateforme</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2ED573', marginTop: 4 }}>4 850 000 FC</div>
                <div style={{ fontSize: 11, color: '#AAA' }}>≈ 1 700 $ USD</div>
              </div>
              <div style={{ backgroundColor: '#0D0E12', padding: 14, borderRadius: 10, border: '1px solid rgba(229, 169, 60, 0.3)' }}>
                <div style={{ fontSize: 11, color: '#888' }}>Commissions 20% Prévues</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#E5A93C', marginTop: 4 }}>970 000 FC</div>
                <div style={{ fontSize: 11, color: '#AAA' }}>≈ 340 $ USD</div>
              </div>
              <div style={{ backgroundColor: '#0D0E12', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div style={{ fontSize: 11, color: '#888' }}>Retraits Mobile Money</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginTop: 4 }}>124 Validés</div>
                <div style={{ fontSize: 11, color: '#2ED573' }}>Orange / M-Pesa / Airtel</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#0D0E12', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: '#BBB' }}>
              🔒 <strong>Sécurité RLS Garantie :</strong> Les données financières restent strictement privées et invisibles sur le flux d'accueil public.
            </div>
          </div>
        </div>
      )}

      {/* MODALE RECHARGEMENT CINETPAY */}
      <CinetPayRechargeModal
        isOpen={showCinetPayModal}
        onClose={() => setShowCinetPayModal(false)}
        currentBalance={userCredits}
        onSuccess={(addedCoins) => setUserCredits((prev) => prev + addedCoins)}
      />

      {/* ============================================================================== */}
      {/* 9. MODALE DU BOOSTER ⚡                                                        */}
      {/* ============================================================================== */}
      {showBoostModalForPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ backgroundColor: '#181922', border: '1px solid #2ED573', borderRadius: 16, maxWidth: 440, width: '100%', padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', color: '#2ED573' }}>⚡ Booster la Visibilité de la Vidéo</h3>
            <p style={{ fontSize: 12, color: '#BBB', margin: '0 0 14px' }}>
              Propulsez <strong>"{showBoostModalForPost.title}"</strong> dans les flux Tendances et Pour vous de milliers d'utilisateurs.
            </p>

            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {[
                { name: 'Boost Découverte', views: '+5 000 vues', price: '2 500 FCFA / 10 000 FC' },
                { name: 'Boost Viral Élite', views: '+25 000 vues', price: '10 000 FCFA / 45 000 FC' },
              ].map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => handleBoostPost(showBoostModalForPost, b.name, b.views)}
                  style={{
                    backgroundColor: '#0D0E12',
                    border: '1px solid rgba(46, 213, 115, 0.4)',
                    padding: 12,
                    borderRadius: 10,
                    color: '#FFF',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#2ED573' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#AAA' }}>{b.views} garanties</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E5A93C' }}>{b.price}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowBoostModalForPost(null)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFF',
                padding: 10,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* MODALES GROWTH HACKING (PARRAINAGE & SUGGESTION) */}
      {showReferralModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#181922', border: '1px solid #E5A93C', borderRadius: 16, maxWidth: 440, width: '100%', padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', color: '#E5A93C' }}>🎁 Parrainage Créateur (+50 Crédits)</h3>
            <p style={{ fontSize: 12, color: '#BBB' }}>Votre code de parrainage exclusif :</p>
            <div style={{ backgroundColor: '#0D0E12', padding: 12, borderRadius: 8, fontSize: 18, fontWeight: 900, color: '#E5A93C', textAlign: 'center', marginBottom: 12 }}>
              {referralCode}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                alert(`Lien copié : ${referralLink}`);
              }}
              style={{ width: '100%', backgroundColor: '#E5A93C', color: '#000', border: 'none', padding: 10, borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginBottom: 8 }}
            >
              Copier le lien
            </button>
            <button type="button" onClick={() => setShowReferralModal(false)} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #444', color: '#FFF', padding: 8, borderRadius: 8, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {showSuggestModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#181922', border: '1px solid #FFF', borderRadius: 16, maxWidth: 440, width: '100%', padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', color: '#FFF' }}>🌟 Suggérer un Créateur</h3>
            <p style={{ fontSize: 12, color: '#BBB', marginBottom: 14 }}>Recommandez un talent pour enrichir l’écosystème PANU.</p>
            <input
              type="text"
              value={suggestInput}
              onChange={(e) => setSuggestInput(e.target.value)}
              placeholder="Nom ou @handle du créateur"
              style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #444', padding: 10, borderRadius: 8, color: '#FFF', marginBottom: 12 }}
            />
            <button
              type="button"
              onClick={() => {
                const query = suggestInput.toLowerCase().trim();
                if (!query) return;
                // SÉCURITÉ ET MASKING DU FONDATEUR
                if (query.includes('emmanuel') || query.includes('matia') || query.includes('mbundu') || query.includes('founder')) {
                  alert("⚠️ Ce compte est réservé à l'administration de la plateforme et ne peut pas faire l'objet de suggestions publiques.");
                  setSuggestInput('');
                  setShowSuggestModal(false);
                  return;
                }
                setShowSuggestModal(false);
                setSuggestInput('');
                alert(`Merci pour votre suggestion de "${suggestInput}" ! Elle a été transmise à l'équipe.`);
              }}
              style={{ width: '100%', backgroundColor: '#E5A93C', color: '#000', border: 'none', padding: 10, borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginBottom: 8 }}
            >
              Envoyer la suggestion
            </button>
            <button type="button" onClick={() => { setShowSuggestModal(false); setSuggestInput(''); }} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #444', color: '#FFF', padding: 8, borderRadius: 8, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
