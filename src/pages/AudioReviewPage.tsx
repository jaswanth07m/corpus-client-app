import React from 'react';
import { useTranslation } from 'react-i18next';
import ReviewPageBase from '@/components/ReviewPageBase';

const AudioReviewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ReviewPageBase
      title={t('tools.audioTool', 'Audio Tool')}
      description={t(
        'tools.audioToolDescription',
        'Review and annotate audio recordings.',
      )}
      mediaTypes={['audio']}
    />
  );
};

export default AudioReviewPage;
