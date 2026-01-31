import React from 'react';
import Skeleton from '../common/Skeleton';
import './DashboardSkeleton.css';

const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <div className="dashboard-skeleton-header">
      <Skeleton width={220} height={32} />
      <Skeleton width={100} height={40} borderRadius="var(--radius)" />
    </div>
    <div className="dashboard-skeleton-stats">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="dashboard-skeleton-stat">
          <Skeleton width={48} height={32} />
          <Skeleton width={70} height={16} />
        </div>
      ))}
    </div>
    <div className="dashboard-skeleton-filters">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width={80} height={36} borderRadius="var(--radius-full)" />
      ))}
    </div>
    <div className="dashboard-skeleton-table">
      <Skeleton height={48} borderRadius="var(--radius-lg) var(--radius-lg) 0 0" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height={56} borderRadius={0} />
      ))}
      <Skeleton height={56} borderRadius="0 0 var(--radius-lg) var(--radius-lg)" />
    </div>
  </div>
);

export default DashboardSkeleton;
