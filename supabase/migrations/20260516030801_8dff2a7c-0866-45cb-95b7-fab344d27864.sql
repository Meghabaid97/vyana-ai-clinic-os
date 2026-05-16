
-- Revoke default PUBLIC execute on sensitive SECURITY DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.consume_invite_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_invite_token(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_invite_token(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_access_request_by_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_access_request_by_token(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_access_request_by_token(uuid) TO authenticated;
