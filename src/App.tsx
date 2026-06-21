import { useState } from 'react';
import { theme, constructions } from './content';
import HomeScreen, { type Activity } from './components/HomeScreen';
import ListenAndTap from './components/ListenAndTap';
import BuildAPhrase from './components/BuildAPhrase';

type Screen = 'home' | Activity;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const goHome = () => setScreen('home');

  return (
    <main className="app">
      {screen === 'home' && <HomeScreen onPlay={setScreen} />}
      {screen === 'listen' && <ListenAndTap items={theme.items} onExit={goHome} />}
      {screen === 'build' && (
        <BuildAPhrase items={theme.items} constructions={constructions} onExit={goHome} />
      )}
    </main>
  );
}
