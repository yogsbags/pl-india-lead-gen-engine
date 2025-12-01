#!/usr/bin/env python3
"""
PL Capital Partner Profile Enhancement Script
Adds client category and asset allocation analysis to partner profiling
"""

import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ==================== CONFIG ====================
CLIENT_CSV_PATH = '/Users/yogs87/Downloads/PL/cldetailnew_1.csv'
PARTNER_XLSX_PATH = '/Users/yogs87/Downloads/PL/ppdata.xlsx'
OUTPUT_MD_PATH = '/Users/yogs87/Downloads/sanity/projects/lead-generation/PL_CAPITAL_PARTNER_PROFILE.md'

# ==================== HELPER FUNCTIONS ====================
def clean_numeric(series):
    """Clean quoted numeric values and convert to float"""
    return pd.to_numeric(
        series.astype(str).str.replace('"', '').str.replace(',', '').str.strip(),
        errors='coerce'
    ).fillna(0)

def format_currency(amount):
    """Format currency in Indian Crore notation"""
    if pd.isna(amount) or amount == 0:
        return "₹0"

    crore = amount / 10000000
    if crore >= 1000:
        return f"₹{crore:,.0f} Cr"
    elif crore >= 1:
        return f"₹{crore:,.2f} Cr"
    elif amount >= 100000:
        return f"₹{amount/100000:.2f} L"
    else:
        return f"₹{amount:,.0f}"

# ==================== LOAD DATA ====================
print("Loading client data...")
# Try multiple encodings
encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
df_clients = None

for encoding in encodings:
    try:
        df_clients = pd.read_csv(CLIENT_CSV_PATH, encoding=encoding, low_memory=False)
        print(f"✓ Client data loaded successfully with {encoding} encoding")
        break
    except UnicodeDecodeError:
        continue

if df_clients is None:
    raise ValueError("Failed to load CSV with any encoding")

print(f"✓ Loaded {len(df_clients):,} client records")

# Clean client data
print("Cleaning client data...")
df_clients['BRCODE'] = df_clients['BRCODE'].astype(str).str.strip()
df_clients['CUCCCLIENTCATEGORY'] = df_clients['CUCCCLIENTCATEGORY'].astype(str).str.strip()
df_clients['TOTALHOLDING'] = clean_numeric(df_clients['TOTALHOLDING'])
df_clients['EQUITYHOLD'] = clean_numeric(df_clients['NVL(EQUITYHOLD,0)'])
df_clients['MF_BOND'] = clean_numeric(df_clients['MF_BOND'])
df_clients['TOTALBRKG'] = clean_numeric(df_clients['TOTALBRKG'])

# Filter out invalid categories
df_clients = df_clients[df_clients['CUCCCLIENTCATEGORY'] != 'nan'].copy()

print(f"✓ {len(df_clients):,} clients with valid category data")

# Load partner data
print("Loading partner data...")
df_partners = pd.read_excel(PARTNER_XLSX_PATH)
print(f"✓ Loaded {len(df_partners):,} partner records")

df_partners['BRCODE'] = df_partners['BRCODE'].astype(str).str.strip()

# ==================== AGGREGATE CLIENT DATA BY PARTNER ====================
print("\nAggregating client data by partner...")

# Client category distribution by partner
client_category_by_partner = df_clients.groupby(['BRCODE', 'CUCCCLIENTCATEGORY']).agg({
    'OOWNCODE': 'count',
    'TOTALHOLDING': 'sum',
    'TOTALBRKG': 'sum',
    'EQUITYHOLD': 'sum',
    'MF_BOND': 'sum'
}).reset_index()
client_category_by_partner.columns = ['BRCODE', 'CATEGORY', 'CLIENT_COUNT', 'TOTAL_HOLDINGS', 'TOTAL_BRKG', 'EQUITY', 'MF_BOND']

# Overall client metrics by partner
partner_client_metrics = df_clients.groupby('BRCODE').agg({
    'OOWNCODE': 'count',
    'TOTALHOLDING': ['sum', 'mean'],
    'TOTALBRKG': 'sum',
    'EQUITYHOLD': 'sum',
    'MF_BOND': 'sum'
}).reset_index()
partner_client_metrics.columns = ['BRCODE', 'CLIENT_COUNT', 'TOTAL_HOLDINGS', 'AVG_HOLDINGS', 'TOTAL_BRKG', 'TOTAL_EQUITY', 'TOTAL_MF_BOND']

