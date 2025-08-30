import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { store } from './redux/store';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import TimerProvider from './hooks/useTimer';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TimerProvider>
          <App />
        </TimerProvider>
      </Provider>
    </QueryClientProvider>
  </BrowserRouter>
);
