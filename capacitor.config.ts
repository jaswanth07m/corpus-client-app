import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swecha.corpus',
  appName: 'corpus-frontend',
  webDir: 'dist',
  backgroundColor: '#00000000',
  plugins: {
    Camera: {
      permissions: ['camera', 'microphone'],
    },
    CapacitorVideoRecorder: {
      permissions: ['camera', 'microphone', 'storage'],
    },
    VoiceRecorder: {
      permissions: ['microphone'],
    },
    Filesystem: {
      permissions: ['storage'],
    },
  },
};

export default config;
