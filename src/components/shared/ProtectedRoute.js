import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const ProtectedRoute = ({ user, allowedTypes, children, redirectTo = ROUTES.LOGIN }) => {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  if (allowedTypes && !allowedTypes.includes(user.tipo)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

export default ProtectedRoute;
