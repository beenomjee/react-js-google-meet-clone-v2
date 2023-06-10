import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.scss'
import { BrowserRouter } from 'react-router-dom'
import { Provider as StoreProvider } from 'react-redux'
import { persistor, store } from './store'
import { PersistGate } from 'redux-persist/integration/react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { Loader } from './components'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreProvider store={store}>
      <PersistGate loading={<div className="loader"><Loader /></div>} persistor={persistor}>
        <App />
      </PersistGate>
    </StoreProvider>
    <ToastContainer
      position="bottom-left"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  </BrowserRouter>
)
