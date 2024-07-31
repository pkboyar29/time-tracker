import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import TimerProvider from './context/TimerContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider store={store}>
      <TimerProvider>
        <App />
      </TimerProvider>
    </Provider>
  </BrowserRouter>
);
