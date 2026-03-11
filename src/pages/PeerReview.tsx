import React from 'react';
import { useTranslation } from 'react-i18next';
import ReviewPageBase from '@/components/ReviewPageBase';

const PeerReview: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ReviewPageBase
      title={t('common.peerReview')}
      description={t('common.reviewCommunityContributions')}
      mediaTypes={['audio', 'video', 'image']}
    />
  );
};

export default PeerReview;
