import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './helpers/i18n';
import { store } from './redux/store';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import AudioPlayerProvider from './hooks/useAudioPlayer';
import TimerProvider from './hooks/useTimer';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AudioPlayerProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </AudioPlayerProvider>
      </Provider>
    </QueryClientProvider>
  </BrowserRouter>
);
