import React, { useState, useEffect } from 'react';
import useReconciliation from '../hooks/useReconciliation';
import ReconcileMobile from '../components/reconcile/ReconcileMobile';
import ReconcileDesktop from '../components/reconcile/ReconcileDesktop';

export default function ReconcileScreen() {
  const hookData = useReconciliation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? (
    <ReconcileMobile hookData={hookData} />
  ) : (
    <ReconcileDesktop hookData={hookData} />
  );
}
