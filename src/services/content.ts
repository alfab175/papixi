import {
  dbAddMovie, dbAddCartoon, dbUpdateMovie, dbUpdateCartoon,
  dbDeleteMovie, dbDeleteCartoon, dbGetPublishedMovies, dbGetPublishedCartoons,
  fileToBase64, DBMovie, DBCartoon,
} from './localDB';

export type { DBMovie, DBCartoon };

export const uploadMovie = async (
  data: { title: string; description: string; genre: string[]; duration: number; type: 'movie' | 'series'; year: number },
  videoFile: File,
  posterFile: File
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const [videoUrl, posterUrl] = await Promise.all([
      fileToBase64(videoFile),
      fileToBase64(posterFile),
    ]);
    const movie = dbAddMovie({
      ...data, videoUrl, posterUrl,
      rating: 0, votes: 0, status: 'draft',
      ageRating: 'all', languages: ['Türkçe', 'İngilizce'], subtitles: ['Türkçe', 'İngilizce'],
    });
    return { success: true, id: movie.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme hatası';
    console.error('uploadMovie failed:', err);
    return { success: false, error: message };
  }
};

export const uploadCartoon = async (
  data: { title: string; description: string; category: string },
  coverFile: File,
  pageFiles: File[]
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const coverUrl = await fileToBase64(coverFile);
    const pages = await Promise.all(pageFiles.map(f => fileToBase64(f)));
    const cartoon = dbAddCartoon({
      ...data, coverUrl, pages,
      rating: 0, votes: 0, status: 'draft', ageRating: 'all',
    });
    return { success: true, id: cartoon.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yükleme hatası';
    console.error('uploadCartoon failed:', err);
    return { success: false, error: message };
  }
};

export const publishMovie = (id: string): boolean => {
  const result = dbUpdateMovie(id, { status: 'published' });
  if (!result) console.warn(`publishMovie: movie "${id}" not found`);
  return result !== null;
};
export const publishCartoon = (id: string): boolean => {
  const result = dbUpdateCartoon(id, { status: 'published' });
  if (!result) console.warn(`publishCartoon: cartoon "${id}" not found`);
  return result !== null;
};
export const unpublishMovie = (id: string): boolean => {
  const result = dbUpdateMovie(id, { status: 'draft' });
  if (!result) console.warn(`unpublishMovie: movie "${id}" not found`);
  return result !== null;
};
export const unpublishCartoon = (id: string): boolean => {
  const result = dbUpdateCartoon(id, { status: 'draft' });
  if (!result) console.warn(`unpublishCartoon: cartoon "${id}" not found`);
  return result !== null;
};
export const removeMovie = (id: string) => dbDeleteMovie(id);
export const removeCartoon = (id: string) => dbDeleteCartoon(id);
export const getPublishedMovies = (): DBMovie[] => dbGetPublishedMovies();
export const getPublishedCartoons = (): DBCartoon[] => dbGetPublishedCartoons();
