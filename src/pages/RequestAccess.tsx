import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Legacy waitlist page — sign-ups are now open. Redirect to /auth.
const RequestAccess = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/auth?signup=1", { replace: true });
  }, [navigate]);
  return null;
};

export default RequestAccess;
