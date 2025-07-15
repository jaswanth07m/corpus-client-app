// UserContributions.tsx
import React, { useState, useEffect } from "react";

interface Contribution {
  id: string;
  size: number;
  category_id: string;
  reviewed: boolean;
  title: string;
}

interface ContributionsResponse {
  user_id: string;
  total_contributions: number;
  contributions: Contribution[];
}

interface UserContributionsProps {
  userId: string;
  mediaType: "text" | "audio" | "video" | "image";
  authToken: string;
}

const UserContributions: React.FC<UserContributionsProps> = ({
  userId,
  mediaType,
  authToken,
}) => {
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [displayedContributions, setDisplayedContributions] = useState<
    Contribution[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchContributions = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        const response = await fetch(
          `https://backend2.swecha.org/api/v1/users/${userId}/contributions/${mediaType}`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ContributionsResponse = await response.json();
        setAllContributions(data.contributions || []);
        // Show first 20 items initially
        setDisplayedContributions(
          (data.contributions || []).slice(0, ITEMS_PER_PAGE),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (userId && authToken) {
      fetchContributions();
    }
  }, [userId, mediaType, authToken]);

  const loadMore = () => {
    setLoadingMore(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      const startIndex = currentPage * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newItems = allContributions.slice(startIndex, endIndex);

      setDisplayedContributions((prev) => [...prev, ...newItems]);
      setCurrentPage((prev) => prev + 1);
      setLoadingMore(false);
    }, 500);
  };

  const hasMoreItems = displayedContributions.length < allContributions.length;

  if (loading) {
    return <div className="loading">Loading {mediaType} contributions...</div>;
  }

  if (error) {
    return <div className="error">Error loading contributions: {error}</div>;
  }

  if (allContributions.length === 0) {
    return (
      <div className="no-contributions">
        No {mediaType} contributions found.
      </div>
    );
  }

  return (
    <div className="user-contributions">
      <h3>
        {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Contributions
        <span className="contribution-count-badge">
          ({displayedContributions.length} of {allContributions.length})
        </span>
      </h3>

      <ul className="contributions-list">
        {displayedContributions.map((contribution) => (
          <li key={contribution.id} className="contribution-item">
            <span className="contribution-title">{contribution.title}</span>
            <span
              className={`contribution-status ${contribution.reviewed ? "reviewed" : "uploaded"}`}
            >
              {contribution.reviewed ? "✓ Reviewed" : "✓ Upload Success"}
            </span>
          </li>
        ))}
      </ul>

      {hasMoreItems && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? (
              <>
                <span className="loading-spinner"></span>
                Loading...
              </>
            ) : (
              `Load More (${allContributions.length - displayedContributions.length} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserContributions;
