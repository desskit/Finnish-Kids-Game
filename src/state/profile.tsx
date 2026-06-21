import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Lightweight local profile (name + level + stars). No accounts, no server —
// persisted to localStorage so it works offline and is kid-safe.
// Multi-child profiles are a planned follow-up; v1 keeps a single editable one.

export interface ProfileData {
  name: string;
  /** 1 = easier (fewer choices), 2 = harder (more choices). */
  level: number;
  stars: number;
}

const DEFAULT: ProfileData = { name: '', level: 1, stars: 0 };
const STORAGE_KEY = 'fkg.profile.v1';

interface ProfileContextValue extends ProfileData {
  setName: (name: string) => void;
  setLevel: (level: number) => void;
  addStars: (n: number) => void;
  reset: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function load(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as Partial<ProfileData>) };
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return DEFAULT;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfileData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      ...data,
      setName: (name) => setData((d) => ({ ...d, name })),
      setLevel: (level) => setData((d) => ({ ...d, level })),
      addStars: (n) => setData((d) => ({ ...d, stars: d.stars + n })),
      reset: () => setData(DEFAULT),
    }),
    [data],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
