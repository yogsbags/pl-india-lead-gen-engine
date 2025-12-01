# Apollo API Email Enrichment - Complete Field Reference

**Generated:** 2025-11-25T13:55:05.140Z

This document lists all available fields when enriching an email address via Apollo API.

---

## 👤 Person Fields

Fields directly under the `person` object:

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `city` | string | City location | "Mumbai" |
| `country` | string | Country | "India" |
| `departments` | array | Departments | [0 items] |
| `email` | string | Primary work email | "subendu22@gmail.com" |
| `email_domain_catchall` | boolean | Field description | false |
| `email_status` | object | Email verification status | null |
| `employment_history` | array | Array of past positions | [5 items] |
| `extrapolated_email_confidence` | object | Field description | null |
| `facebook_url` | object | Facebook profile URL | null |
| `first_name` | string | First name | "Subendu" |
| `formatted_address` | string | Field description | "Mumbai, Maharashtra, India" |
| `functions` | array | Job functions/roles | [1 items] |
| `github_url` | object | GitHub profile URL | null |
| `headline` | string | LinkedIn headline | "Sr. Manager - Digital Business" |
| `id` | string | Unique Apollo person ID | "6925b538a3b9400015260b46" |
| `intent_strength` | object | Field description | null |
| `last_name` | string | Last name | "Maity" |
| `linkedin_url` | object | LinkedIn profile URL | null |
| `name` | string | Full name | "Subendu Maity" |
| `organization` | object | Company/organization details | {...} |
| `organization_id` | string | Field description | "5f480464eaad6d000120e036" |
| `photo_url` | string | Profile photo URL | "https://media.licdn.com/dms..." |
| `postal_code` | object | Field description | null |
| `revealed_for_current_team` | boolean | Field description | true |
| `seniority` | string | Job seniority level | "manager" |
| `show_intent` | boolean | Field description | false |
| `state` | string | State/province | "Maharashtra" |
| `street_address` | string | Field description | "" |
| `subdepartments` | array | Field description | [0 items] |
| `time_zone` | string | Field description | "Asia/Kolkata" |
| `title` | string | Current job title | "Senior Manager Digital Busi..." |
| `twitter_url` | object | Twitter profile URL | null |

## 🏢 Organization Fields

Fields under `person.organization`:

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `alexa_ranking` | object | Organization field | null |
| `angellist_url` | object | Organization field | null |
| `blog_url` | object | Organization field | null |
| `city` | string | HQ city | "Mumbai" |
| `country` | string | HQ country | "India" |
| `crunchbase_url` | object | Organization field | null |
| `current_technologies` | array | Organization field | [6 items] |
| `estimated_num_employees` | number | Employee count estimate | 310 |
| `facebook_url` | object | Organization field | null |
| `founded_year` | number | Year founded | 2017 |
| `funding_events` | array | Organization field | [1 items] |
| `id` | string | Unique Apollo organization ID | "5f480464eaad6d000120e036" |
| `industries` | array | Organization field | [1 items] |
| `industry` | string | Industry classification | "financial services" |
| `industry_tag_hash` | object | Organization field | {...} |
| `industry_tag_id` | string | Organization field | "5567cdd67369643e64020000" |
| `keywords` | array | Industry keywords/tags | [12 items] |
| `languages` | array | Organization field | [1 items] |
| `latest_funding_round_date` | string | Organization field | "2017-06-27T00:00:00.000+00:00" |
| `latest_funding_stage` | string | Organization field | "Other" |
| `linkedin_uid` | string | Organization field | "14466811" |
| `linkedin_url` | string | Company LinkedIn page | "http://www.linkedin.com/com..." |
| `logo_url` | string | Company logo URL | "https://zenprospect-product..." |
| `name` | string | Company name | "Mirae Asset Capital Markets..." |
| `num_suborganizations` | number | Organization field | 0 |
| `org_chart_removed` | object | Organization field | null |
| `org_chart_root_people_ids` | array | Organization field | [0 items] |
| `org_chart_sector` | string | Organization field | "OrgChart::SectorHierarchy::..." |
| `org_chart_show_department_filter` | object | Organization field | null |
| `organization_headcount_six_month_growth` | object | Organization field | null |
| `organization_headcount_twelve_month_growth` | object | Organization field | null |
| `organization_headcount_twenty_four_month_growth` | object | Organization field | null |
| `organization_revenue` | number | Organization field | 0 |
| `organization_revenue_printed` | object | Organization field | null |
| `owned_by_organization_id` | object | Organization field | null |
| `phone` | string | Company phone number | "+1 800-210-0818" |
| `postal_code` | string | Organization field | "400070" |
| `primary_domain` | object | Primary domain name | null |
| `primary_phone` | object | Organization field | {...} |
| `publicly_traded_exchange` | object | Organization field | null |
| `publicly_traded_symbol` | object | Stock ticker symbol | null |
| `raw_address` | string | Organization field | "Mirae Asset Capital Markets..." |
| `retail_location_count` | number | Organization field | 0 |
| `sanitized_phone` | string | Organization field | "+18002100818" |
| `secondary_industries` | array | Organization field | [0 items] |
| `short_description` | string | Organization field | "Mirae Asset Capital Markets..." |
| `snippets_loaded` | boolean | Organization field | true |
| `state` | string | HQ state | "Maharashtra" |
| `street_address` | string | Organization field | "Ingalwadi Lane" |
| `suborganizations` | array | Organization field | [0 items] |
| `technology_names` | array | Organization field | [6 items] |
| `total_funding` | number | Organization field | 441147928 |
| `total_funding_printed` | string | Organization field | "441.1M" |
| `twitter_url` | object | Organization field | null |
| `website_url` | object | Company website | null |

