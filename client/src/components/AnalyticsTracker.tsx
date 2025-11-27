import React from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "../lib/analytics";

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const previousUrl = React.useRef<string | null>(null);

  React.useEffect(() => {
    const url = `${location.pathname}${location.search}`;
    trackEvent({
      type: "PAGE_VIEW",
      url,
      referrer: previousUrl.current,
    });
    previousUrl.current = url;
  }, [location]);

  return null;
};

export default AnalyticsTracker;
