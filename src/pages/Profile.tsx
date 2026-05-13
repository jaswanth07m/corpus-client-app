import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X,
  LogOut,
  MessageSquare,
  Loader2,
  Globe,
  HelpCircle,
  MapPin,
  Pencil,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatDuration, formatSizeMB, getISTDate } from '@/lib/utils';
import { getPointsStats, DailyPoint } from '@/lib/points';
import ContributionDashboard from '@/components/ContributionDashboard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import PointsHeatmap from '@/components/PointsHeatmap';
import CategoryTags from '@/components/CategoryTags';
import { MediaGridItem } from '@/components/MediaGridItem';
import { ContributionsList } from '@/components/ContributionsList';
import UserProfileInfo from '@/components/UserProfileInfo';
import LocationPicker from '@/components/LocationPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWelcomeTour } from '@/hooks/useWelcomeTour';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { isProfileComplete } from '@/lib/profileUtils';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { useContributionGeo } from '@/hooks/useContributionGeo';
import type { FlatContribution } from '@/types/geo';
import type { GeoJsonObject, GeometryObject } from 'geojson';
import {
  MEDIA_TYPE_COLORS,
  MEDIA_TYPE_LABELS,
  formatContributionDate,
} from '@/lib/geoUtils';

const languages = [
  'assamese',
  'bengali',
  'bodo',
  'dogri',
  'gujarati',
  'hindi',
  'kannada',
  'kashmiri',
  'konkani',
  'maithili',
  'malayalam',
  'marathi',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'urdu',
];

interface FollowedUser {
  id?: string;
  user_id?: string;
}

interface UserProfileData {
  id: string;
  name: string;
  username?: string;
  phone?: string | null;
  profile_picture_path?: string | null;
  short_bio?: string | null;
  profile_complete?: boolean;
  streaks: {
    combined_streak: {
      current: number;
      longest: number;
      total_active_days: number;
    };
  };
  timeline: Record<string, unknown>;
  summary: {
    contributions: {
      total_contributions: number;
      contributions_by_media_type: {
        text: number;
        audio: number;
        image: number;
        video: number;
        document: number;
      };
    };
    edits: {
      total_edits: number;
    };
    overall: {
      total_activities: number;
    };
  };
}

// Define interfaces for followers/following
interface User {
  id?: string;
  user_id?: string;
  name?: string;
  username?: string;
}

// Define interfaces for contribution items
interface DailyStats {
  uploads_today: number;
  total_uploads: number;
  last_upload_date: string;
  streak_days: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ContributionItem {
  id: string;
  size: number;
  category_id?: string; // Keep for backward compatibility
  category_ids?: string[]; // New field for multiple categories
  reviewed: boolean;
  title: string;
  description: string;
  duration?: number;
  timestamp?: string;
  location?: Coordinates;
  release_rights: string;
  creator: string;
  language: string;
  file_hash: string;
  snr_frequency: number;
}

interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
    document: number;
  };
  audioContributions: ContributionItem[];
  videoContributions: ContributionItem[];
  textContributions: ContributionItem[];
  imageContributions: ContributionItem[];
  documentContributions: ContributionItem[];
  audioDuration: number;
  videoDuration: number;
}

interface FieldChange {
  old_value: string | number | boolean | null | undefined;
  new_value: string | number | boolean | null | undefined;
}

interface EditHistoryEntry {
  uid: string;
  version_number: number;
  created_at: string;
  changed_by?: string;
  change_type?: string;
  change_source?: string;
  field_changes?: Record<string, FieldChange>;
}

const GEOJSON_URL = '/telugu_sub_districts.geojson';
const BOUNDARY_PANE = 'boundaries';
const MARKER_PANE = 'markers';

type GeoJsonFeature = {
  type?: string;
  properties?: Record<string, string | number | null | undefined>;
  geometry?: GeometryObject;
};

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function getFeatureSubDistrict(feature: GeoJsonFeature | undefined) {
  if (!feature?.properties) return '';
  return (
    feature.properties.subdistrict ??
    feature.properties.SUB_DISTRICT ??
    feature.properties.Subdistrict ??
    feature.properties.SUBDISTRICT ??
    feature.properties.Sub_dist ??
    feature.properties.mandal ??
    feature.properties.MANDAL ??
    feature.properties.name ??
    feature.properties.NAME ??
    feature.properties.taluk ??
    feature.properties.TALUK ??
    ''
  )
    .toString()
    .trim();
}

function getFeatureDistrict(feature: GeoJsonFeature | undefined) {
  if (!feature?.properties) return '';
  return (
    feature.properties.district ??
    feature.properties.DISTRICT ??
    feature.properties.District ??
    feature.properties.taluk ??
    ''
  )
    .toString()
    .trim();
}

function getFeatureState(feature: GeoJsonFeature | undefined) {
  if (!feature?.properties) return '';
  return (
    feature.properties.state ??
    feature.properties.STATE ??
    feature.properties.State ??
    feature.properties.STATE_UT ??
    ''
  )
    .toString()
    .trim();
}

function isPointInFeature(lat: number, lng: number, feature: GeoJsonFeature) {
  if (!feature?.geometry) return false;
  const point = turf.point([lng, lat]);
  const polygon = turf.feature(feature.geometry);
  return turf.booleanPointInPolygon(point, polygon);
}

