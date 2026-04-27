import { useEffect, useRef } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

export const useWelcomeTour = () => {
  const { t } = useTranslation();
  const driverObj = useRef<Driver | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: '#tour-upload-btn',
          popover: {
            title: t('tour.upload.title', 'Upload Files'),
            description: t(
              'tour.upload.description',
              'Click here to upload media files and start contributing.',
            ),
            side: 'top',
            align: 'center',
            onNextClick: () => {
              navigate('/upload');
              setTimeout(() => {
                driverObj.current?.moveNext();
              }, 500);
            },
          },
        },
        {
          element: '#tour-media-type-wheel',
          popover: {
            title: t('tour.media.title', 'Select Media Type'),
            description: t(
              'tour.media.description',
              'Choose the type of content you want to contribute.',
            ),
            side: 'bottom',
            align: 'center',
            onPrevClick: () => {
              navigate('/');
              setTimeout(() => {
                driverObj.current?.movePrevious();
              }, 500);
            },
            onNextClick: () => {
              navigate('/');
              setTimeout(() => {
                driverObj.current?.moveNext();
              }, 500);
            },
          },
        },
        {
          element: '#tour-stats-summary',
          popover: {
            title: t('tour.stats.title', 'Your Contributions'),
            description: t(
              'tour.stats.description',
              'Here you can see your points and overall contributions to the platform.',
            ),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-home-nav',
          popover: {
            title: t('tour.home.title', 'Home'),
            description: t(
              'tour.home.description',
              'Return to this dashboard at any time.',
            ),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-tools-nav',
          popover: {
            title: t('tour.tools.title', 'Tools'),
            description: t(
              'tour.tools.description',
              'Access annotation and proofreading tools.',
            ),
            side: 'top',
            align: 'center',
            onPrevClick: () => {
              navigate('/');
              setTimeout(() => {
                driverObj.current?.movePrevious();
              }, 500);
            },
            onNextClick: () => {
              navigate('/tools');
              setTimeout(() => {
                driverObj.current?.moveNext();
              }, 500);
            },
          },
        },
        {
          element: '#tour-peer-review-tool',
          popover: {
            title: t('tour.peerReviewTool.title', 'Peer Review'),
            description: t(
              'tour.peerReviewTool.description',
              'Global tool to review all types of community contributions.',
            ),
            side: 'bottom',
            align: 'center',
            onPrevClick: () => {
              navigate('/');
              setTimeout(() => {
                driverObj.current?.movePrevious();
              }, 500);
            },
          },
        },
        {
          element: '#tour-image-review-tool',
          popover: {
            title: t('tour.imageReview.title', 'Image Annotation'),
            description: t(
              'tour.imageReview.description',
              'Focused tool for annotating and reviewing image contributions.',
            ),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-audio-review-tool',
          popover: {
            title: t('tour.audioReview.title', 'Audio Tool'),
            description: t(
              'tour.audioReview.description',
              'Specialized tool for reviewing audio recordings.',
            ),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-video-review-tool',
          popover: {
            title: t('tour.videoReview.title', 'Video Tool'),
            description: t(
              'tour.videoReview.description',
              'Dedicated interface for video content review.',
            ),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-doc-digitization-tool',
          popover: {
            title: t('tour.docDigitization.title', 'Document Digitization'),
            description: t(
              'tour.docDigitization.description',
              'Help improve data quality by digitizing text contributions.',
            ),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-future-tools',
          popover: {
            title: t('tour.futureTools.title', 'Upcoming Features'),
            description: t(
              'tour.futureTools.description',
              'Stay tuned for Ask Your Corpus, Story Generator, Agent Workflows, and more!',
            ),
            side: 'top',
            align: 'center',
            onNextClick: () => {
              navigate('/profile');
              setTimeout(() => {
                driverObj.current?.moveNext();
              }, 500);
            },
          },
        },
        {
          element: '#tour-profile-nav',
          popover: {
            title: t('tour.profile.title', 'Profile'),
            description: t(
              'tour.profile.description',
              'View your stats and manage settings here.',
            ),
            side: 'top',
            align: 'center',
            onPrevClick: () => {
              navigate('/tools');
              setTimeout(() => {
                driverObj.current?.movePrevious();
              }, 500);
            },
          },
        },
        {
          element: '#tour-language-switcher',
          popover: {
            title: t('tour.language.title', 'Language'),
            description: t(
              'tour.language.description',
              'Change the application language here.',
            ),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-points-heatmap',
          popover: {
            title: t('tour.heatmap.title', 'Activity Heatmap'),
            description: t(
              'tour.heatmap.description',
              'Track your daily contributions and streaks over time.',
            ),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-contributions-dashboard',
          popover: {
            title: t('tour.dashboard.title', 'Contributions Dashboard'),
            description: t(
              'tour.dashboard.description',
              'View your contributions organized by media type.',
            ),
            side: 'top',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('welcomeTourCompleted', 'true');
        // Optionally redirect back to home when the tour finishes on a different page. Let's keep them where they finished or `/`
      },
    });

    // Automatically check for deferred tour starts when component mounts
    if (localStorage.getItem('startTourNextLoad') === 'true') {
      localStorage.removeItem('startTourNextLoad');
      setTimeout(() => {
        if (driverObj.current) {
          driverObj.current.drive();
        }
      }, 500);
    }
  }, [t, navigate]);

  const startTour = () => {
    if (location.pathname !== '/') {
      localStorage.setItem('startTourNextLoad', 'true');
      navigate('/');
    } else {
      if (driverObj.current) {
        driverObj.current.drive();
      }
    }
  };

  return { startTour };
};
