
# Scraperino Alert

Just a simple app for scraping websites and sending email notifications when anything of interest shows up.

Used to use it for monitoring for RTX 3080 availability. Now adding for Covid vaccine appointments..

## Usage

See `config.js` for required environment variables.

See `src/checkers` for examples of scrapers - new scrapers can be added there. Any JS files in `src/checkers` are expected to have a default export which provides all the information for scraping. New checkers can be added there and will be automatically picked up.