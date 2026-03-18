import { useNavigate } from 'react-router-dom';
import MediaTypeWheel from '@/components/MediaTypeWheel';

const Index = () => {
  const navigate = useNavigate();

  const handleMediaTypeSelect = (
    type: 'text' | 'audio' | 'video' | 'image' | 'document',
  ) => {
    navigate(`/upload/${type}`);
  };

  return (
    <MediaTypeWheel onSelect={handleMediaTypeSelect} selectedType={null} />
  );
};

export default Index;
