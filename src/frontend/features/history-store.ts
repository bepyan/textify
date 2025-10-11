import { customAlphabet } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type HistoryItem = {
  id: string;
  url: string;
  createdAt: string;
};

const nanoid = customAlphabet('1234567890abcdef', 8);

export const useHistoryStore = create<{
  list: HistoryItem[];
  add: (url: string) => void;
  remove: (url: string) => void;
  clear: () => void;
}>()(
  persist(
    (set, get) => ({
      list: [],
      add: (url: string) => {
        const urlSet = new Set(get().list.map((item) => item.url));
        if (urlSet.has(url)) {
          return;
        }

        set((state) => ({
          list: [
            ...state.list,
            {
              id: nanoid(),
              url,
              createdAt: new Date().getTime().toString(),
            },
          ],
        }));
      },
      remove: (url: string) => {
        set((state) => ({
          list: state.list.filter((item) => item.url !== url),
        }));
      },
      clear: () => set({ list: [] }),
    }),
    {
      name: 'textify-history',
    },
  ),
);
