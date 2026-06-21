import { useState } from 'react';
import { themes, numbers } from './content';
import HomeScreen, { type Activity } from './components/HomeScreen';
import ListenAndTap from './components/ListenAndTap';
import BuildAPhrase from './components/BuildAPhrase';
import CountAndSay from './components/CountAndSay';

type Screen = 'home' | Activity;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [themeId, setThemeId] = useState(themes[0].id);
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const goHome = () => setScreen('home');

  return (
    <main className="app">
      {screen === 'home' && (
        <HomeScreen
          themes={themes}
          activeThemeId={theme.id}
          onSelectTheme={setThemeId}
          onPlay={setScreen}
        />
      )}
      {screen === 'listen' && <ListenAndTap items={theme.items} onExit={goHome} />}
      {screen === 'build' && (
        <BuildAPhrase
          items={theme.items}
          constructions={theme.constructions}
          onExit={goHome}
        />
      )}
      {screen === 'count' && (
        <CountAndSay nouns={theme.items} numbers={numbers.items} onExit={goHome} />
      )}
    </main>
  );
}