function getSubDistrictStyle(
  feature: GeoJsonFeature,
  contributedSubDistricts: Set<string>,
) {
  const featureName = normalizeName(getFeatureSubDistrict(feature));
  const hasContribution = contributedSubDistricts.has(featureName);

  return {
    fillColor: hasContribution ? '#4ade80' : '#93c5fd',
    fillOpacity: 0.4,
    color: '#1d4ed8',
    weight: 0.6,
    opacity: 0.8,
  };
}

function MapResizerInline() {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    const timeoutId = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
}

function MapPaneSetupInline() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(BOUNDARY_PANE)) {
      const pane = map.createPane(BOUNDARY_PANE);
      pane.style.zIndex = '400';
      pane.style.pointerEvents = 'auto';
    }

    if (!map.getPane(MARKER_PANE)) {
      const pane = map.createPane(MARKER_PANE);
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'auto';
    }
  }, [map]);

  return null;
}

function SubDistrictBoundaryLayer({
  geojsonData,
  userContributions,
  contributedSubDistricts,
}: {
  geojsonData: GeoJsonFeatureCollection;
  userContributions: FlatContribution[];
  contributedSubDistricts: Set<string>;
}) {
  const map = useMap();

  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!map || !geojsonData) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const layer = L.geoJSON(geojsonData as GeoJsonObject, {
      style: (feature) =>
        getSubDistrictStyle(feature as GeoJsonFeature, contributedSubDistricts),
      onEachFeature: (feature, layerInstance) => {
        const subDistrict = getFeatureSubDistrict(feature);
        const district = getFeatureDistrict(feature);
        const state = getFeatureState(feature);

        const hasContributions = contributedSubDistricts.has(
          normalizeName(subDistrict),
        );

        const content = `
          <div style="font-family: inherit; padding: 2px 0;">
            ${
              subDistrict
                ? `<p style="margin: 0 0 4px; font-weight: 700; font-size: 13px; color: #0f172a;">${subDistrict}</p>`
                : ''
            }
            ${
              district
                ? `<p style="margin: 0 0 2px; font-size: 11px; color: #64748b;">District: ${district}</p>`
                : ''
            }
            ${
              state
                ? `<p style="margin: 0 0 2px; font-size: 11px; color: #64748b;">State: ${state}</p>`
                : ''
            }
            <p style="margin: 0; font-size: 11px; color: ${
              hasContributions ? '#16a34a' : '#64748b'
            };">
              ${hasContributions ? '✓ Has contributions' : 'No contributions'}
            </p>
          </div>
        `;

        layerInstance.bindPopup(content);
      },
    }).addTo(map);

    layerRef.current = layer;

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, geojsonData, contributedSubDistricts]);

  return null;
}

