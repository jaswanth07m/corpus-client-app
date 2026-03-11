import React from 'react';
import { useTranslation } from 'react-i18next';
import ReviewPageBase from '@/components/ReviewPageBase';

const ImageReviewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ReviewPageBase
      title={t('tools.imageAnnotation', 'Image Annotation')}
      description={t(
        'tools.imageAnnotationDescription',
        'Annotate objects, regions, and patterns in images.',
      )}
      mediaTypes={['image']}
    />
  );
};

export default ImageReviewPage;
