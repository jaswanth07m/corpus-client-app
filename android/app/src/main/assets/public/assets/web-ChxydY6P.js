import { W as v } from './index-CpoMMn48.js';
class m {
  constructor(e = {}) {
    ((this.opacity = e.opacity || 0),
      (this.radius = e.radius || 0),
      (this.color = i(e.color || '#000000') || '#000000'));
    function i(r) {
      const o = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      r = r.replace(o, function (h, d, l, n) {
        return d + d + l + l + n + n;
      });
      const t = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);
      return t
        ? `${parseInt(t[1], 16)}, ${parseInt(t[2], 16)}, ${parseInt(t[3], 16)}`
        : null;
    }
  }
}
class a {
  constructor(e = {}) {
    ((this.id = e.id),
      (this.stackPosition = e.stackPosition || 'back'),
      (this.x = e.x || 0),
      (this.y = e.y || 0),
      (this.width = e.width || 'fill'),
      (this.height = e.height || 'fill'),
      (this.borderRadius = e.borderRadius || 0),
      (this.dropShadow = new m(e.dropShadow)));
  }
}
class c extends v {
  constructor() {
    (super(),
      (this.previewFrameConfigs = []),
      (this.currentFrameConfig = new a({ id: 'default' })));
  }
  _initializeCameraView() {
    ((this.videoElement = document.createElement('video')),
      (this.videoElement.autoplay = !0),
      (this.videoElement.hidden = !0),
      (this.videoElement.style.cssText = `
			object-fit: cover;
			pointer-events: none;
			position: absolute;
		`),
      document.body.appendChild(this.videoElement),
      this._updateCameraView(this.currentFrameConfig));
  }
  _updateCameraView(e) {
    var i, r, o;
    ((this.videoElement.style.width =
      e.width === 'fill' ? '100vw' : `${e.width}px`),
      (this.videoElement.style.height =
        e.height === 'fill' ? '100vh' : `${e.height}px`),
      (this.videoElement.style.left = `${e.x}px`),
      (this.videoElement.style.top = `${e.y}px`),
      (this.videoElement.style.zIndex =
        e.stackPosition === 'back' ? '-1' : '99999'),
      (this.videoElement.style.borderRadius = `${e.borderRadius}px`),
      (this.videoElement.style.boxShadow = `0 0 ${(i = e.dropShadow) === null || i === void 0 ? void 0 : i.radius}px 0 rgba(${(r = e.dropShadow) === null || r === void 0 ? void 0 : r.color}, ${(o = e.dropShadow) === null || o === void 0 ? void 0 : o.opacity})`));
  }
  async initialize(e) {
    var i, r;
    console.warn(
      'VideoRecorder: Web implementation is currently for mock purposes only, recording is not available',
    );
    const o =
      ((i = e?.previewFrames) === null || i === void 0 ? void 0 : i.length) !==
        void 0 &&
      ((r = e?.previewFrames) === null || r === void 0 ? void 0 : r.length) > 0
        ? e?.previewFrames
        : [{ id: 'default' }];
    return (
      (this.previewFrameConfigs = o?.map((t) => new a(t))),
      (this.currentFrameConfig = this.previewFrameConfigs[0]),
      this._initializeCameraView(),
      e?.autoShow !== !1 && (this.videoElement.hidden = !1),
      navigator.mediaDevices.getUserMedia &&
        ((this.stream = await navigator.mediaDevices.getUserMedia({
          video: !0,
        })),
        (this.videoElement.srcObject = this.stream)),
      Promise.resolve()
    );
  }
  destroy() {
    var e, i;
    return (
      (e = this.videoElement) === null || e === void 0 || e.remove(),
      (this.previewFrameConfigs = []),
      this.currentFrameConfig,
      (i = this.stream) === null ||
        i === void 0 ||
        i.getTracks().forEach((r) => r.stop()),
      Promise.resolve()
    );
  }
  flipCamera() {
    return (
      console.warn('VideoRecorder: No web mock available for flipCamera'),
      Promise.resolve()
    );
  }
  addPreviewFrameConfig(e) {
    if (this.videoElement) {
      if (!e.id) return Promise.reject('id required');
      const i = new a(e);
      this.previewFrameConfigs.map((r) => r.id).indexOf(i.id) === -1
        ? this.previewFrameConfigs.push(i)
        : this.editPreviewFrameConfig(e);
    }
    return Promise.resolve();
  }
  editPreviewFrameConfig(e) {
    if (this.videoElement) {
      if (!e.id) return Promise.reject('id required');
      const i = new a(e),
        r = this.previewFrameConfigs.map((o) => o.id).indexOf(i.id);
      (r !== -1
        ? (this.previewFrameConfigs[r] = i)
        : this.addPreviewFrameConfig(e),
        this.currentFrameConfig.id == e.id &&
          ((this.currentFrameConfig = i),
          this._updateCameraView(this.currentFrameConfig)));
    }
    return Promise.resolve();
  }
  switchToPreviewFrame(e) {
    if (this.videoElement) {
      if (!e.id) return Promise.reject('id required');
      const i = this.previewFrameConfigs.filter((r) => r.id === e.id);
      if (i.length > 0) this._updateCameraView(i[0]);
      else return Promise.reject('id not found');
    }
    return Promise.resolve();
  }
  showPreviewFrame() {
    return (
      this.videoElement && (this.videoElement.hidden = !1),
      Promise.resolve()
    );
  }
  hidePreviewFrame() {
    return (
      this.videoElement && (this.videoElement.hidden = !0),
      Promise.resolve()
    );
  }
  startRecording() {
    return (
      console.warn('VideoRecorder: No web mock available for startRecording'),
      Promise.resolve()
    );
  }
  stopRecording() {
    return (
      console.warn('VideoRecorder: No web mock available for stopRecording'),
      Promise.resolve({ videoUrl: 'some/file/path' })
    );
  }
  getDuration() {
    return Promise.resolve({ value: 0 });
  }
  addListener() {
    console.warn('VideoRecorder: No web mock available for addListener');
  }
  toggleFlash() {
    return (
      console.warn('VideoRecorder: No web mock available for toggleFlash'),
      Promise.resolve()
    );
  }
  enableFlash() {
    return (
      console.warn('VideoRecorder: No web mock available for enableFlash'),
      Promise.resolve()
    );
  }
  disableFlash() {
    return (
      console.warn('VideoRecorder: No web mock available for disableFlash'),
      Promise.resolve()
    );
  }
  isFlashEnabled() {
    return (
      console.warn('VideoRecorder: No web mock available for isFlashEnabled'),
      Promise.resolve({ isEnabled: !1 })
    );
  }
  isFlashAvailable() {
    return (
      console.warn('VideoRecorder: No web mock available for isFlashAvailable'),
      Promise.resolve({ isAvailable: !1 })
    );
  }
}
export { c as VideoRecorderWeb };
//# sourceMappingURL=web-ChxydY6P.js.map