function InlineGeoMap({ userIdentifier }: { userIdentifier: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } =
    useContributionGeo(userIdentifier);
  const [boundaryData, setBoundaryData] =
    useState<GeoJsonFeatureCollection | null>(null);
  const [boundaryLoading, setBoundaryLoading] = useState(true);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [boundaryReloadKey, setBoundaryReloadKey] = useState(0);
  const contributions = useMemo(() => data ?? [], [data]);
  const contributedSubDistricts = useMemo(() => {
    const next = new Set<string>();

    if (!boundaryData?.features?.length || !contributions.length) {
      return next;
    }

    boundaryData.features.forEach((feature) => {
      const featureName = normalizeName(getFeatureSubDistrict(feature));
      if (!featureName) return;

      const hasContribution = contributions.some((contribution) => {
        if (!contribution.location) return false;
        try {
          return isPointInFeature(
            contribution.location.latitude,
            contribution.location.longitude,
            feature,
          );
        } catch {
          return false;
        }
      });

      if (hasContribution) {
        next.add(featureName);
      }
    });

    return next;
  }, [boundaryData, contributions]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    setBoundaryLoading(true);
    setBoundaryError(null);

    fetch(GEOJSON_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to fetch sub-district boundaries: ${res.status}`,
          );
        }
        return res.json();
      })
      .then((geojsonData: GeoJsonFeatureCollection) => {
        if (!isActive) return;
        try {
          const simplified = turf.simplify(geojsonData as GeoJsonObject, {
            tolerance: 0.001,
            highQuality: false,
          }) as GeoJsonFeatureCollection;
          setBoundaryData(simplified);
        } catch (simplifyError) {
          console.error(
            'Error simplifying sub-district boundaries:',
            simplifyError,
          );
          setBoundaryData(geojsonData);
        }
        setBoundaryLoading(false);
      })
      .catch((error) => {
        if (!isActive || controller.signal.aborted) return;
        console.error('Error loading sub-district boundaries:', error);
        setBoundaryData(null);
        setBoundaryError('Failed to load boundaries');
        setBoundaryLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [boundaryReloadKey]);

  const boundaryBounds = React.useMemo(() => {
    if (!boundaryData?.features?.length) return undefined;

    const bounds = L.geoJSON(boundaryData as GeoJsonObject).getBounds();
    if (!bounds.isValid()) return undefined;
    return bounds;
  }, [boundaryData]);

  if (isLoading) {
    return (
      <div className="flex h-[220px] sm:h-[300px] items-center justify-center rounded-xl bg-slate-100">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[220px] sm:h-[300px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100">
        <p className="text-xs text-slate-500">
          {t('common.couldNotLoadContributions')}
        </p>
        <button
          onClick={() => refetch()}
          className="text-xs text-blue-600 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (boundaryLoading && !boundaryData) {
    return (
      <div className="flex h-[220px] sm:h-[300px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <p className="text-xs text-slate-500">
          Loading district boundaries... please wait
        </p>
      </div>
    );
  }

  if (!boundaryData || !boundaryBounds) {
    return (
      <div className="flex h-[220px] sm:h-[300px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-100">
        <p className="text-xs text-slate-500">
          {boundaryError ?? 'Failed to load boundaries'}
        </p>
        <button
          onClick={() => setBoundaryReloadKey((value) => value + 1)}
          className="text-xs text-blue-600 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-0 mb-6 overflow-hidden rounded-xl border border-slate-200">
      <style>{`
        .leaflet-popup-content { max-height: 320px !important; overflow-y: auto !important; overflow-x: hidden !important; margin: 12px 16px !important; }
        .leaflet-popup-content-wrapper { overflow: hidden !important; border-radius: 10px !important; }
      `}</style>
      <div className="relative h-[220px] sm:h-[300px]">
        <MapContainer
          bounds={boundaryBounds}
          boundsOptions={{ padding: [10, 10] }}
          dragging
          scrollWheelZoom
          doubleClickZoom
          touchZoom
          className="h-full w-full geo-map-container"
        >
          <MapPaneSetupInline />
          <MapResizerInline />
          <SubDistrictBoundaryLayer
            geojsonData={boundaryData}
            userContributions={contributions}
            contributedSubDistricts={contributedSubDistricts}
          />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {contributions.map((c) => {
            const color = MEDIA_TYPE_COLORS[c.media_type] ?? '#666';
            const label = MEDIA_TYPE_LABELS[c.media_type] ?? c.media_type;
            const date = formatContributionDate(c.timestamp);
            return (
              <CircleMarker
                key={c.id}
                center={[c.location.latitude, c.location.longitude]}
                radius={10}
                fillOpacity={0.85}
                pane={MARKER_PANE}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: color }}
              >
                <Popup>
                  <div style={{ fontFamily: 'inherit', padding: '2px 0' }}>
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#0f172a',
                      }}
                    >
                      {c.title}
                    </p>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: color,
                          marginRight: 4,
                          verticalAlign: 'middle',
                        }}
                      />
                      Type: {label}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                      Date: {date}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {boundaryLoading && (
          <div className="pointer-events-none absolute left-3 top-3 z-[650] rounded-md bg-white/85 px-2.5 py-1 text-[11px] text-slate-600 shadow-sm backdrop-blur">
            Loading district boundaries...
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{ borderColor: '#1d4ed8', backgroundColor: '#93c5fd' }}
          />
          <span className="text-xs text-slate-500">
            {t(
              'stats.subDistrictNoContributions',
              'Sub-district (no contributions)',
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{ borderColor: '#1d4ed8', backgroundColor: '#4ade80' }}
          />
          <span className="text-xs text-slate-500">
            {t(
              'stats.subDistrictWithContributions',
              'Sub-district (with contributions)',
            )}
          </span>
        </div>
        {Object.keys(MEDIA_TYPE_COLORS).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: MEDIA_TYPE_COLORS[type] }}
            />
            <span className="text-xs text-slate-500">
              {MEDIA_TYPE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { startTour } = useWelcomeTour();
  const { preferences, setPreferences } = useUserPreferences();

  // State for user preferences panel
  const [showPreferencesPanel, setShowPreferencesPanel] =
    useState<boolean>(false);
  const [localPrefs, setLocalPrefs] = useState({
    location: preferences.location,
    language: preferences.language,
    rights: preferences.rights,
  });

  // Location state for preferences
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [prefLocationCoords, setPrefLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [prefVerifiedLocation, setPrefVerifiedLocation] = useState<{
    formatted_address: string;
    country: string;
    state: string;
    city: string;
    postal_code: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [prefLocationError, setPrefLocationError] = useState('');
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [contributionsLoading, setContributionsLoading] =
    useState<boolean>(false);
  const [pointsData, setPointsData] = useState<DailyPoint[] | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // States for dashboard functionality
  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null
  >(null);

  const { username } = useParams<{ username?: string }>();

  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [targetUserIdentifier, setTargetUserIdentifier] = useState<
    string | null
  >(null); // Store the identifier (username or ID) for API calls

  // State for follow functionality
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  // New states for followers and following
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loadingFollowers, setLoadingFollowers] = useState<boolean>(false);
  const [loadingFollowing, setLoadingFollowing] = useState<boolean>(false);

  // State for followers/following modals
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);

  // State for media grid display
  const [showMediaGrid, setShowMediaGrid] = useState<boolean>(false);

  // State for user profile info modal
  const [showProfileInfo, setShowProfileInfo] = useState<boolean>(false);

  // State for profile picture update modal
  const [showProfilePictureModal, setShowProfilePictureModal] =
    useState<boolean>(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  // Effect to hide bottom navigation when any modal is open
  useEffect(() => {
    if (
      showMediaGrid ||
      showFollowersModal ||
      showFollowingModal ||
      showProfileInfo ||
      showProfilePictureModal
    ) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [
    showMediaGrid,
    showFollowersModal,
    showFollowingModal,
    showProfileInfo,
    showProfilePictureModal,
  ]);

  // Sync local state when global preferences change
  useEffect(() => {
    setLocalPrefs({
      location: preferences.location,
      language: preferences.language,
      rights: preferences.rights,
    });
  }, [preferences]);

  // Verify location when coordinates change
  const verifyPrefLocation = useCallback(async (lat: number, lng: number) => {
    if (!lat || !lng) return;
    setIsVerifyingLocation(true);
    setPrefLocationError('');

    try {
      const response = await fetch(`${BACKEND_URL}/location/verify-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      if (response.ok) {
        const data = await response.json();
        setPrefVerifiedLocation(data);
        setLocalPrefs((prev) => ({
          ...prev,
          location: data.formatted_address,
        }));
      } else {
        throw new Error('Failed to verify location');
      }
    } catch (error) {
      console.error('Location verification error:', error);
      setPrefLocationError('Could not verify location');
    } finally {
      setIsVerifyingLocation(false);
    }
  }, []);

  // Auto-verify location when coordinates are set from map
  useEffect(() => {
    if (prefLocationCoords && !prefVerifiedLocation) {
      verifyPrefLocation(prefLocationCoords.lat, prefLocationCoords.lng);
    }
  }, [prefLocationCoords, prefVerifiedLocation, verifyPrefLocation]);

  // Request current location for preferences
  const requestPrefLocation = () => {
    setPrefLocationError('');
    if (!navigator.geolocation) {
      setPrefLocationError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPrefLocationCoords(coords);
        setPreferences({ locationCoords: coords });
      },
      (err) => {
        setPrefLocationError('Location access denied');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Save preferences handler
  const handleSavePreferences = () => {
    setPreferences({
      language: localPrefs.language,
      rights: localPrefs.rights,
    });
    toast.success(t('common.preferencesSavedSuccessfully'));
    setShowPreferencesPanel(false);
  };

  // Sync local state when global preferences change
  useEffect(() => {
    setLocalPrefs({
      location: preferences.location,
      language: preferences.language,
      rights: preferences.rights,
    });
  }, [preferences]);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Function to get the current user's ID from the token
  const getCurrentUserId = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    try {
      // Get user profile to extract current user ID
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Could not get current user profile');
      }

      const userData = await response.json();
      setCurrentUsername(userData.username);
      return userData.id;
    } catch (err) {
      console.error('Error getting current user ID:', err);
      return null;
    }
  }, [getAuthToken]);

  // Function to fetch user contributions by media type
  const fetchUserContributions = useCallback(
    async (
      userId: string, // Changed parameter name from currentUserId to userId for clarity
      mediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | undefined,
    ) => {
      setContributionsLoading(true);

      try {
        const token = getAuthToken();
        const baseUrl = BACKEND_URL;
        const apiUrl = mediaType
          ? `${baseUrl}/users/${userId}/contributions/${mediaType}`
          : `${baseUrl}/users/${userId}/contributions`; // Fallback to all if no mediaType

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch contributions: ${response.status}`);
        }

        const data = await response.json();

        // Initialize all contribution types as empty arrays
        const newContributions: UserContributions = {
          totalContributions: data.total_contributions || 0,
          contributionsByType: data.contributions_by_media_type || {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
            document: 0,
          },
          audioContributions: [],
          videoContributions: [],
          textContributions: [],
          imageContributions: [],
          documentContributions: [],
          audioDuration: data.audio_duration || 0,
          videoDuration: data.video_duration || 0,
        };

        // Populate only the fetched media type
        if (mediaType === 'text') {
          newContributions.textContributions = data.contributions || [];
        } else if (mediaType === 'audio') {
          newContributions.audioContributions = data.contributions || [];
        } else if (mediaType === 'video') {
          newContributions.videoContributions = data.contributions || [];
        } else if (mediaType === 'image') {
          newContributions.imageContributions = data.contributions || [];
        } else if (mediaType === 'document') {
          newContributions.documentContributions = data.contributions || [];
        } else {
          // If no specific mediaType was requested (dashboard view), populate all
          newContributions.audioContributions = data.audio_contributions || [];
          newContributions.videoContributions = data.video_contributions || [];
          newContributions.textContributions = data.text_contributions || [];
          newContributions.imageContributions = data.image_contributions || [];
          newContributions.documentContributions =
            data.document_contributions || [];
        }

        setContributions(newContributions);
      } catch (err) {
        setContributions({
          totalContributions: 0,
          contributionsByType: {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
            document: 0,
          },
          audioContributions: [],
          videoContributions: [],
          textContributions: [],
          imageContributions: [],
          documentContributions: [],
          audioDuration: 0,
          videoDuration: 0,
        });
      } finally {
        setContributionsLoading(false);
      }
    },
    [getAuthToken],
  );

  // Function to calculate uploads today from contributions
  const calculateUploadsToday = () => {
    if (!contributions) return 0;

    const allContributions = [
      ...(contributions.audioContributions || []),
      ...(contributions.videoContributions || []),
      ...(contributions.textContributions || []),
      ...(contributions.imageContributions || []),
      ...(contributions.documentContributions || []),
    ].filter((item) => item.timestamp);

    if (allContributions.length === 0) {
      return 0;
    }

    const todayIST = getISTDate(new Date().toISOString()); // Get current date in IST
    todayIST.setHours(0, 0, 0, 0); // Set to start of IST day

    let uploadsTodayCount = 0;
    allContributions.forEach((item) => {
      if (item.timestamp) {
        const itemDateIST = getISTDate(item.timestamp); // Convert UTC timestamp to IST Date object
        itemDateIST.setHours(0, 0, 0, 0); // Set to start of IST day
        if (itemDateIST.getTime() === todayIST.getTime()) {
          uploadsTodayCount++;
        }
      }
    });
    return uploadsTodayCount;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to update profile picture
  const updateProfilePicture = async () => {
    if (!profilePictureUrl.trim()) {
      toast.error(t('media.pleaseEnterAValidImageUrl'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('common.authenticationTokenNotFound'));
        return;
      }

      // Get current user ID to update their profile
      const currentProfileResponse = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!currentProfileResponse.ok) {
        throw new Error('Could not get current user profile');
      }

      const currentProfile = await currentProfileResponse.json();
      const currentUserId = currentProfile.id;

      // Update the profile with the new picture URL
      const response = await fetch(`${BACKEND_URL}/users/${currentUserId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_picture_path: profilePictureUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `Failed to update profile picture: ${response.status}`,
        );
      }

      // Update the local profile state
      if (profile) {
        setProfile({
          ...profile,
          profile_picture_path: profilePictureUrl,
        });
      }

      toast.success(t('messages.profilePictureUpdatedSuccessfully'));
      setShowProfilePictureModal(false);
      setProfilePictureUrl('');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update profile picture',
      );
    }
  };

  // Function to get current user's profile to check follow status
  const checkFollowStatusWithUsername = useCallback(
    async (profileUsername: string) => {
      try {
        const token = getAuthToken();
        if (!token) {
          return;
        }

        // Get current user's profile to get their id
        const currentProfileResponse = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!currentProfileResponse.ok) {
          throw new Error('Could not get current user profile');
        }

        const currentProfile = await currentProfileResponse.json();
        const currentUserId = currentProfile.id;

        // Get the current user's following list
        const followingResponse = await fetch(
          `${BACKEND_URL}/users/${currentUserId}/following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          const followingList = followingData.following || followingData || [];
          // Check if the user is being followed by username or ID
          const isUserBeingFollowed = followingList.some(
            (user: FollowedUser) =>
              user.username === profileUsername ||
              user.id === profileUsername ||
              user.user_id === profileUsername,
          );
          setIsFollowing(isUserBeingFollowed);
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    },
    [getAuthToken],
  );

  // Function to follow a user
  const followUser = async (targetUsername: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUsername}/follow`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        setIsFollowing(true);
        // Update the followers count by incrementing it (since target user now has one more follower)
        setFollowersCount((prev) => prev + 1);
        // Refetch profile to update counts
        fetchOtherUserProfile(targetUsername);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUsername);
        fetchFollowing(targetUsername);
      } else {
        throw new Error(`Failed to follow user: ${response.status}`);
      }
    } catch (err) {
      console.error('Error following user:', err);
      setError(err instanceof Error ? err.message : 'Error following user');
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to unfollow a user
  const unfollowUser = async (targetUsername: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUsername}/follow`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        setIsFollowing(false);
        // Update the followers count by decrementing it (since target user now has one less follower)
        setFollowersCount((prev) => Math.max(0, prev - 1));
        // Refetch profile to update counts
        fetchOtherUserProfile(targetUsername);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUsername);
        fetchFollowing(targetUsername);
      } else {
        throw new Error(`Failed to unfollow user: ${response.status}`);
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err instanceof Error ? err.message : 'Error unfollowing user');
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to fetch followers
  const fetchFollowers = useCallback(
    async (targetUsername: string) => {
      setLoadingFollowers(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUsername}/followers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch followers: ${response.status}`);
        }

        const data = await response.json();
        setFollowers(data.followers || data || []);
        setFollowersCount(data.followers_count || data.length || 0);
      } catch (err) {
        console.error('Error fetching followers:', err);
        setFollowers([]);
        setFollowersCount(0);
      } finally {
        setLoadingFollowers(false);
      }
    },
    [getAuthToken],
  );

  // Function to fetch following
  const fetchFollowing = useCallback(
    async (targetUsername: string) => {
      setLoadingFollowing(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUsername}/following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch following: ${response.status}`);
        }

        const data = await response.json();
        setFollowing(data.following || data || []);
        setFollowingCount(data.following_count || data.length || 0);
      } catch (err) {
        console.error('Error fetching following:', err);
        setFollowing([]);
        setFollowingCount(0);
      } finally {
        setLoadingFollowing(false);
      }
    },
    [getAuthToken],
  );

  // Unified function to fetch user profile regardless of whether it's own or other's profile
  const fetchUserProfile = useCallback(
    async (userIdentifier: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        // Determine if we're fetching own profile or other profile
        const isOwnProfile =
          userIdentifier === (localStorage.getItem('username') || '');
        let userData;
        let formattedProfile;

        if (isOwnProfile) {
          // Fetch own profile
          const response = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.status}`);
          }

          userData = await response.json();
          formattedProfile = {
            id: userData.id,
            name: userData.name || userData.username || 'Unknown User',
            username: userData.username,
            phone: userData.phone || null,
            profile_picture_path: userData.profile_picture_path || null,
            short_bio: userData.short_bio || null,
            profile_complete: isProfileComplete(userData),
            streaks: {
              combined_streak: {
                current: userData.streak_days || 0,
                longest: userData.streak_days || 0,
                total_active_days: userData.total_active_days || 0,
              },
            },
            timeline: {},
            summary: {
              contributions: {
                total_contributions: userData.total_contributions || 0,
                contributions_by_media_type:
                  userData.contributions_by_media_type || {
                    text: 0,
                    audio: 0,
                    image: 0,
                    video: 0,
                    document: 0,
                  },
              },
              edits: {
                total_edits: userData.total_edits || 0,
              },
              overall: {
                total_activities: userData.total_activities || 0,
              },
            },
          };
        } else {
          // Fetch other user's profile
          const apiUrl =
            BACKEND_URL +
            `/users/${userIdentifier}/profile?include=streaks,timeline,summary&days=30`;
          const response = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status == 401) {
              throw new Error(
                'Authentication Failed. Please log in Again. Your session might have expired',
              );
            }
            if (response.status == 404) {
              throw new Error('User Not Found');
            }
            throw new Error(
              `Failed to fetch profile: ${response.status} ${response.statusText}`,
            );
          }

          userData = await response.json();
          formattedProfile = {
            id: userData.user_id,
            name: userData.user_name || 'Unknown User',
            username: userData.username,
            phone: userData.phone || null,
            profile_picture_path: userData.profile_picture_path || null,
            short_bio: userData.short_bio || null,
            profile_complete: isProfileComplete(userData),
            streaks: userData.streaks,
            timeline: userData.timeline,
            summary: userData.summary,
          };
          console.log(formattedProfile);
        }

        setProfile(formattedProfile);
        setTargetUserIdentifier(userIdentifier); // Set the target identifier for API calls

        // Fetch points data for the profile after profile is set
        try {
          const pointsStats = await getPointsStats(token, userIdentifier);
          setPointsData(pointsStats.daily);
          setPointsError(null); // Clear any previous error
        } catch (pointsError) {
          console.error('Error fetching points data:', pointsError);
          // Points data might not be available for other users due to privacy settings
          // This is expected behavior in many cases
          if (isOwnProfile) {
            // Only show error for own profile
            setPointsError('Failed to load points data');
          }
          setPointsData([]);
          setPointsError(null); // Don't show error for other profiles
        }
      } catch (err) {
        console.error('Error fetching profile', err);
        setError(err instanceof Error ? err.message : 'Error caught in Catch');
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken],
  );

  // Effect for initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      // Get current user ID first
      const currentId = await getCurrentUserId();
      const currentUsername = localStorage.getItem('username') || null; // Also get current username
      setCurrentUserId(currentId);
      setCurrentUsername(currentUsername);

      if (username) {
        // Reset points data before fetching new data
        setPointsData(null);
        setPointsError(null);

        // Use unified function to fetch profile regardless of own or other profile
        fetchUserProfile(username);

        // Fetch all contributions for the user initially
        fetchUserContributions(username, undefined);

        // Fetch followers and following
        fetchFollowers(username);
        fetchFollowing(username);

        // Check follow status if viewing other user's profile
        if (currentUsername !== username) {
          checkFollowStatusWithUsername(username);
        }
      }
    };

    loadInitialData();
  }, [
    username,
    fetchUserProfile,
    checkFollowStatusWithUsername,
    fetchFollowers,
    fetchFollowing,
    getCurrentUserId,
    selectedMediaType,
    fetchUserContributions,
    getAuthToken,
  ]);

  // Determine if viewing own profile
  const isOwnProfile =
    username && currentUsername ? currentUsername === username : false;

  // Geo contribution user identifier - passed to map component
  // Use a fallback chain so the geo hook fires on first render without waiting for async state
  const geoContributionUserIdentifier =
    username || targetUserIdentifier || currentUserId || '';

  console.log(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 sm:mb-12 pt-4 pb-24">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Enhanced Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-3 overflow-hidden">
          {/* Profile Info Section - Mobile Responsive Layout */}
          <div className="p-4 relative">
            <div className="flex gap-2 absolute right-0 sm:right-5">
              <LanguageSwitcher />
              <button
                onClick={() => setShowPreferencesPanel(true)}
                className="flex flex-col items-center gap-1 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                title="User Preferences"
              >
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={startTour}
                className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('common.start.welcome.tour')}
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </div>

            <div className="flex flex-row gap-6 items-center">
              {/* Avatar - Centered on mobile */}
              <div
                className={`relative flex-shrink-0 group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={() => isOwnProfile && setShowProfilePictureModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                {profile?.profile_picture_path ? (
                  <img
                    src={profile.profile_picture_path}
                    alt={`${profile.name}'s profile`}
                    className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover shadow-xl ring-4 ring-blue-5 group-hover:ring-6 sm:group-hover:ring-8 group-hover:ring-blue-100 transition-all duration-300 transform group-hover:scale-105"
                  />
                ) : (
                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-xl ring-4 ring-blue-5 group-hover:ring-6 sm:group-hover:ring-8 group-hover:ring-blue-100 transition-all duration-300 transform group-hover:scale-105">
                    {getInitials(profile?.name)}
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full border-4 border-white animate-pulse"></div>
                )}
              </div>

              {/* User Info & Stats - Stacked on mobile */}
              <div className="flex-1 text-left">
                {/* Name and Username */}
                <div className="mb-4">
                  <p className="text-sm sm:text-xl mb-1">{profile?.name}</p>
                  <p className="text-slate-500 text-sm">
                    @{profile?.username || profile?.id}
                  </p>
                </div>

                {/* Stats Row - Side by side with equal width */}
                <div className="flex gap-2">
                  {/* Followers Button */}
                  <button
                    onClick={() => {
                      const id = username || currentUserId;
                      if (id) fetchFollowers(id);
                      setShowFollowersModal(true);
                    }}
                    className="max-w-20 flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all duration-200 active:scale-95 group"
                  >
                    <span className="text-emerald-600 font-bold text-base">
                      {followersCount}
                    </span>
                    <span className="text-slate-500 text-[7px] font-medium uppercase tracking-wider group-hover:text-emerald-700">
                      {t('profile.followers')}
                    </span>
                  </button>

                  {/* Following Button */}
                  <button
                    onClick={() => {
                      const id = username || currentUserId;
                      if (id) fetchFollowing(id);
                      setShowFollowingModal(true);
                    }}
                    className="max-w-20 flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-200 active:scale-95 group"
                  >
                    <span className="text-blue-600 font-bold text-base">
                      {followingCount}
                    </span>
                    <span className="text-slate-500 text-[7px] font-medium uppercase tracking-wider group-hover:text-emerald-700">
                      {t('profile.following')}
                    </span>
                  </button>

                  {/* Profile Info Button */}
                  <button
                    onClick={() => setShowProfileInfo(true)}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                    title={
                      isOwnProfile
                        ? t('profile.viewYourProfileInfo')
                        : t('profile.viewProfileInfo')
                    }
                  >
                    {t('profile.info')}
                  </button>
                </div>

                {/* Follow Button - Full width on mobile */}
                {!isOwnProfile && (
                  <button
                    onClick={() => {
                      if (isFollowing) {
                        unfollowUser(username!);
                      } else {
                        followUser(username!);
                      }
                    }}
                    disabled={followLoading}
                    className={`w-full mt-2 sm:w-auto px-3 py-1.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isFollowing
                        ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border-2 border-slate-300 hover:border-slate-400'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {followLoading ? (
                      <span className="flex items-center justify-center sm:justify-start gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('common.processing')}
                      </span>
                    ) : isFollowing ? (
                      t('profile.following')
                    ) : (
                      t('profile.follow')
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Incomplete Profile Alert - Only for own profile */}
        {isOwnProfile && profile?.profile_complete === false && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-4 sm:p-6 mb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-red-700 font-semibold">
                  {t('nav.profileIncompletePleaseCompleteIt')}
                </p>
                <p className="text-red-600 text-sm mt-1">
                  {t('nav.someFeaturesMayBeLimitedUntilYouFinishYourProfile')}
                </p>
              </div>
              <button
                onClick={() => navigate('/complete-profile/step-2')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                {t('nav.completeProfile')}
              </button>
            </div>
          </div>
        )}

        {/* Bio Section - Visible for all user profiles */}
        {profile?.short_bio && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-3">
            <div className="flex items-start">
              <MessageSquare className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-xs sm:text-sm">
                {profile.short_bio}
              </p>
            </div>
          </div>
        )}

        {/* Points Heatmap Section - Visible for all user profiles */}
        <div
          id="tour-points-heatmap"
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-3"
        >
          {pointsError ? (
            <div className="text-center py-4">
              <p className="text-red-500">{pointsError}</p>
            </div>
          ) : pointsData ? (
            <PointsHeatmap dailyData={pointsData} />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">{t('messages.loadingPointsData')}</p>
            </div>
          )}
        </div>

        {/* Contributions Section - Mobile Responsive Design */}
        <div
          id="tour-contributions-dashboard"
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-3"
        >
          <div className="mt-1 sm:mt-2">
            <ContributionDashboard
              dailyStats={{
                uploads_today: calculateUploadsToday(),
                total_uploads: contributions?.totalContributions || 0,
                last_upload_date: new Date().toISOString(),
                streak_days: profile?.streaks?.combined_streak?.current || 0,
              }}
              contributions={contributions}
              loading={contributionsLoading}
              edits={profile?.summary?.edits?.total_edits}
              onMediaTypeClick={(mediaType) => {
                setSelectedMediaType(mediaType);
                const targetUserIdentifier = username || currentUserId;
                if (targetUserIdentifier) {
                  fetchUserContributions(targetUserIdentifier, mediaType);
                }
                setShowMediaGrid(true); // Show the grid when a media type is clicked
              }}
            />
          </div>
        </div>

        {/* Inline Geo Contribution Map */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-5 mb-3">
          <p className="text-sm font-semibold text-slate-700 mb-3">
            {t('stats.myContributionsOnTheMap')}
          </p>
          <InlineGeoMap userIdentifier={geoContributionUserIdentifier} />
        </div>
      </div>

      {/* Media Grid Overlay - Appears when clicking on media type cards */}
      {showMediaGrid && selectedMediaType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold capitalize">
                {t(`media.${selectedMediaType}`)} {t('stats.contributions')}
              </h3>
              <button
                onClick={() => {
                  setShowMediaGrid(false);
                  // Optionally reset selectedMediaType when closing the grid
                  // setSelectedMediaType(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-auto p-4">
              <ContributionsList
                contributions={contributions}
                selectedMediaType={selectedMediaType}
                token={getAuthToken()}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </div>
        </div>
      )}

      {/* Followers and Following Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        loading={loadingFollowers}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
        navigate={navigate}
        t={t}
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        loading={loadingFollowing}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
        navigate={navigate}
        t={t}
      />

      {/* User Profile Info Modal */}
      {showProfileInfo && targetUserIdentifier && (
        <UserProfileInfo
          userId={targetUserIdentifier}
          onClose={() => setShowProfileInfo(false)}
          onUpdate={(updatedProfile) => {
            // Optionally update the local profile state with the updated data
            if (profile) {
              setProfile({
                ...profile,
                name: updatedProfile.name || profile.name,
                username: updatedProfile.username || profile.username,
                // Update other fields as needed
              });
            }
          }}
        />
      )}

      {/* Profile Picture Update Modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {t('nav.updateProfilePicture')}
                </h3>
                <button
                  onClick={() => {
                    setShowProfilePictureModal(false);
                    setProfilePictureUrl('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="profilePictureUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t('media.imageUrl')}
                </label>
                <input
                  type="text"
                  id="profilePictureUrl"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('nav.enterAValidImageUrlForYourProfilePicture')}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePictureModal(false);
                    setProfilePictureUrl('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateProfilePicture}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences Modal */}
      {showPreferencesPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {t('common.user.preferences')}
                </h3>
                <button
                  onClick={() => setShowPreferencesPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="prefLanguage"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('common.default.language')}
                  </label>
                  <select
                    id="prefLanguage"
                    value={localPrefs.language}
                    onChange={(e) =>
                      setLocalPrefs({ ...localPrefs, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Language</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prefRights"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('ui.default.release.rights')}
                  </label>
                  <select
                    id="prefRights"
                    value={localPrefs.rights}
                    onChange={(e) =>
                      setLocalPrefs({ ...localPrefs, rights: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Release Rights</option>
                    <option value="creator">
                      This work is created by me and anyone is free to use it.
                    </option>
                    <option value="others">Others</option>
                    <option value="downloaded">
                      I downloaded this from the internet and/or I don't know if
                      it is free to share.
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreferencesPanel(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                >
                  {t('common.savePreferences')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Preferences Modal */}
      {showPreferencesPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {t('common.user.preferences')}
                </h3>
                <button
                  onClick={() => setShowPreferencesPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="prefLanguage"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('common.default.language')}
                  </label>
                  <select
                    id="prefLanguage"
                    value={localPrefs.language}
                    onChange={(e) =>
                      setLocalPrefs({ ...localPrefs, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Language</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prefRights"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('ui.default.release.rights')}
                  </label>
                  <select
                    id="prefRights"
                    value={localPrefs.rights}
                    onChange={(e) =>
                      setLocalPrefs({ ...localPrefs, rights: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Release Rights</option>
                    <option value="creator">
                      This work is created by me and anyone is free to use it.
                    </option>
                    <option value="others">Others</option>
                    <option value="downloaded">
                      I downloaded this from the internet and/or I don't know if
                      it is free to share.
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreferencesPanel(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                >
                  {t('common.savePreferences')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal component for displaying followers
const FollowersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  followers: User[];
  loading: boolean;
  currentUserId: string | null;
  isOwnProfile: boolean;
  navigate: (path: string) => void;
  t: (key: string) => string;
}> = ({
  isOpen,
  onClose,
  followers,
  loading,
  currentUserId,
  isOwnProfile,
  navigate,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <h3 className="text-lg font-semibold">{t('profile.followers')}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : followers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {followers.map((follower, index) => {
                const userId = follower.id || follower.user_id;
                const username = follower.username || userId;
                const isCurrentUser = userId === currentUserId;
                const uniqueKey = userId || `follower-${index}`;

                return (
                  <li
                    key={uniqueKey}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (username) {
                        if (isCurrentUser) {
                          navigate('/profile');
                        } else {
                          navigate(`/profile/${username}`);
                        }
                        // Close the modal after navigation
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {follower.name
                            ? follower.name.charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {follower.name || follower.username || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">{t('common.noFollowersFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal component for displaying following
const FollowingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  following: User[];
  loading: boolean;
  currentUserId: string | null;
  isOwnProfile: boolean;
  navigate: (path: string) => void;
  t: (key: string) => string;
}> = ({
  isOpen,
  onClose,
  following,
  loading,
  currentUserId,
  isOwnProfile,
  navigate,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <h3 className="text-lg font-semibold">{t('profile.following')}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : following.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {following.map((followedUser, index) => {
                const userId = followedUser.id || followedUser.user_id;
                const username = followedUser.username || userId;
                const isCurrentUser = userId === currentUserId;
                const uniqueKey = userId || `following-${index}`;

                return (
                  <li
                    key={uniqueKey}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (username) {
                        if (isCurrentUser) {
                          navigate('/profile');
                        } else {
                          navigate(`/profile/${username}`);
                        }
                        // Close the modal after navigation
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {followedUser.name
                            ? followedUser.name.charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {followedUser.name ||
                            followedUser.username ||
                            'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">
                {t('common.noUsersBeingFollowed')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Contribution type button component
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function ContributionTypeButton({
  type,
  selectedMediaType,
  setSelectedMediaType,
}: {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  selectedMediaType: 'text' | 'image' | 'video' | 'audio' | 'document' | null;
  setSelectedMediaType: (
    type: 'text' | 'image' | 'video' | 'audio' | 'document',
  ) => void;
}) {
  return (
    <button
      key={type}
      onClick={() => setSelectedMediaType(type)}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-xs sm:text-sm
        ${
          selectedMediaType === type
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
        }`}
    >
      {capitalize(type)}
    </button>
  );
}

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  token: string;
  isOwnProfile: boolean;
}

// Modal for showing media details

// Dashboard card component
interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  value,
  unit,
  color,
}) => (
  <div
    className={`p-5 rounded-lg shadow-sm flex items-center space-x-4 ${color}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

interface MediaTypeCardProps {
  type: string;
  count: number;
  duration?: number;
  icon: React.ReactNode;
  color: string;
}

const MediaTypeCard: React.FC<MediaTypeCardProps> = ({
  type,
  count,
  duration,
  icon,
  color,
}) => (
  <div className={`p-4 rounded-lg shadow-sm text-center ${color}`}>
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-bold text-gray-900">{count}</p>
    <p className="text-sm text-gray-600">{type} Contributions</p>
    {duration !== undefined && duration > 0 && (
      <p className="text-xs text-gray-500 mt-1">
        {formatDuration(duration)} total
      </p>
    )}
  </div>
);

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // If total pages is less than or equal to max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and adjacent pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center mt-4 sm:mt-6 gap-1 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Prev
      </button>

      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === 'ellipsis' ? (
            <span className="px-2 py-1.5 sm:px-3 sm:py-2 text-gray-500 text-sm">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default Profile;
