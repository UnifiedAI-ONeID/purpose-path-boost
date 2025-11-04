-- Enable Row Level Security on express_orders table
ALTER TABLE express_orders ENABLE ROW LEVEL SECURITY;

-- Service role (webhooks) can manage all orders
CREATE POLICY "Service role can manage express orders"
ON express_orders FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Admins can view all orders
CREATE POLICY "Admins can view express orders"
ON express_orders FOR SELECT
USING (is_admin());

-- Optional: Allow users to view their own orders by email (if they're authenticated)
-- This policy allows authenticated users to see orders placed with their email
CREATE POLICY "Users can view their own express orders"
ON express_orders FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND email = (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
);