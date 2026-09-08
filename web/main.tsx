import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import {initTheme} from '../app/theme';
import '../app/globals.css';
import '../app/simbio.css';
initTheme();
createRoot(document.getElementById('root')!).render(<Home/>);