# Calculate asset allocation percentages
partner_client_metrics['EQUITY_PCT'] = (
    (partner_client_metrics['TOTAL_EQUITY'] / partner_client_metrics['TOTAL_HOLDINGS']) * 100
).fillna(0).replace([np.inf, -np.inf], 0)
partner_client_metrics['MF_BOND_PCT'] = (
    (partner_client_metrics['TOTAL_MF_BOND'] / partner_client_metrics['TOTAL_HOLDINGS']) * 100
).fillna(0).replace([np.inf, -np.inf], 0)

# Merge with partner data
df_partners_enhanced = df_partners.merge(partner_client_metrics, on='BRCODE', how='left')

# Create partner size segments
df_partners_enhanced['PARTNER_SEGMENT'] = pd.cut(
    df_partners_enhanced['NOOFCLIENTS'],
    bins=[0, 10, 50, 200, 500, float('inf')],
    labels=['Micro (<10)', 'Small (10-50)', 'Medium (50-200)', 'Large (200-500)', 'Mega (500+)']
)

print(f"✓ Aggregated data for {len(df_partners_enhanced):,} partners")

# ==================== ANALYSIS & INSIGHTS ====================

# Top partners by client category diversity
category_counts = client_category_by_partner.groupby('BRCODE')['CATEGORY'].count().reset_index()
category_counts.columns = ['BRCODE', 'CATEGORY_DIVERSITY']
df_partners_enhanced = df_partners_enhanced.merge(category_counts, on='BRCODE', how='left')
df_partners_enhanced['CATEGORY_DIVERSITY'] = df_partners_enhanced['CATEGORY_DIVERSITY'].fillna(0)

# Asset allocation specialists
df_partners_enhanced['PORTFOLIO_TYPE'] = pd.cut(
    df_partners_enhanced['EQUITY_PCT'],
    bins=[0, 70, 90, 95, 100],
    labels=['Conservative (<70% Equity)', 'Balanced (70-90%)', 'Growth (90-95%)', 'Aggressive (95%+)']
)

# ==================== GENERATE ENHANCED MARKDOWN ====================
print("\nGenerating enhanced partner profile markdown...")

md = f"""# 🤝 PL CAPITAL - ENHANCED PARTNER PROFILE ANALYSIS

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Data Source**: ppdata.xlsx + cldetailnew_1.csv
**Total Partners**: {len(df_partners_enhanced):,}
**Total Clients Analyzed**: {df_clients['OOWNCODE'].nunique():,}

---

## 📊 EXECUTIVE SUMMARY

### Partner Base Overview
"""

# Overall stats
total_clients_mapped = df_partners_enhanced['CLIENT_COUNT'].sum()
total_holdings_mapped = df_partners_enhanced['TOTAL_HOLDINGS'].sum()
total_equity = df_partners_enhanced['TOTAL_EQUITY'].sum()
total_mf_bond = df_partners_enhanced['TOTAL_MF_BOND'].sum()
avg_equity_pct = df_partners_enhanced['EQUITY_PCT'].mean()

md += f"""
- **Total Partners with Client Data**: {df_partners_enhanced['CLIENT_COUNT'].notna().sum():,}
- **Total Clients Mapped**: {total_clients_mapped:,.0f}
- **Total AUM (Mapped)**: {format_currency(total_holdings_mapped)}
- **Total Equity Holdings**: {format_currency(total_equity)} ({(total_equity/total_holdings_mapped*100):.1f}%)
- **Total MF+Bond Holdings**: {format_currency(total_mf_bond)} ({(total_mf_bond/total_holdings_mapped*100):.1f}%)
- **Average Partner Equity Allocation**: {avg_equity_pct:.1f}%

### Partner Segmentation
"""

segment_stats = df_partners_enhanced.groupby('PARTNER_SEGMENT', observed=True).agg({
    'BRCODE': 'count',
    'CLIENT_COUNT': 'sum',
    'TOTAL_HOLDINGS': 'sum',
    'EQUITY_PCT': 'mean'
}).round(1)

md += "\n| Segment | Partner Count | Total Clients | Total AUM | Avg Equity % |\n"
md += "|---------|---------------|---------------|-----------|---------------|\n"

for segment, row in segment_stats.iterrows():
    count = int(row['BRCODE'])
    clients = int(row['CLIENT_COUNT']) if not pd.isna(row['CLIENT_COUNT']) else 0
    holdings = row['TOTAL_HOLDINGS']
    equity_pct = row['EQUITY_PCT']
    md += f"| **{segment}** | {count:,} | {clients:,} | {format_currency(holdings)} | {equity_pct:.1f}% |\n"

