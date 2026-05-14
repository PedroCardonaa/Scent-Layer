import { useApp } from '../context/AppContext.jsx';

export function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast ${toast.visible ? 'show' : ''}`} dangerouslySetInnerHTML={{ __html: toast.text }} />
  );
}
