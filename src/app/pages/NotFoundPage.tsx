import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Home, SearchX } from 'lucide-react';
import backgroundImg from '../../artassets/background.webp';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Card className="max-w-2xl w-full bg-white/95 border-8 border-amber-500 shadow-2xl">
        <div className="p-8 md:p-12 text-center space-y-6">
          <SearchX className="w-24 h-24 md:w-32 md:h-32 mx-auto text-amber-600" />
          
          <h1 
            className="text-5xl md:text-7xl font-bold text-green-800"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            404
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold text-gray-700">
            Oops! Page Not Found
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600">
            Looks like this safari path doesn't exist!
          </p>
          
          <div className="pt-6">
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="h-16 md:h-20 px-12 md:px-16 text-xl md:text-2xl bg-green-600 hover:bg-green-700 rounded-full shadow-xl"
            >
              <Home className="w-6 h-6 md:w-8 md:h-8 mr-3" />
              Go Back Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
