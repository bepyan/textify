import { customAlphabet } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HistoryItem = {
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

export function categorizeHistory(historyList: HistoryItem[]) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

  const today: HistoryItem[] = [];
  const last7Days: HistoryItem[] = [];
  const older: HistoryItem[] = [];

  const sortedList = [...historyList].sort((a, b) => {
    return parseInt(b.createdAt) - parseInt(a.createdAt);
  });

  sortedList.forEach((item) => {
    const createdAt = parseInt(item.createdAt);

    if (createdAt >= todayStart) {
      today.push(item);
    } else if (createdAt >= sevenDaysAgo) {
      last7Days.push(item);
    } else {
      older.push(item);
    }
  });

  return { today, last7Days, older };
}
