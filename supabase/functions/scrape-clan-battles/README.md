# scrape-clan-battles

This function scrapes battle data from RoyaleAPI and stores it in Supabase.

## Setup

1. Make sure you have set up the following secrets in your Supabase project:
   - SCRAPEOPS_API_KEY: Your ScrapeOps API key for web scraping
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key

## Deployment

The function will be automatically deployed when you push changes to your repository.

## Usage

Call this function to fetch and store battle data:

```typescript
const { data, error } = await supabase.functions.invoke('scrape-clan-battles');
```

The function returns:
- success: boolean indicating if the operation was successful
- battlesProcessed: number of battles processed
- error: error message if the operation failed