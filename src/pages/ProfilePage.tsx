import React, { useState, useEffect } from 'react';
import { supabase, FOUNDER_EMAIL } from '../lib/supabaseClient';
import { MediaUploadDialog } from '../components/media/MediaUploadDialog';
import { SelectedMediaFile } from '../services/nativeMediaService';
import { PanuTopNavbar } from '../components/nav/PanuTopNavbar';

// Les 30 Catégories officielles PANU
export const ALL_PANU_CATEGORIES = [
  'Blog personnel',
  'Créateur de contenu',
  'Entrepreneur & Business',
  'Comédie & Humour',
  'Musique & Artiste',
  'Peinture & Arts visuels',
  'Motivation & Développement personnel',
  'Séries & Films',
  'Danse & Chorégraphie',
  'Créateur de Reels & Shorts',
  'Mode & Style de vie',
  'Beauté & Soins personnels',
  'Cuisine & Gastronomie africaine',
  'Technologie & Innovation',
  'Éducation & Tutoriels',
  'Sport & Fitness',
  'Santé & Bien-être',
  'Voyages & Découvertes',
  'Automobile & Engins',
  'Jeux vidéo & Gaming',
  'Actualités & Média',
  'Politique & Débats',
  'Foi, Religion & Spiritualité',
  'Immobilier & Architecture',
  'Finances personnelles & Crypto',
  'Coiffure & Esthétique',
  'Photographie & Vidéaste',
  'Culture & Traditions',
  'Événementiel & Organisation',
  'Agro-business & Agriculture',
];

/**
 * Page de Profil & Compte PANU
 * 1. Sélecteur de Catégories : choix garanti de 1 à 4 catégories sur les 30 officielles.
 * 2. Solde privé et conversion en monnaie locale (CDF / USD).
 * 3. Sécurité RLS et RBAC :
 *    - Utilisateurs : paramètres de compte personnels uniquement, paramètres globaux masqués.
 *    - Administrateurs : modération des contenus uniquement, SANS accès financier.
 *    - Fondateur (emmanuelmatia150@gmail.com) : vision globale des finances et base de données.
 */
