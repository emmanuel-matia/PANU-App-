import React from 'react';
import PanuAppRouter from './router';

/**
 * Point d'entrée principal de l'application PANU (React / Next.js / Supabase / LiveKit Cloud / Studio Fal.ai & Claude)
 * Compte Administrateur / Fondateur par défaut : emmanuelmatia150@gmail.com
 */
export const App: React.FC = () => {
  return <PanuAppRouter />;
};

export default App;
