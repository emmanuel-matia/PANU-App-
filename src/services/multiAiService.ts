import { supabase } from '../lib/supabaseClient';
import { AIProviderId, AITaskType } from '../config/aiKeysConfig';

export interface MultiAiGenerationRequest {
  task: AITaskType;
  prompt: string;
  templateCategory?: 'canva_poster' | 'capcut_clip' | 'tiktok_script' | 'voucher_gift';
  preferredProvider?: AIProviderId;
  modelOverride?: string;
}

export interface MultiAiGenerationResult {
  provider: AIProviderId;
  model: string;
  outputText?: string;
  mediaUrl?: string;
  audioBase64?: string;
  operationName?: string;
}

/**
 * 1.2 SERVICE CLIENT MULTI-IA (`multiAiService.ts`)
 * Appelle la fonction Edge `multi-ai-hub` (Gemini, Claude, Fal.ai, Replicate)
 * et publie directement la création générée sur PANU (`public.posts` / `public.videos`).
 */
export async function generateWithMultiAiHub(
  request: MultiAiGenerationRequest
): Promise<MultiAiGenerationResult> {
  const { data, error } = await supabase.functions.invoke('multi-ai-hub', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Échec de la génération via le Hub Multi-IA');
  }

  return data as MultiAiGenerationResult;
}

/**
 * Publie en un clic le contenu généré depuis un Template dans le flux PANU
 * Téléversement direct dans le bucket Supabase Storage : post-media
 */
export async function publishGeneratedTemplateToPanu(params: {
  userId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  blob?: Blob;
  category: 'canva_poster' | 'capcut_clip' | 'tiktok_script' | 'voucher_gift';
}) {
  let finalMediaUrl = params.mediaUrl || null;

  // Téléversement direct dans le bucket Supabase Storage : post-media
  if (params.blob) {
    try {
      const isVideo = params.category === 'capcut_clip';
      const fileExt = isVideo ? 'mp4' : 'png';
      const fileName = `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, params.blob, {
          contentType: isVideo ? 'video/mp4' : 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);
        finalMediaUrl = publicUrlData.publicUrl;
      } else {
        console.warn('Notice upload bucket post-media:', uploadError.message);
      }
    } catch (uploadErr) {
      console.warn('Erreur stockage media Supabase:', uploadErr);
    }
  }

  const mediaType = params.category === 'capcut_clip' ? 'video' : 'image';

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: params.userId,
      title: params.title,
      content: params.content,
      media_url: finalMediaUrl,
      media_type: mediaType,
      status: 'published',
      visibility: 'public',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
