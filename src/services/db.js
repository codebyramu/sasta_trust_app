import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing! Please check your .env file.");
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// --- OCCASIONS & MEDIA ---

/**
 * Get all occasions with their associated media
 */
export const getOccasions = async () => {
  try {
    if (!supabase) return [];
    
    // Fetch occasions
    const { data: occasions, error: occError } = await supabase
      .from('occasions')
      .select('*')
      .order('date', { ascending: false });

    if (occError) throw occError;

    // Fetch all media
    const { data: media, error: medError } = await supabase
      .from('media')
      .select('*');

    if (medError) throw medError;

    // Combine media into occasions
    return (occasions || []).map(o => {
      const associatedMedia = (media || [])
        .filter(m => Number(m.occasion_id) === Number(o.id))
        .map(m => m.url || m.youtube_link)
        .filter(Boolean); // Safety: Prevent null entries

      return {
        ...o,
        id: String(o.id), 
        title: o.name,     // FE expectation mapping
        content: o.description,
        media: associatedMedia,
        createdAt: o.created_at
      };
    });
  } catch (e) {
    console.error("Supabase fetch error:", e);
    return [];
  }
};

export const addOccasion = async (occasionData) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('occasions')
    .insert([{
      name: occasionData.name || occasionData.title,
      date: occasionData.date,
      category: occasionData.category,
      description: occasionData.description || occasionData.content
    }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, id: String(data.id), title: data.name, content: data.description, media: [], createdAt: data.created_at };
};

export const updateOccasion = async (id, updateData) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('occasions')
    .update({
      name: updateData.title || updateData.name,
      date: updateData.date,
      description: updateData.content || updateData.description,
      category: updateData.category
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Return updated full object
  const all = await getOccasions();
  return all.find(o => String(o.id) === String(id));
};

export const deleteOccasion = async (id) => {
  if (!supabase) return false;
  const { error } = await supabase.from('occasions').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// MEDIA HANDLING
export const addMediaToOccasion = async (occasionId, contentArray) => {
    if (!supabase) return null;
    
    // Ensure contentArray is an array (to handle legacy calls)
    const normalizedArray = Array.isArray(contentArray) ? contentArray : [contentArray];
    
    const inserts = normalizedArray.map(item => {
        const isYoutube = item.includes('youtube.com') || item.includes('youtu.be') || item.includes('facebook.com') || item.includes('fb.watch');
        return {
            occasion_id: occasionId,
            type: isYoutube ? 'video_link' : 'file',
            url: isYoutube ? null : item,
            youtube_link: isYoutube ? item : null
        };
    });

    const { error } = await supabase
        .from('media')
        .insert(inserts);
    
    if (error) throw error;
    
    // Return updated occasion for FE
    const all = await getOccasions();
    return all.find(o => String(o.id) === String(occasionId));
};

export const deleteMediaFromOccasion = async (occasionId, mediaUrl) => {
    if (!supabase) return null;
    const { error } = await supabase
        .from('media')
        .delete()
        .match({ occasion_id: occasionId, url: mediaUrl });
    
    if (error) throw error;
    
    // Return updated occasion for FE
    const all = await getOccasions();
    return all.find(o => String(o.id) === String(occasionId));
};

// --- RECEIPTS ---

/**
 * Standardize Receipt structure for Frontend:
 * {
 *   id, name, amount, details, contactType, contactValue, date, createdAt
 * }
 */
export const getReceipts = async () => {
    try {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data || []).map(r => ({
            id: String(r.id),
            name: r.donor_name,
            amount: r.amount,
            details: r.purpose,
            contactType: r.via,
            contactValue: r.contact, 
            date: r.date,
            createdAt: r.created_at
        }));
    } catch (e) {
        console.error("Supabase getReceipts error:", e);
        return [];
    }
};

export const addReceipt = async (receiptData) => {
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('receipts')
        .insert([{
            donor_name: receiptData.name,
            amount: receiptData.amount,
            purpose: receiptData.details,
            via: receiptData.contactType,
            contact: receiptData.contactValue,
            date: receiptData.date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

    if (error) throw error;
    
    return { 
        id: String(data.id), 
        name: data.donor_name, 
        amount: data.amount,
        details: data.purpose,
        contactType: data.via,
        contactValue: data.contact,
        date: data.date,
        createdAt: data.created_at
    };
};

// STORAGE
export const uploadMedia = async (file) => {
  if (!supabase) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('media')
    .upload(`uploads/${fileName}`, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(`uploads/${fileName}`);

  return publicUrl;
};
