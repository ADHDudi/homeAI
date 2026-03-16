# MCP Servers Documentation — HomeAI

This document describes every MCP (Model Context Protocol) server integrated into the HomeAI Israel Investment Finder platform, including its purpose, available tools, the data it provides, and its business relevance.

---

## Table of Contents

1. [Data.gov.il MCP Server](#1-datagovil-mcp-server)
2. [Firecrawl Web Scraper](#2-firecrawl-web-scraper)
3. [Claude Preview](#3-claude-preview)
4. [Claude in Chrome](#4-claude-in-chrome)
5. [MCP Registry](#5-mcp-registry)
6. [Scheduled Tasks](#6-scheduled-tasks)

---

## 1. Data.gov.il MCP Server

| Field | Value |
|-------|-------|
| **Type** | Custom / Project-owned |
| **Version** | 2.1.0 |
| **Location** | `/data-gov-il-mcp/` (sibling repo) |
| **Transport** | Stdio (`stdio.js`) or HTTP (`http.js`) |
| **API Backend** | CKAN API at `https://data.gov.il/api/3/action` |

### Purpose

Core data engine for the entire HomeAI platform. Connects to Israel's national open data portal (data.gov.il) to search, discover, and retrieve government datasets from ministries, municipalities, and regulatory bodies. All investment scores, city profiles, and neighborhood-level analytics are derived from data fetched through this server.

### Available Tools (9)

| Tool | Description |
|------|-------------|
| `list_available_tags` | Browse curated tags organized by topic/category |
| `search_tags` | Search for tags by Hebrew or English keyword |
| `find_datasets` | Advanced dataset search by keywords |
| `get_dataset_info` | Get detailed metadata about a specific dataset |
| `list_organizations` | Browse government organizations that publish data |
| `get_organization_info` | Get details about a specific organization |
| `list_all_datasets` | List all available datasets on the portal |
| `list_resources` | List resources (files/APIs) within a dataset |
| `search_records` | Extract and query actual data rows from a resource |

### Expert Analysis Prompts (3)

| Prompt | Description |
|--------|-------------|
| `food-nutrition-analysis` | Food industry and nutrition data analysis expert |
| `environmental-sustainability-analysis` | Environmental and sustainability data analysis |
| `real-estate-market-analysis` | Real estate market insights and investment analysis |

### Datasets Consumed by HomeAI

The app consumes 11 government datasets, each identified by a CKAN resource ID. These are configured in `src/config/datasets.ts`.

#### 1.1 Population Demographics

| Field | Value |
|-------|-------|
| **Key** | `population` |
| **Resource ID** | `64edd0ee-3d5d-43ce-8562-c336c24dbc1f` |
| **Source** | Central Bureau of Statistics (CBS) |
| **Description** | Population counts per city, broken down by age group and district |

**Fields consumed:**

| Hebrew Field | English Mapping | Description |
|-------------|-----------------|-------------|
| שם_ישוב | cityName | City name |
| סמל_ישוב | cityCode | Unique city identifier |
| סהכ | totalPopulation | Total population |
| גיל_0_5 | age_0_5 | Population aged 0-5 |
| גיל_6_18 | age_6_18 | Population aged 6-18 |
| גיל_19_45 | age_19_45 | Population aged 19-45 |
| גיל_46_55 | age_46_55 | Population aged 46-55 |
| גיל_56_64 | age_56_64 | Population aged 56-64 |
| גיל_65_פלוס | age_65_plus | Population aged 65+ |
| נפה | district | Administrative district |

**Scoring impact:** Feeds into Municipal Health sub-score (10% weight) and Demand Signal sub-score (young adult ratio).

#### 1.2 Urban Renewal Projects

| Field | Value |
|-------|-------|
| **Key** | `urbanRenewal` |
| **Resource ID** | `f65a0daf-f737-49c5-9424-d378d52104f5` |
| **Source** | Ministry of Housing |
| **Description** | Urban renewal (Pinui-Binui / TAMA 38) projects across Israeli cities |

**Scoring impact:** Feeds into Development Momentum sub-score (25% weight). Higher count of active renewal projects signals revitalization potential.

#### 1.3 Construction Sites

| Field | Value |
|-------|-------|
| **Key** | `constructionSites` |
| **Resource ID** | `b072e36c-a53b-49e1-be08-4a608fcf4638` |
| **Source** | Ministry of Housing |
| **Description** | Active construction sites, including housing starts and completions |

**Scoring impact:** Feeds into Development Momentum sub-score (25% weight). Active construction indicates growth and market confidence.

#### 1.4 Housing Inventory (Pipeline)

| Field | Value |
|-------|-------|
| **Key** | `housingInventory` |
| **Resource ID** | `99aad98f-2b54-4eea-834d-650b56389bf3` |
| **Source** | Ministry of Housing |
| **Description** | Planned housing units at various planning stages |

**Fields consumed:**

| Hebrew Field | English Mapping | Description |
|-------------|-----------------|-------------|
| יישוב | cityName | City name |
| סמל יישוב | cityCode | Unique city identifier |
| שלב תכנוני | planningStage | Current planning stage |
| יזם תכנון | planningInitiative | Planning initiative type |
| יחד פוטנציאל לשיווק | potentialUnits | Potential units for marketing |
| מספר תוכנית | planNumber | Plan number |
| שם תוכנית | planName | Plan name |

**Scoring impact:** Feeds into Development Momentum sub-score (25% weight). Large pipeline = future supply, signals government investment.

#### 1.5 Mechir LaMishtaken (Subsidized Housing Program)

| Field | Value |
|-------|-------|
| **Key** | `mechirLaMishtaken` |
| **Resource ID** | `7c8255d0-49ef-49db-8904-4cf917586031` |
| **Source** | Ministry of Housing |
| **Description** | Government below-market-price housing program. Includes subscriber counts, lottery winners, and average price per square meter per city |

**Scoring impact:**
- **Demand Signal** (20%): Subscriber-to-winner ratio indicates excess demand
- **Price Attractiveness** (20%): Average price per m² benchmarks affordability

#### 1.6 Public Housing

| Field | Value |
|-------|-------|
| **Key** | `publicHousing` |
| **Resource ID** | `ece87d7d-d79f-4278-8559-921218bc2b6a` |
| **Source** | Ministry of Housing |
| **Description** | Public housing stock and allocation data |

**Scoring impact:** Supplementary data for housing supply analysis.

#### 1.7 Municipal Finances

| Field | Value |
|-------|-------|
| **Key** | `municipalFinances` |
| **Resource ID** | `e5ff9ad0-6db2-4660-a94e-4499fce9475d` |
| **Source** | Ministry of Interior |
| **Description** | Municipal budget data including revenue, expenditure, and financial health indicators |

**Scoring impact:** Supplementary data for municipal health assessment.

#### 1.8 Bank Branches

| Field | Value |
|-------|-------|
| **Key** | `bankBranches` |
| **Resource ID** | `2202bada-4baf-45f5-aa61-8c5bad9646d3` |
| **Source** | Bank of Israel |
| **Description** | Bank branch locations across Israel, with geo-coordinates |

**Scoring impact:** Feeds into Infrastructure sub-score (15% weight). Bank branches per capita indicates financial services accessibility.

#### 1.9 Green Buildings

| Field | Value |
|-------|-------|
| **Key** | `greenBuildings` |
| **Resource ID** | `7f467a30-58cd-44b5-86f0-d570cc7d25ad` |
| **Source** | Ministry of Environmental Protection |
| **Description** | Certified green buildings with sustainability ratings and geo-coordinates |

**Scoring impact:** Feeds into Infrastructure sub-score (15% weight). Green building density signals modern development standards.

#### 1.10 Bus Stops

| Field | Value |
|-------|-------|
| **Key** | `busStops` |
| **Resource ID** | `e873e6a2-66c1-494f-a677-f5e77348edb0` |
| **Source** | Ministry of Transport |
| **Description** | Public transit bus stop locations with geo-coordinates |

**Scoring impact:** Feeds into Infrastructure sub-score (15% weight). Bus stops per capita indicates public transit coverage.

#### 1.11 Contaminated Land

| Field | Value |
|-------|-------|
| **Key** | `contaminatedLand` |
| **Resource ID** | `54aa9ff1-2d89-4899-bb57-bf2a749ff4b3` |
| **Source** | Ministry of Environmental Protection |
| **Description** | Contaminated land sites with pollution levels, sources, and remediation status |

**Fields consumed:**

| Hebrew Field | English Mapping | Description |
|-------------|-----------------|-------------|
| רשות מקומית | municipality | Local authority name |
| דרגת זיהום | contaminationLevel | Contamination severity |
| מקור הזיהום | contaminationSource | Source of contamination |
| שנת סיום טיפול | treatmentEndYear | Expected remediation year |

**Scoring impact:** Feeds into Environment sub-score (10% weight). Fewer contaminated sites and active remediation = higher score.

### Investment Scoring Algorithm Weights

| Sub-Score | Weight | Data Sources |
|-----------|--------|-------------|
| Development Momentum | 25% | Urban Renewal, Construction Sites, Housing Inventory |
| Demand Signal | 20% | Mechir LaMishtaken (subscriber/winner ratio), Population (young adults) |
| Price Attractiveness | 20% | Mechir LaMishtaken (price per m²) |
| Infrastructure | 15% | Bank Branches, Bus Stops, Green Buildings (all per-capita) |
| Municipal Health | 10% | Population size |
| Environment | 10% | Contaminated Land (count + remediation progress) |

### Data Pipeline Architecture

```
data.gov.il CKAN API
        |
        v
  MCP Server (search_records tool)
        |
        v
  App Aggregator (src/lib/data/aggregator.ts)
    - Fetches all 9 active datasets in parallel
    - 30-minute in-memory cache (TTL)
    - Persistent disk cache (.data-cache/raw-datasets.json)
    - Graceful failure handling per dataset
        |
        v
  City Profiles + Investment Scores
        |
        v
  Dashboard / Map / City View / Compare
```

### Configuration

```json
{
  "mcpServers": {
    "data-gov-il": {
      "command": "node",
      "args": ["/path/to/data-gov-il-mcp/stdio.js"]
    }
  }
}
```

---

## 2. Firecrawl Web Scraper

| Field | Value |
|-------|-------|
| **Type** | Third-party SaaS connector |
| **Provider** | Firecrawl |
| **Description** | Web scraping and search engine service |

### Purpose

Scrapes web pages and converts them to clean Markdown text. Capable of bypassing bot detection and CAPTCHAs. Used for research tasks, extracting supplementary data from web sources, and competitive analysis that goes beyond the structured government datasets.

### Available Tools (4)

| Tool | Description |
|------|-------------|
| `scrape_as_markdown` | Scrape a single URL and return content as Markdown |
| `scrape_batch` | Scrape multiple URLs (up to 10) in a single request |
| `search_engine` | Search the web and return results |
| `search_engine_batch` | Batch search across multiple queries |

### Data Provided

- Raw web page content converted to structured Markdown
- Search engine results (titles, URLs, snippets)
- Content from pages that require JavaScript rendering

### Business Relevance

- **Market Research**: Scrape real estate listings, news articles, and market reports
- **Competitor Analysis**: Extract data from competing investment platforms
- **Supplementary Data**: Gather information not available through government APIs (e.g., neighborhood reviews, local news)
- **Validation**: Cross-reference government data with independent sources

---

## 3. Claude Preview

| Field | Value |
|-------|-------|
| **Type** | Built-in (Claude Code) |
| **Provider** | Anthropic |
| **Description** | Development server manager and browser preview tool |

### Purpose

Manages local development servers and provides a headless browser for visual testing and debugging. Launches the Next.js dev server, takes screenshots, evaluates JavaScript in the page context, and inspects DOM elements — all without leaving the development workflow.

### Available Tools (13)

| Tool | Description |
|------|-------------|
| `preview_start` | Start a dev server from `.claude/launch.json` config |
| `preview_stop` | Stop a running dev server |
| `preview_list` | List all running dev servers |
| `preview_screenshot` | Take a JPEG screenshot of the current page |
| `preview_eval` | Execute JavaScript in the page context (debugging only) |
| `preview_click` | Click an element by CSS selector |
| `preview_fill` | Fill a form input by CSS selector |
| `preview_inspect` | Inspect CSS properties of elements |
| `preview_snapshot` | Get a DOM snapshot of the page |
| `preview_resize` | Resize viewport (mobile/tablet/desktop presets) |
| `preview_logs` | Read server-side logs |
| `preview_network` | Monitor network requests |
| `preview_console_logs` | Read browser console messages |

### Data Provided

- Visual screenshots of the running application
- DOM structure and CSS property values
- Server-side and client-side logs
- Network request/response data
- Console output for debugging

### Business Relevance

- **Development Velocity**: Instant visual feedback during UI development
- **Responsive Testing**: Verify layouts across mobile, tablet, and desktop
- **Regression Detection**: Screenshot-based verification after code changes
- **Debug Support**: Inspect runtime state, network calls, and console errors

### Configuration

Configured via `.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

---

## 4. Claude in Chrome

| Field | Value |
|-------|-------|
| **Type** | Chrome Extension |
| **Provider** | Anthropic |
| **Description** | Full browser automation via Chrome DevTools Protocol |

### Purpose

Provides complete browser automation capabilities through a Chrome extension. Can navigate pages, read accessibility trees, interact with forms, execute JavaScript, monitor network traffic, upload files, and record GIF demonstrations. Works with real Chrome browser sessions for end-to-end testing and web-based data extraction.

### Available Tools (18)

| Tool | Description |
|------|-------------|
| `computer` | Mouse/keyboard interaction: click, type, scroll, drag, screenshot, zoom |
| `navigate` | Navigate to URLs or go forward/back in history |
| `read_page` | Get accessibility tree of page elements |
| `find` | Find elements by natural language description |
| `form_input` | Set form field values by element reference |
| `javascript_tool` | Execute JavaScript in the page context |
| `get_page_text` | Extract plain text content from the page |
| `tabs_context_mcp` | Get info about the current browser tab group |
| `tabs_create_mcp` | Create a new tab in the MCP tab group |
| `read_console_messages` | Read browser console output |
| `read_network_requests` | Monitor HTTP network requests |
| `file_upload` | Upload local files to file input elements |
| `upload_image` | Upload screenshots/images to pages |
| `gif_creator` | Record and export browser sessions as animated GIFs |
| `shortcuts_list` | List available Chrome shortcuts/workflows |
| `shortcuts_execute` | Execute a Chrome shortcut or workflow |
| `resize_window` | Resize the browser window |
| `switch_browser` | Connect to a different Chrome browser instance |

### Data Provided

- Full page accessibility trees (for understanding page structure)
- Screenshots and zoomed-in regions
- Network request/response logs (XHR, Fetch, documents)
- Console messages (log, error, warn)
- Plain text extraction from web pages
- Animated GIF recordings of browser sessions

### Business Relevance

- **End-to-End Testing**: Automate user flows through the real application
- **Data Extraction**: Scrape data from web UIs that don't have APIs
- **Demo Creation**: Record GIF walkthroughs for stakeholder presentations
- **Cross-Browser Debugging**: Inspect real Chrome behavior including network and console

---

## 5. MCP Registry

| Field | Value |
|-------|-------|
| **Type** | Built-in (Claude Code) |
| **Provider** | Anthropic |
| **Description** | Discovery and connection service for MCP server connectors |

### Purpose

A meta-service that helps discover and connect additional MCP servers on demand. When the user needs to interact with an external app or service (e.g., Asana, Jira, Slack, Google Calendar), this server searches a registry of available connectors and presents connection options.

### Available Tools (2)

| Tool | Description |
|------|-------------|
| `search_mcp_registry` | Search for available connectors by keywords |
| `suggest_connectors` | Display connector suggestions with "Connect" buttons to the user |

### Data Provided

- Catalog of available MCP server connectors
- Connection status (connected/not connected) for each connector
- UUIDs for connecting to specific services

### Business Relevance

- **Extensibility**: Discover and add new integrations without manual configuration
- **Workflow Integration**: Connect to project management tools (Asana, Jira), communication platforms (Slack, Gmail), or cloud services (Google Drive, Notion)
- **On-Demand Expansion**: Only connect services when actually needed, keeping the system lean

---

## 6. Scheduled Tasks

| Field | Value |
|-------|-------|
| **Type** | Built-in (Claude Code) |
| **Provider** | Anthropic |
| **Description** | Task scheduling and automation service |

### Purpose

Creates and manages automated tasks that run on recurring schedules, at specific times, or on-demand. Each task is stored as a skill file and executes in its own session. Supports cron expressions for recurring tasks and ISO 8601 timestamps for one-time tasks.

### Available Tools (3)

| Tool | Description |
|------|-------------|
| `create_scheduled_task` | Create a new scheduled task (recurring, one-time, or manual) |
| `list_scheduled_tasks` | List all tasks with their state, schedule, and next/last run times |
| `update_scheduled_task` | Update schedule, prompt, or enabled state of an existing task |

### Data Provided

- Task inventory with IDs, descriptions, and schedules
- Execution history (last run timestamp)
- Next scheduled run timestamp
- Cron expressions and one-time fire-at timestamps

### Business Relevance

- **Data Refresh Automation**: Schedule periodic re-fetching of government datasets to keep investment scores current
- **Monitoring**: Set up alerts for dataset availability issues (e.g., CKAN 503 errors)
- **Reporting**: Generate periodic investment analysis reports
- **Maintenance**: Automate cache clearing, data validation, or health checks

### Configuration

Tasks are stored in `~/.claude/scheduled-tasks/{taskId}/SKILL.md`. Cron expressions use local timezone (not UTC).

Example — daily data refresh at 6 AM:
```
cronExpression: "0 6 * * *"
```

---

## Summary Matrix

| Server | Category | Tools | Primary Use Case |
|--------|----------|-------|-------------------|
| Data.gov.il MCP | Data | 9 tools + 3 prompts | Government data ingestion (core) |
| Firecrawl | Data | 4 tools | Web scraping and search |
| Claude Preview | DevOps | 13 tools | Dev server + visual testing |
| Claude in Chrome | DevOps | 18 tools | Browser automation + E2E testing |
| MCP Registry | Platform | 2 tools | Connector discovery |
| Scheduled Tasks | Platform | 3 tools | Task automation |
