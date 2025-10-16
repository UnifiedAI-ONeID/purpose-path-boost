import { useNavigate } from 'react-router-dom';
import { createNavAPI } from './controller';

export function useNav() {
  const navigate = useNavigate();
  return createNavAPI(
    (u) => navigate(u), 
    (u) => navigate(u, { replace: true })
  );
}
