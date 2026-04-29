import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import backgroundImg from '../../artassets/background.webp';

export default function RouteErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Unexpected Application Error';
  const message =
    isRouteErrorResponse(error)
      ? error.data?.message || 'A route error occurred.'
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-white/95 border-4 border-red-400 rounded-3xl shadow-xl p-8 max-w-xl w-full text-center">
        <AlertTriangle className="w-14 h-14 mx-auto text-red-600 mb-3" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">{title}</h1>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
