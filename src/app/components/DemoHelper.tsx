import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function DemoHelper() {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50 hidden md:block">
      <Alert className="bg-blue-50 border-4 border-blue-400 shadow-2xl">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">Demo Mode</AlertTitle>
        <AlertDescription className="text-sm text-blue-700">
          <p className="mb-2">Use these keys for different roles:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>No key</strong> = Parent access</li>
            <li>• <strong>TEACHER123</strong> = Teacher</li>
            <li>• <strong>ADMIN123</strong> = Admin</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
