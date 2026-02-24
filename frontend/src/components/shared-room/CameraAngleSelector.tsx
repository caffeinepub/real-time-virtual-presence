import { Button } from '../ui/button';
import { Video, Users, Eye } from 'lucide-react';

interface CameraAngleSelectorProps {
  selectedAngle: 'stage' | 'side' | 'group';
  onAngleChange: (angle: 'stage' | 'side' | 'group') => void;
}

export default function CameraAngleSelector({ selectedAngle, onAngleChange }: CameraAngleSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedAngle === 'stage' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onAngleChange('stage')}
      >
        <Video className="w-4 h-4 mr-2" />
        Stage
      </Button>
      <Button
        variant={selectedAngle === 'side' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onAngleChange('side')}
      >
        <Eye className="w-4 h-4 mr-2" />
        Side
      </Button>
      <Button
        variant={selectedAngle === 'group' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onAngleChange('group')}
      >
        <Users className="w-4 h-4 mr-2" />
        Group
      </Button>
    </div>
  );
}
