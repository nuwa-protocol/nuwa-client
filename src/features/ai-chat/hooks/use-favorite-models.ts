import { ModelStateStore } from '../stores/model-store';
import type { Model } from '../types';

export function useFavoriteModels() {
  const favoriteModels = ModelStateStore((state) => state.favoriteModels);
  const addToFavorites = ModelStateStore((state) => state.addToFavorites);
  const removeFromFavorites = ModelStateStore(
    (state) => state.removeFromFavorites,
  );
  const isFavorite = (modelId: string) => {
    return favoriteModels.some((model) => model.name === modelId);
  };

  const toggleFavorite = (model: Model) => {
    if (isFavorite(model.name)) {
      removeFromFavorites(model.name);
    } else {
      addToFavorites(model);
    }
  };

  return {
    favoriteModels,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
  };
}
