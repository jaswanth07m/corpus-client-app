import React from 'react';
import { useTranslation } from 'react-i18next';
import ReviewPageBase from '@/components/ReviewPageBase';

const VideoReviewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ReviewPageBase
      title={t('tools.videoTool', 'Video Tool')}
      description={t(
        'tools.videoToolDescription',
        'Review and annotate video content.',
      )}
      mediaTypes={['video']}
    />
  );
};

export default VideoReviewPage;