export const ProfilePage: React.FC = () => {
  const [userId, setUserId] = useState<string>('user_master');
  const [email, setEmail] = useState<string>(FOUNDER_EMAIL);
  const [fullName, setFullName] = useState<string>('Créateur PANU');
  const [username, setUsername] = useState<string>('createur_panu');
  const [bio, setBio] = useState<string>('Créateur officiel sur la Plateforme Numérique Africaine (PANU).');
  const [accountType, setAccountType] = useState<'creator' | 'business'>('creator');
  const [userRole, setUserRole] = useState<'founder' | 'admin' | 'creator' | 'user'>('user');

  // Liens sociaux externes
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  // Sélecteur des 4 catégories maximum
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Créateur de contenu',
    'Créateur de Reels & Shorts',
  ]);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  // Portefeuille privé de l'utilisateur (Gains et jetons cadeaux)
  const [privateTokensBalance, setPrivateTokensBalance] = useState<number>(1450);
  const [privateCurrency, setPrivateCurrency] = useState<'CDF' | 'USD'>('CDF');

  // Parrainage
  const referralCode = `PANU-REF-${username.toUpperCase().slice(0, 6)}`;
  const referralLink = `https://panu.app/join?ref=${referralCode}`;

  // Avatars et couverture
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );
  const [coverUrl, setCoverUrl] = useState<string>(
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  );

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    targetType: 'avatar' | 'cover' | 'logo' | 'video';
    title: string;
    subtitle: string;
  }>({
    isOpen: false,
    targetType: 'avatar',
    title: 'Changer la photo',
    subtitle: '',
  });

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isFounder = email.trim().toLowerCase() === FOUNDER_EMAIL.toLowerCase();
  const isAdmin = userRole === 'admin' || isFounder;

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const userEmail = session.user.email || FOUNDER_EMAIL;
        setEmail(userEmail);

        if (userEmail.toLowerCase() === FOUNDER_EMAIL.toLowerCase()) {
          setUserRole('founder');
        } else {
          setUserRole((session.user.user_metadata?.role as any) || 'creator');
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.username) setUsername(profile.username);
          if (profile.bio) setBio(profile.bio);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
          if (profile.cover_url) setCoverUrl(profile.cover_url);
          if (profile.account_type) setAccountType(profile.account_type);
          if (profile.currency) setPrivateCurrency(profile.currency);
        }

        // Chargement du solde du portefeuille
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (wallet) {
          setPrivateTokensBalance(wallet.tokens_balance || 0);
          if (wallet.currency) setPrivateCurrency(wallet.currency);
        }
      }
    };
    loadProfile();
  }, []);

  // Gestion du sélecteur de catégories (Maximum 4)
  const toggleCategory = (cat: string) => {
    setCategoryWarning(null);
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length <= 1) {
        setCategoryWarning('Vous devez conserver au moins 1 catégorie pour identifier votre contenu.');
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      if (selectedCategories.length >= 4) {
        setCategoryWarning('⚠️ Limite atteinte : Vous ne pouvez sélectionner que 4 catégories au maximum.');
        return;
      }
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSaveProfile = async () => {
    setStatusMsg('Sauvegarde du profil en cours...');
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      username: username,
      bio: bio,
      account_type: accountType,
      category: selectedCategories.join(', '),
      currency: privateCurrency,
    });

    if (error) {
      setStatusMsg(`Erreur : ${error.message}`);
    } else {
      setStatusMsg('✅ Profil et catégories mis à jour avec succès !');
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const openPicker = (target: 'avatar' | 'cover') => {
    setDialogState({
      isOpen: true,
      targetType: target,
      title: target === 'avatar' ? 'Changer la photo de profil' : 'Changer la bannière',
      subtitle: 'Sélectionnez une image depuis votre galerie',
    });
  };

  const handleMediaReady = (media: SelectedMediaFile) => {
    if (dialogState.targetType === 'avatar') {
      setAvatarUrl(media.previewUrl);
    } else if (dialogState.targetType === 'cover') {
      setCoverUrl(media.previewUrl);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    setStatusMsg('Image sélectionnée. N’oubliez pas de sauvegarder votre profil.');
  };

  // Calcul du solde converti en monnaie locale (CDF / USD)
  // 1 token = 28.50 CDF (ou 0.0100 USD)
  const cdfRate = 28.5;
  const usdRate = 0.01;
  const grossCdf = privateTokensBalance * cdfRate;
  const netCdf = Math.round(grossCdf * 0.8); // après 20% de commission
  const netUsd = (privateTokensBalance * usdRate * 0.8).toFixed(2);

  return (
    <div style={{ backgroundColor: '#0D0E12', color: '#FFF', minHeight: '100vh' }}>
      <PanuTopNavbar />
      <div style={{ padding: '16px 20px 80px', maxWidth: 720, margin: '0 auto' }}>
      {/* 1. COUVERTURE & AVATAR */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        <div
          onClick={() => openPicker('cover')}
          style={{
            height: 180,
            borderRadius: 16,
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(229, 169, 60, 0.3)',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', bottom: 8, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#E5A93C' }}>
            📷 Modifier la couverture
          </span>
        </div>

        {/* Avatar */}
        <div
          onClick={() => openPicker('avatar')}
          style={{
            position: 'absolute',
            bottom: -45,
            left: 20,
            width: 90,
            height: 90,
            borderRadius: '50%',
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '4px solid #0D0E12',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            cursor: 'pointer',
          }}
        >
          <span style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E5A93C', color: '#000', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
            ✎
          </span>
        </div>
      </div>

      {statusMsg && (
        <div style={{ backgroundColor: '#181922', border: '1px solid #E5A93C', color: '#E5A93C', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* 2. IDENTITÉ DU COMPTE */}
      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, color: '#FFF' }}>{fullName}</h1>
            {isFounder && (
              <span style={{ backgroundColor: 'rgba(46, 213, 115, 0.2)', border: '1px solid #2ED573', color: '#2ED573', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>
                FONDATEUR
              </span>
            )}
            {userRole === 'admin' && !isFounder && (
              <span style={{ backgroundColor: 'rgba(255, 71, 87, 0.2)', border: '1px solid #FF4757', color: '#FF4757', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>
                MODÉRATEUR
              </span>
            )}
          </div>
          <div style={{ color: '#E5A93C', fontSize: 13, fontWeight: 700 }}>@{username}</div>
          <div style={{ color: '#777', fontSize: 12 }}>{email}</div>
        </div>

        {/* Type de compte : Créateur ou Business */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setAccountType('creator')}
            style={{
              flex: 1,
              backgroundColor: accountType === 'creator' ? '#E5A93C' : '#181922',
              color: accountType === 'creator' ? '#000' : '#AAA',
              border: '1px solid rgba(229, 169, 60, 0.3)',
              padding: '10px 14px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🎨 Profil Créateur
          </button>
          <button
            type="button"
            onClick={() => setAccountType('business')}
            style={{
              flex: 1,
              backgroundColor: accountType === 'business' ? '#E5A93C' : '#181922',
              color: accountType === 'business' ? '#000' : '#AAA',
              border: '1px solid rgba(229, 169, 60, 0.3)',
              padding: '10px 14px',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🏢 Profil Business
          </button>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 3. PORTEFEUILLE PRIVÉ DE L'UTILISATEUR & CONVERSION MONNAIE LOCALE (CDF / USD)  */}
      {/* ============================================================================== */}
      <div
        style={{
          backgroundColor: '#15161F',
          borderRadius: 14,
          border: '1px solid rgba(229, 169, 60, 0.35)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: '#E5A93C', fontSize: 16 }}>💰 Mon Portefeuille Privé</h3>
            <span style={{ fontSize: 11, color: '#888' }}>Vos gains de cadeaux et récompenses directes</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setPrivateCurrency('CDF')}
              style={{
                backgroundColor: privateCurrency === 'CDF' ? '#E5A93C' : '#222',
                color: privateCurrency === 'CDF' ? '#000' : '#FFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              CDF (FC)
            </button>
            <button
              type="button"
              onClick={() => setPrivateCurrency('USD')}
              style={{
                backgroundColor: privateCurrency === 'USD' ? '#E5A93C' : '#222',
                color: privateCurrency === 'USD' ? '#000' : '#FFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Détail du solde privé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 10 }}>
          <div style={{ backgroundColor: '#0D0E12', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: '#888' }}>Solde de Jetons Cadeaux</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#E5A93C', marginTop: 4 }}>
              {privateTokensBalance.toLocaleString()} 🪙
            </div>
            <div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>Gagnés via lives et flux</div>
          </div>

          <div style={{ backgroundColor: '#0D0E12', padding: 12, borderRadius: 10, border: '1px solid rgba(46, 213, 115, 0.3)' }}>
            <div style={{ fontSize: 11, color: '#888' }}>Valeur Retirable Nette</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#2ED573', marginTop: 4 }}>
              {privateCurrency === 'CDF' ? `${netCdf.toLocaleString()} FC` : `$${netUsd} USD`}
            </div>
            <div style={{ fontSize: 10, color: '#2ED573', marginTop: 2 }}>Mobile Money & Virement</div>
          </div>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#777' }}>
          🔒 <strong>Sécurité RLS :</strong> Ce solde est strictement privé. Les administrateurs et autres utilisateurs n'y ont aucun accès.
        </p>
      </div>

      {/* ============================================================================== */}
      {/* 4. SÉLECTEUR DE CATÉGORIES (CHOIX DE 1 À 4 CATÉGORIES SUR LES 30)              */}
      {/* ============================================================================== */}
      <div
        style={{
          backgroundColor: '#15161F',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#FFF' }}>
            🏷️ Vos Catégories de Création
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: selectedCategories.length === 4 ? '#E5A93C' : '#2ED573',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '2px 10px',
              borderRadius: 999,
            }}
          >
            {selectedCategories.length} / 4 sélectionnées
          </span>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#AAA' }}>
          Sélectionnez jusqu'à <strong>4 catégories</strong> sur les 30 pour orienter l'algorithme des flux Pour vous et Tendances :
        </p>

        {categoryWarning && (
          <div style={{ backgroundColor: 'rgba(255, 71, 87, 0.15)', border: '1px solid #FF4757', color: '#FF6B81', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {categoryWarning}
          </div>
        )}

        {/* Grille des 30 catégories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
          {ALL_PANU_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  backgroundColor: isSelected ? 'rgba(229, 169, 60, 0.25)' : '#0D0E12',
                  border: isSelected ? '1px solid #E5A93C' : '1px solid rgba(255,255,255,0.15)',
                  color: isSelected ? '#E5A93C' : '#DDD',
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. FORMULAIRE DES PARAMÈTRES DU COMPTE */}
      <div
        style={{
          backgroundColor: '#15161F',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: 16,
          display: 'grid',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#FFF' }}>⚙️ Paramètres du Compte</h3>

        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Nom d'affichage :</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 10, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Nom d'utilisateur (@) :</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 10, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Biographie créateur :</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 10, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        {/* Liens Réseaux Sociaux */}
        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Lien TikTok officiel :</label>
          <input
            type="text"
            placeholder="https://tiktok.com/@votre_compte"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 8, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Chaîne YouTube :</label>
          <input
            type="text"
            placeholder="https://youtube.com/@votre_chaine"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 8, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Page Facebook :</label>
          <input
            type="text"
            placeholder="https://facebook.com/votre_page"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0D0E12', border: '1px solid #333', padding: 8, borderRadius: 8, color: '#FFF', marginTop: 4 }}
          />
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          style={{
            backgroundColor: '#E5A93C',
            color: '#000',
            fontWeight: 800,
            padding: 12,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            marginTop: 6,
            fontSize: 14,
          }}
        >
          Enregistrer les modifications
        </button>
      </div>

      {/* 6. PARRAINAGE (+50 CRÉDITS) */}
      <div style={{ backgroundColor: '#15161F', borderRadius: 14, border: '1px solid rgba(229, 169, 60, 0.3)', padding: 16 }}>
        <h3 style={{ margin: '0 0 6px', color: '#E5A93C', fontSize: 15 }}>🎁 Parrainage & Partage de lien</h3>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#AAA' }}>Partagez votre code pour obtenir +50 crédits lors de chaque nouvelle inscription :</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D0E12', padding: 10, borderRadius: 8 }}>
          <span style={{ fontWeight: 800, color: '#E5A93C' }}>{referralCode}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              alert(`Lien copié : ${referralLink}`);
            }}
            style={{ backgroundColor: '#E5A93C', color: '#000', border: 'none', padding: '6px 12px', borderRadius: 6, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
          >
            Copier
          </button>
        </div>
      </div>

      {/* Modale de sélection d'image */}
      <MediaUploadDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        subtitle={dialogState.subtitle}
        targetType={dialogState.targetType}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        onMediaReady={handleMediaReady}
      />
      </div>
    </div>
  );
};

export default ProfilePage;