# ==================== CLIENT CATEGORY ANALYSIS ====================
md += "\n---\n\n## 🏷️ CLIENT CATEGORY DISTRIBUTION BY PARTNER\n\n"

# Overall category distribution
overall_category = client_category_by_partner.groupby('CATEGORY').agg({
    'CLIENT_COUNT': 'sum',
    'TOTAL_HOLDINGS': 'sum',
    'EQUITY': 'sum',
    'MF_BOND': 'sum'
}).sort_values('TOTAL_HOLDINGS', ascending=False)

md += "### Overall Client Category Breakdown\n\n"
md += "| Category | Client Count | % of Base | Total Holdings | Equity | MF+Bond | Equity % |\n"
md += "|----------|--------------|-----------|----------------|--------|---------|----------|\n"

total_categorized = overall_category['CLIENT_COUNT'].sum()
for category, row in overall_category.iterrows():
    count = int(row['CLIENT_COUNT'])
    pct = count / total_categorized * 100
    holdings = row['TOTAL_HOLDINGS']
    equity = row['EQUITY']
    mf_bond = row['MF_BOND']
    equity_pct = (equity / holdings * 100) if holdings > 0 else 0

    md += f"| **{category}** | {count:,} | {pct:.1f}% | {format_currency(holdings)} | {format_currency(equity)} | {format_currency(mf_bond)} | {equity_pct:.1f}% |\n"

# Top partners by category diversity
md += "\n### Top Partners by Client Category Diversity\n\n"
md += "Partners with the most diverse client base across categories:\n\n"
md += "| Rank | BRCODE | State | Total Clients | Categories | Total Holdings | Equity % |\n"
md += "|------|--------|-------|---------------|------------|----------------|-----------|\n"

top_diverse = df_partners_enhanced.nlargest(20, 'CATEGORY_DIVERSITY')[
    ['BRCODE', 'STATE', 'NOOFCLIENTS', 'CATEGORY_DIVERSITY', 'TOTALHOLDING', 'EQUITY_PCT']
]

for idx, (_, row) in enumerate(top_diverse.iterrows(), 1):
    brcode = row['BRCODE']
    state = row['STATE']
    clients = int(row['NOOFCLIENTS'])
    categories = int(row['CATEGORY_DIVERSITY'])
    holdings = row['TOTALHOLDING']
    equity_pct = row['EQUITY_PCT']

    md += f"| {idx} | {brcode} | {state} | {clients:,} | {categories} | {format_currency(holdings)} | {equity_pct:.1f}% |\n"

# ==================== ASSET ALLOCATION PATTERNS ====================
md += "\n---\n\n## 📈 PARTNER ASSET ALLOCATION PATTERNS\n\n"

# Distribution by portfolio type
portfolio_dist = df_partners_enhanced.groupby('PORTFOLIO_TYPE', observed=True).agg({
    'BRCODE': 'count',
    'CLIENT_COUNT': 'sum',
    'TOTAL_HOLDINGS': 'sum',
    'EQUITY_PCT': 'mean'
}).round(1)

md += "### Partner Distribution by Portfolio Risk Profile\n\n"
md += "| Portfolio Type | Partner Count | Total Clients | Total AUM | Avg Equity % |\n"
md += "|----------------|---------------|---------------|-----------|---------------|\n"

for portfolio_type, row in portfolio_dist.iterrows():
    count = int(row['BRCODE'])
    clients = int(row['CLIENT_COUNT']) if not pd.isna(row['CLIENT_COUNT']) else 0
    holdings = row['TOTAL_HOLDINGS']
    equity_pct = row['EQUITY_PCT']

    md += f"| **{portfolio_type}** | {count:,} | {clients:,} | {format_currency(holdings)} | {equity_pct:.1f}% |\n"

# Top partners by equity allocation
md += "\n### Top 20 Aggressive Partners (Highest Equity %)\n\n"
md += "| Rank | BRCODE | State | Clients | Total Holdings | Equity % | Equity Value | MF+Bond Value |\n"
md += "|------|--------|-------|---------|----------------|----------|--------------|---------------|\n"

top_equity = df_partners_enhanced.nlargest(20, 'EQUITY_PCT')[
    ['BRCODE', 'STATE', 'NOOFCLIENTS', 'TOTAL_HOLDINGS', 'EQUITY_PCT', 'TOTAL_EQUITY', 'TOTAL_MF_BOND']
]