## 💼 Employment History Fields

Fields in `person.employment_history[]` array (one entry per job):

| Field Name | Type | Description | Example Value |
|------------|------|-------------|---------------|
| `_id` | string | Employment field | "691e47d5cf0400000117095e" |
| `created_at` | object | Record created timestamp | null |
| `current` | boolean | Is this current position? | true |
| `degree` | object | Degree if applicable | null |
| `description` | object | Position description | null |
| `emails` | object | Emails used at this position | null |
| `end_date` | object | End date | null |
| `grade_level` | object | Grade/level | null |
| `id` | string | Employment field | "691e47d5cf0400000117095e" |
| `key` | string | Employment field | "691e47d5cf0400000117095e" |
| `kind` | object | Type (education/employment) | null |
| `major` | object | Major/specialization | null |
| `org_matched_by_name` | boolean | Employment field | false |
| `organization_id` | string | Apollo org ID | "5f480464eaad6d000120e036" |
| `organization_name` | string | Company name | "Mirae Asset Capital Markets..." |
| `raw_address` | object | Office address | null |
| `start_date` | string | Start date | "2023-02-01" |
| `title` | string | Job title | "Senior Manager Digital Busi..." |
| `updated_at` | object | Last updated timestamp | null |

## 📊 Field Categories

### Contact Information
- `email`, `personal_emails`, `work_email`
- `phone_numbers` (requires webhook)
- `city`, `state`, `country`

### Professional Details
- `title`, `headline`, `seniority`
- `functions`, `departments`
- `organization` (company details)

### Social & Web Presence
- `linkedin_url`, `twitter_url`, `facebook_url`
- `github_url`, `personal_website`

### Career History
- `employment_history[]` (array of past positions)
- `education[]` (array of degrees)

### Apollo Metadata
- `id` (Apollo person ID)
- `organization.id` (Apollo org ID)
- `contact_accuracy_score`
- `reveal_personal_emails` (boolean flag)


---

## Usage Example

```javascript
const apollo = new ApolloAPI(apiKey);
const enriched = await apollo.enrichPerson({
  email: "person@company.com",
  reveal_personal_emails: false
});

console.log(enriched.person.first_name);
console.log(enriched.person.title);
console.log(enriched.person.organization.name);
```

## Notes

- **Phone Numbers**: Requires `reveal_phone_number: true` and `webhook_url` parameter
- **Personal Emails**: Requires `reveal_personal_emails: true` (costs credits)
- **Rate Limits**: ~2 requests/second (10,000/hour)
- **Null Values**: Many fields may be `null` if data not available

