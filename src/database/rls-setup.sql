-- Enable Row Level Security
-- JWT_SECRET will be replaced by setup-rls.ts script from .env file
ALTER DATABASE flowtest SET app.settings.jwt_secret TO 'JWT_SECRET';

-- Create function to set context variables
CREATE OR REPLACE FUNCTION app.set_context(
  p_user_id UUID,
  p_org_id UUID,
  p_is_super_admin BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, FALSE);
  PERFORM set_config('app.current_org_id', p_org_id::TEXT, FALSE);
  PERFORM set_config('app.is_super_admin', p_is_super_admin::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy for vendors
CREATE POLICY vendors_tenant_isolation ON vendors
  FOR ALL
  USING (
    CASE
      WHEN current_setting('app.is_super_admin', TRUE) = 'true' THEN TRUE
      ELSE tenant_id::TEXT = current_setting('app.current_org_id', TRUE)
    END
  );

-- RLS Policy for invoices
CREATE POLICY invoices_tenant_isolation ON invoices
  FOR ALL
  USING (
    CASE
      WHEN current_setting('app.is_super_admin', TRUE) = 'true' THEN TRUE
      ELSE tenant_id::TEXT = current_setting('app.current_org_id', TRUE)
    END
  );

-- RLS Policy for bank_transactions
CREATE POLICY bank_transactions_tenant_isolation ON bank_transactions
  FOR ALL
  USING (
    CASE
      WHEN current_setting('app.is_super_admin', TRUE) = 'true' THEN TRUE
      ELSE tenant_id::TEXT = current_setting('app.current_org_id', TRUE)
    END
  );

-- RLS Policy for matches
CREATE POLICY matches_tenant_isolation ON matches
  FOR ALL
  USING (
    CASE
      WHEN current_setting('app.is_super_admin', TRUE) = 'true' THEN TRUE
      ELSE tenant_id::TEXT = current_setting('app.current_org_id', TRUE)
    END
  );

-- RLS Policy for idempotency_keys
CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
  FOR ALL
  USING (
    CASE
      WHEN current_setting('app.is_super_admin', TRUE) = 'true' THEN TRUE
      ELSE tenant_id::TEXT = current_setting('app.current_org_id', TRUE)
    END
  );

