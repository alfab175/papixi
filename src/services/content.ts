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
  } catch {
    return { success: false, error: 'Yükleme hatası' };
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
  } catch {
    return { success: false, error: 'Yükleme hatası' };
  }
};

export const publishMovie = (id: string) => dbUpdateMovie(id, { status: 'published' });
export const publishCartoon = (id: string) => dbUpdateCartoon(id, { status: 'published' });
export const unpublishMovie = (id: string) => dbUpdateMovie(id, { status: 'draft' });
export const unpublishCartoon = (id: string) => dbUpdateCartoon(id, { status: 'draft' });
export const removeMovie = (id: string) => dbDeleteMovie(id);
export const removeCartoon = (id: string) => dbDeleteCartoon(id);
export const getPublishedMovies = (): DBMovie[] => dbGetPublishedMovies();
export const getPublishedCartoons = (): DBCartoon[] => dbGetPublishedCartoons();