for idx, (_, row) in enumerate(top_equity.iterrows(), 1):
    brcode = row['BRCODE']
    state = row['STATE']
    clients = int(row['NOOFCLIENTS'])
    holdings = row['TOTAL_HOLDINGS']
    equity_pct = row['EQUITY_PCT']
    equity_val = row['TOTAL_EQUITY']
    mf_bond_val = row['TOTAL_MF_BOND']

    md += f"| {idx} | {brcode} | {state} | {clients:,} | {format_currency(holdings)} | {equity_pct:.1f}% | {format_currency(equity_val)} | {format_currency(mf_bond_val)} |\n"

# Top partners by conservative allocation
md += "\n### Top 20 Conservative Partners (Highest MF+Bond %)\n\n"
md += "| Rank | BRCODE | State | Clients | Total Holdings | MF+Bond % | MF+Bond Value | Equity Value |\n"
md += "|------|--------|-------|---------|----------------|-----------|---------------|---------------|\n"

top_conservative = df_partners_enhanced.nlargest(20, 'MF_BOND_PCT')[
    ['BRCODE', 'STATE', 'NOOFCLIENTS', 'TOTAL_HOLDINGS', 'MF_BOND_PCT', 'TOTAL_MF_BOND', 'TOTAL_EQUITY']
]

for idx, (_, row) in enumerate(top_conservative.iterrows(), 1):
    brcode = row['BRCODE']
    state = row['STATE']
    clients = int(row['NOOFCLIENTS'])
    holdings = row['TOTAL_HOLDINGS']
    mf_bond_pct = row['MF_BOND_PCT']
    mf_bond_val = row['TOTAL_MF_BOND']
    equity_val = row['TOTAL_EQUITY']

    md += f"| {idx} | {brcode} | {state} | {clients:,} | {format_currency(holdings)} | {mf_bond_pct:.1f}% | {format_currency(mf_bond_val)} | {format_currency(equity_val)} |\n"

# ==================== ASSET ALLOCATION BY SEGMENT ====================
md += "\n### Asset Allocation by Partner Segment\n\n"
md += "| Segment | Avg Equity % | Avg MF+Bond % | Total Equity | Total MF+Bond |\n"
md += "|---------|--------------|---------------|--------------|---------------|\n"

segment_allocation = df_partners_enhanced.groupby('PARTNER_SEGMENT', observed=True).agg({
    'EQUITY_PCT': 'mean',
    'MF_BOND_PCT': 'mean',
    'TOTAL_EQUITY': 'sum',
    'TOTAL_MF_BOND': 'sum'
}).round(1)

for segment, row in segment_allocation.iterrows():
    equity_pct = row['EQUITY_PCT']
    mf_bond_pct = row['MF_BOND_PCT']
    equity_total = row['TOTAL_EQUITY']
    mf_bond_total = row['TOTAL_MF_BOND']

    md += f"| **{segment}** | {equity_pct:.1f}% | {mf_bond_pct:.1f}% | {format_currency(equity_total)} | {format_currency(mf_bond_total)} |\n"

# ==================== CATEGORY SPECIALIZATION ====================
md += "\n---\n\n## 🎯 PARTNER SPECIALIZATION ANALYSIS\n\n"

# Find partners specializing in each category
md += "### Partners by Dominant Client Category\n\n"

for category in overall_category.index[:5]:  # Top 5 categories
    # Get partners where this category represents >50% of clients
    category_partners = []

    for brcode in df_partners_enhanced['BRCODE']:
        partner_categories = client_category_by_partner[client_category_by_partner['BRCODE'] == brcode]
        if len(partner_categories) > 0:
            total_clients = partner_categories['CLIENT_COUNT'].sum()
            category_clients = partner_categories[partner_categories['CATEGORY'] == category]['CLIENT_COUNT'].sum()

            if category_clients / total_clients > 0.5:
                partner_data = df_partners_enhanced[df_partners_enhanced['BRCODE'] == brcode].iloc[0]
                category_partners.append({
                    'BRCODE': brcode,
                    'STATE': partner_data['STATE'],
                    'TOTAL_CLIENTS': total_clients,
                    'CATEGORY_CLIENTS': category_clients,
                    'CATEGORY_PCT': (category_clients / total_clients * 100),
                    'TOTAL_HOLDINGS': partner_data['TOTALHOLDING']
                })

    if len(category_partners) > 0:
        md += f"\n#### {category} Specialists ({len(category_partners)} partners)\n\n"
        md += "| BRCODE | State | Total Clients | {category} Clients | % {category} | Total Holdings |\n"
        md += "|--------|-------|---------------|-------------------|-------------|----------------|\n"

        # Sort by category percentage
        category_partners.sort(key=lambda x: x['CATEGORY_PCT'], reverse=True)

        for partner in category_partners[:10]:  # Top 10
            md += f"| {partner['BRCODE']} | {partner['STATE']} | {partner['TOTAL_CLIENTS']:,.0f} | {partner['CATEGORY_CLIENTS']:,.0f} | {partner['CATEGORY_PCT']:.1f}% | {format_currency(partner['TOTAL_HOLDINGS'])} |\n"

