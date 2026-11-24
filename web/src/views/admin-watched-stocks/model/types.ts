export interface WatchedStock {
  id: string;
  ticker_code: string;
  company_name: string;
  is_active: boolean;
  next_earnings_date: string | null;
  created_at: string;
}