# ==================== STRATEGIC INSIGHTS ====================
md += "\n---\n\n## 💡 STRATEGIC INSIGHTS & RECOMMENDATIONS\n\n"

md += "### 1. Portfolio Risk Profile\n\n"
aggressive_count = len(df_partners_enhanced[df_partners_enhanced['EQUITY_PCT'] >= 95])
conservative_count = len(df_partners_enhanced[df_partners_enhanced['MF_BOND_PCT'] >= 30])

md += f"- **{aggressive_count:,} partners ({aggressive_count/len(df_partners_enhanced)*100:.1f}%)** maintain aggressive equity-heavy portfolios (≥95% equity)\n"
md += f"- **{conservative_count:,} partners ({conservative_count/len(df_partners_enhanced)*100:.1f}%)** have significant debt/MF exposure (≥30% MF+Bond)\n"
md += f"- Average partner equity allocation is **{avg_equity_pct:.1f}%**, indicating overall aggressive risk appetite\n"
md += "- **Recommendation**: Provide risk management training and balanced portfolio strategies for aggressive partners\n\n"

md += "### 2. Client Category Concentration\n\n"
diverse_partners = len(df_partners_enhanced[df_partners_enhanced['CATEGORY_DIVERSITY'] >= 4])
md += f"- **{diverse_partners:,} partners ({diverse_partners/len(df_partners_enhanced)*100:.1f}%)** serve 4+ client categories (high diversity)\n"
md += f"- Most partners are heavily concentrated in **{overall_category.index[0]}** category ({overall_category.iloc[0]['CLIENT_COUNT']/total_categorized*100:.1f}% of all clients)\n"
md += "- **Recommendation**: Create category-specific marketing collateral and training programs for specialized partners\n\n"

md += "### 3. Partner Segment Patterns\n\n"
mega_partners = df_partners_enhanced[df_partners_enhanced['PARTNER_SEGMENT'] == 'Mega (500+)']
if len(mega_partners) > 0:
    mega_avg_equity = mega_partners['EQUITY_PCT'].mean()
    md += f"- Mega partners (500+ clients) maintain **{mega_avg_equity:.1f}%** average equity allocation\n"

micro_partners = df_partners_enhanced[df_partners_enhanced['PARTNER_SEGMENT'] == 'Micro (<10)']
if len(micro_partners) > 0:
    micro_avg_equity = micro_partners['EQUITY_PCT'].mean()
    md += f"- Micro partners (<10 clients) maintain **{micro_avg_equity:.1f}%** average equity allocation\n"

md += "- **Recommendation**: Scale best practices from high-performing segments to emerging partners\n\n"

md += "### 4. Geographic Patterns\n\n"
state_stats = df_partners_enhanced.groupby('STATE').agg({
    'BRCODE': 'count',
    'EQUITY_PCT': 'mean',
    'TOTAL_HOLDINGS': 'sum'
}).sort_values('TOTAL_HOLDINGS', ascending=False).head(5)

md += "Top 5 states by AUM:\n\n"
for state, row in state_stats.iterrows():
    count = int(row['BRCODE'])
    avg_equity = row['EQUITY_PCT']
    holdings = row['TOTAL_HOLDINGS']
    md += f"- **{state}**: {count} partners, {format_currency(holdings)} AUM, {avg_equity:.1f}% avg equity\n"

md += "\n---\n\n"
md += f"**Report Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n"
md += "**Analysis Tool**: analyze_partners_enhanced.py  \n"

# ==================== SAVE OUTPUT ====================
print(f"\nSaving enhanced partner profile to: {OUTPUT_MD_PATH}")

with open(OUTPUT_MD_PATH, 'w', encoding='utf-8') as f:
    f.write(md)

print(f"✓ Saved {len(md)} characters ({len(md.splitlines())} lines)")
print("\n" + "="*60)
print("ENHANCEMENT COMPLETE!")
print("="*60)
print(f"\nOutput file: {OUTPUT_MD_PATH}")
print(f"Partners analyzed: {len(df_partners_enhanced):,}")
print(f"Clients mapped: {total_clients_mapped:,.0f}")
print(f"Total AUM: {format_currency(total_holdings_mapped)}")
print(f"Average equity allocation: {avg_equity_pct:.1f}%")
