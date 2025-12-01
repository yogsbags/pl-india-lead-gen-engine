#!/usr/bin/env python3
"""
PL Capital Client Profile Analysis - Updated Dataset
Analyzes comprehensive client data including demographics, financial metrics, and activity patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path

# Configuration
CSV_PATH = '/Users/yogs87/Downloads/PL/cldetailnew_1.csv'
OUTPUT_PATH = '/Users/yogs87/Downloads/sanity/projects/lead-generation/PL_CAPITAL_CLIENT_PROFILE_UPDATED.md'

def clean_numeric(series):
    """Clean numeric columns by removing quotes and converting to float"""
    return pd.to_numeric(series.astype(str).str.replace('"', '').str.replace(',', ''), errors='coerce').fillna(0)

def parse_date(series):
    """Parse date strings to datetime"""
    return pd.to_datetime(series, errors='coerce')

def format_currency(value):
    """Format number as Indian currency (Crores/Lakhs)"""
    if value >= 1e7:  # >= 1 crore
        return f"₹{value/1e7:.2f} Cr"
    elif value >= 1e5:  # >= 1 lakh
        return f"₹{value/1e5:.2f} L"
    else:
        return f"₹{value:,.0f}"

def main():
    print("Loading client data...")
    # Try different encodings to handle special characters
    encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
    df = None

    for encoding in encodings:
        try:
            print(f"Trying encoding: {encoding}")
            df = pd.read_csv(CSV_PATH, low_memory=False, encoding=encoding, on_bad_lines='skip')
            print(f"✓ Successfully loaded with {encoding} encoding")
            break
        except (UnicodeDecodeError, Exception) as e:
            print(f"✗ Failed with {encoding}: {str(e)[:50]}")
            continue

    if df is None:
        raise Exception("Could not load CSV with any encoding")

    print(f"Total records: {len(df):,}")
    print(f"Columns: {list(df.columns)}")

    # Clean numeric columns
    print("\nCleaning numeric fields...")
    df['TOTALHOLDING'] = clean_numeric(df['TOTALHOLDING'])
    df['NETWORTH'] = clean_numeric(df['NETWORTH'])
    df['TOTALBRKG'] = clean_numeric(df['TOTALBRKG'])
    df['NETTOPL'] = clean_numeric(df['NETTOPL'])
    df['AGE'] = clean_numeric(df['AGE'])

    # Clean new asset allocation columns
    df['EQUITYHOLD'] = clean_numeric(df['NVL(EQUITYHOLD,0)'])
    df['MF_BOND'] = clean_numeric(df['MF_BOND'])

    # Parse dates
    df['ACTIVATIONDATE'] = parse_date(df['ACTIVATIONDATE'])

    # Clean text columns
    df['CITY'] = df['CITY'].astype(str).str.strip()
    df['STATE'] = df['STATE'].astype(str).str.strip()
    df['COCCUPATION'] = df['COCCUPATION'].astype(str).str.strip()
    df['BRHOSB'] = df['BRHOSB'].astype(str).str.strip()
    df['CSTATUS'] = df['CSTATUS'].astype(str).str.strip().str.upper()
    df['CGENDER'] = df['CGENDER'].astype(str).str.strip().str.upper()
    df['CUCCCLIENTCATEGORY'] = df['CUCCCLIENTCATEGORY'].astype(str).str.strip()

    # Filter out invalid data
    df = df[df['TOTALHOLDING'] >= 0]

    # Create activity flag (clients with either holdings or brokerage)
    df['IS_ACTIVE'] = ((df['TOTALHOLDING'] > 0) | (df['TOTALBRKG'] > 0)).astype(int)

    print(f"Valid records after cleaning: {len(df):,}")

    # Generate analysis
    analysis = generate_analysis(df)

    # Write markdown
    print(f"\nWriting analysis to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, 'w') as f:
        f.write(analysis)

    print("✓ Analysis complete!")

def generate_analysis(df):
    """Generate comprehensive markdown analysis"""

    today = datetime.now().strftime('%Y-%m-%d')

    # Overall metrics
    total_clients = len(df)
    active_clients = df['IS_ACTIVE'].sum()
    dormant_clients = total_clients - active_clients
    total_holdings = df['TOTALHOLDING'].sum()
    total_networth = df['NETWORTH'].sum()
    total_brokerage = df['TOTALBRKG'].sum()
    total_netpl = df['NETTOPL'].sum()

    # AUM segmentation (using TOTALHOLDING as AUM proxy)
    df['AUM_SEGMENT'] = pd.cut(df['TOTALHOLDING'],
                                bins=[0, 500000, 2000000, 5500000, 10000000, 70000000, float('inf')],
                                labels=['Micro (<₹5L)', 'Small (₹5-20L)', 'Affluent (₹20-55L)',
                                       'Upper Affluent (₹55L-1Cr)', 'HNI (₹1-7Cr)', 'Ultra HNI (>₹7Cr)'])

    segment_stats = df.groupby('AUM_SEGMENT', observed=True).agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': ['sum', 'mean'],
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': 'sum'
    }).round(0)

    # Age analysis
    age_valid = df[df['AGE'] > 0].copy()
    age_bins = [0, 25, 35, 45, 55, 65, 150]
    age_labels = ['<25', '25-35', '35-45', '45-55', '55-65', '65+']
    age_valid['AGE_GROUP'] = pd.cut(age_valid['AGE'], bins=age_bins, labels=age_labels)
    age_stats = age_valid.groupby('AGE_GROUP', observed=True).agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum',
        'TOTALBRKG': 'sum'
    })

    # Gender analysis (use CGENDER)
    gender_stats = df[df['CGENDER'].isin(['M', 'F'])].groupby('CGENDER').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': ['sum', 'mean'],
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': 'sum',
        'AGE': 'mean',
        'EQUITYHOLD': ['sum', 'mean'],
        'MF_BOND': ['sum', 'mean']
    }).round(0)

    # Occupation analysis
    occupation_stats = df[df['COCCUPATION'] != 'nan'].groupby('COCCUPATION').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum',
        'TOTALBRKG': 'sum'
    }).sort_values('TOTALHOLDING', ascending=False).head(15)

    # Gender + Occupation cross-analysis (use CGENDER)
    gender_occupation_stats = df[(df['CGENDER'].isin(['M', 'F'])) & (df['COCCUPATION'] != 'nan')].groupby(['CGENDER', 'COCCUPATION']).agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum'
    }).sort_values('TOTALHOLDING', ascending=False)

    # Gender + Age cross-analysis (use CGENDER)
    gender_age_valid = df[(df['CGENDER'].isin(['M', 'F'])) & (df['AGE'] > 0)].copy()
    gender_age_valid['AGE_GROUP'] = pd.cut(gender_age_valid['AGE'], bins=age_bins, labels=age_labels)
    gender_age_stats = gender_age_valid.groupby(['CGENDER', 'AGE_GROUP'], observed=True).agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum'
    })

    # Client Category Analysis
    category_stats = df[df['CUCCCLIENTCATEGORY'] != 'nan'].groupby('CUCCCLIENTCATEGORY').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': ['sum', 'mean'],
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': 'sum',
        'EQUITYHOLD': 'sum',
        'MF_BOND': 'sum'
    }).sort_values(('TOTALHOLDING', 'sum'), ascending=False).round(0)

    # Asset Allocation Analysis
    df['EQUITY_PCT'] = ((df['EQUITYHOLD'] / df['TOTALHOLDING']) * 100).fillna(0).replace([np.inf, -np.inf], 0)
    df['MF_BOND_PCT'] = ((df['MF_BOND'] / df['TOTALHOLDING']) * 100).fillna(0).replace([np.inf, -np.inf], 0)

    # Asset allocation by segment
    asset_by_segment = df[df['TOTALHOLDING'] > 0].groupby('AUM_SEGMENT', observed=True).agg({
        'EQUITYHOLD': 'sum',
        'MF_BOND': 'sum',
        'TOTALHOLDING': 'sum',
        'EQUITY_PCT': 'mean',
        'MF_BOND_PCT': 'mean',
        'OOWNCODE': 'count'
    }).round(1)

    # Asset allocation by age
    asset_by_age = age_valid[age_valid['TOTALHOLDING'] > 0].copy()
    asset_by_age['AGE_GROUP'] = pd.cut(asset_by_age['AGE'], bins=age_bins, labels=age_labels)
    # Add percentage columns to asset_by_age
    asset_by_age['EQUITY_PCT'] = ((asset_by_age['EQUITYHOLD'] / asset_by_age['TOTALHOLDING']) * 100).fillna(0).replace([np.inf, -np.inf], 0)
    asset_by_age['MF_BOND_PCT'] = ((asset_by_age['MF_BOND'] / asset_by_age['TOTALHOLDING']) * 100).fillna(0).replace([np.inf, -np.inf], 0)
    asset_by_age_stats = asset_by_age.groupby('AGE_GROUP', observed=True).agg({
        'EQUITYHOLD': 'sum',
        'MF_BOND': 'sum',
        'TOTALHOLDING': 'sum',
        'EQUITY_PCT': 'mean',
        'MF_BOND_PCT': 'mean'
    }).round(1)

    # Geographic analysis
    state_stats = df[df['STATE'] != 'nan'].groupby('STATE').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum',
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': 'sum'
    }).sort_values('TOTALHOLDING', ascending=False).head(15)

    city_stats = df[df['CITY'] != 'nan'].groupby('CITY').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum',
        'TOTALBRKG': 'sum'
    }).sort_values('TOTALHOLDING', ascending=False).head(20)

    # Branch type analysis
    branch_stats = df[df['BRHOSB'].isin(['BR', 'SB'])].groupby('BRHOSB').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum',
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': 'sum'
    })

    # Exchange participation
    exchange_stats = df[df['EXCHANGES'].notna()].groupby('EXCHANGES').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': 'sum'
    }).sort_values('OOWNCODE', ascending=False).head(10)

    # RM Performance Analysis
    rm_stats = df[(df['RMNAME'].notna()) & (df['RMNAME'] != '')].groupby('RMNAME').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': ['sum', 'mean'],
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': ['sum', 'mean']
    }).round(0)

    # Filter RMs with at least 10 clients for meaningful metrics
    rm_stats = rm_stats[rm_stats[('OOWNCODE', 'count')] >= 10]

    # Calculate RM efficiency metrics
    rm_stats['brkg_per_client'] = rm_stats[('TOTALBRKG', 'sum')] / rm_stats[('OOWNCODE', 'count')]
    rm_stats['activation_rate'] = rm_stats[('IS_ACTIVE', 'mean')] * 100

    # Top RMs by different metrics
    top_rms_by_aum = rm_stats.sort_values(('TOTALHOLDING', 'sum'), ascending=False).head(15)
    top_rms_by_brkg = rm_stats.sort_values(('TOTALBRKG', 'sum'), ascending=False).head(15)
    top_rms_by_activation = rm_stats.sort_values('activation_rate', ascending=False).head(15)

    # City-wise detailed analysis
    city_detailed = df[df['CITY'] != 'nan'].groupby('CITY').agg({
        'OOWNCODE': 'count',
        'TOTALHOLDING': ['sum', 'mean'],
        'TOTALBRKG': 'sum',
        'IS_ACTIVE': ['sum', 'mean'],
        'AGE': 'mean'
    }).round(0)

    city_detailed['activation_rate'] = city_detailed[('IS_ACTIVE', 'mean')] * 100
    city_detailed['aum_per_client'] = city_detailed[('TOTALHOLDING', 'mean')]

    # City segmentation - what % of clients are in each AUM tier by city
    top_cities = city_stats.head(20).index.tolist()
    city_segments = {}

    for city in top_cities:
        city_df = df[df['CITY'] == city]
        city_segs = city_df.groupby('AUM_SEGMENT', observed=True).size()
        total_city = len(city_df)
        city_segments[city] = {
            'total': total_city,
            'hni_plus': int(city_segs.get('HNI (₹1-7Cr)', 0) + city_segs.get('Ultra HNI (>₹7Cr)', 0)),
            'affluent_plus': int(city_segs.get('Affluent (₹20-55L)', 0) + city_segs.get('Upper Affluent (₹55L-1Cr)', 0))
        }

    # Client Lifetime Value (CLV) Analysis
    # Assumptions:
    # - Management fee: 2% of AUM annually
    # - Avg client retention: 7 years (industry standard)
    # - Discount rate: 10% (conservative)

    df['annual_revenue'] = (df['TOTALHOLDING'] * 0.02) + df['TOTALBRKG']  # 2% mgmt fee + brokerage
    df['clv_simple'] = df['annual_revenue'] * 5  # Simple 5-year value

    # CLV by segment
    clv_by_segment = df.groupby('AUM_SEGMENT', observed=True).agg({
        'clv_simple': 'mean',
        'annual_revenue': 'mean',
        'OOWNCODE': 'count'
    }).round(0)

    # CLV by age group (younger clients = longer lifetime)
    age_valid_clv = df[df['AGE'] > 0].copy()
    age_valid_clv['AGE_GROUP'] = pd.cut(age_valid_clv['AGE'], bins=age_bins, labels=age_labels)
    clv_by_age = age_valid_clv.groupby('AGE_GROUP', observed=True).agg({
        'clv_simple': 'mean',
        'annual_revenue': 'mean',
        'OOWNCODE': 'count'
    }).round(0)

    # City potential score (combination of AUM, activation rate, growth potential)
    city_potential = city_detailed.head(30).copy()
    city_potential['potential_score'] = (
        (city_potential[('TOTALHOLDING', 'sum')] / city_potential[('TOTALHOLDING', 'sum')].max() * 40) +  # 40% weight on AUM
        (city_potential['activation_rate'] * 0.3) +  # 30% weight on activation
        (city_potential[('TOTALBRKG', 'sum')] / city_potential[('TOTALBRKG', 'sum')].max() * 30)  # 30% weight on brokerage
    ).round(1)

    city_potential_sorted = city_potential.sort_values('potential_score', ascending=False)

    # Build markdown
    md = f"""# PL Capital Client Profile Analysis - UPDATED

**Analysis Date:** {today}
**Total Clients Analyzed:** {total_clients:,}
**Data Source:** Enhanced client database (clientwisedetails.csv)

---

## ⚠️ Important Note

This is an **UPDATED ANALYSIS** based on comprehensive client data including demographics (age, occupation, marital status), financial metrics (holdings, networth, brokerage, P&L), relationship manager assignments, branch operations, exchange participation, and activation dates.

**Previous Analysis (2025-10-17):** 50,721 clients, ₹29,682 Cr AUM
**Current Analysis ({today}):** {total_clients:,} clients

---

## 📈 EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total Clients** | {total_clients:,} |
| **Active Clients** | {active_clients:,} ({active_clients/total_clients*100:.1f}%) |
| **Dormant Clients** | {dormant_clients:,} ({dormant_clients/total_clients*100:.1f}%) |
| **Total Holdings (AUM)** | {format_currency(total_holdings)} |
| **Total Networth** | {format_currency(total_networth)} |
| **Total Brokerage Generated** | {format_currency(total_brokerage)} |
| **Net P&L** | {format_currency(total_netpl)} |
| **Avg Holdings per Client** | {format_currency(total_holdings/total_clients if total_clients > 0 else 0)} |
| **Avg Brokerage per Active Client** | {format_currency(total_brokerage/active_clients if active_clients > 0 else 0)} |

---

## 🎯 KEY FINDINGS

### 1. **Client Activation Status**
- **Active Rate: {active_clients/total_clients*100:.1f}%** ({active_clients:,} clients with holdings or brokerage activity)
- **Dormant Rate: {dormant_clients/total_clients*100:.1f}%** ({dormant_clients:,} clients - major reactivation opportunity)

### 2. **AUM Concentration (Power Law Distribution)**
```
Segment breakdown shows extreme concentration in top tiers
(See detailed segmentation table below)
```

### 3. **Geographic Dominance**
- **Top State:** {state_stats.index[0] if len(state_stats) > 0 else 'N/A'} ({state_stats.iloc[0]['OOWNCODE']:,.0f} clients, {format_currency(state_stats.iloc[0]['TOTALHOLDING'])})
- **Top City:** {city_stats.index[0] if len(city_stats) > 0 else 'N/A'} ({city_stats.iloc[0]['OOWNCODE']:,.0f} clients, {format_currency(city_stats.iloc[0]['TOTALHOLDING'])})

### 4. **Demographic Insights**
- **Median Age:** {age_valid['AGE'].median():.0f} years
- **Peak Age Group:** {age_stats['OOWNCODE'].idxmax() if len(age_stats) > 0 else 'N/A'} years ({age_stats['OOWNCODE'].max():,.0f} clients)
- **Top Occupation:** {occupation_stats.index[0] if len(occupation_stats) > 0 else 'N/A'} ({format_currency(occupation_stats.iloc[0]['TOTALHOLDING'])})

---

## 📊 CLIENT SEGMENTATION BY AUM

"""

    # Add segment table
    md += "\n| Segment | Client Count | % of Base | Total Holdings | Avg Holdings | Total Brokerage | Active Clients |\n"
    md += "|---------|--------------|-----------|----------------|--------------|-----------------|----------------|\n"

    for segment in segment_stats.index:
        count = int(segment_stats.loc[segment, ('OOWNCODE', 'count')])
        pct = count / total_clients * 100
        holdings = segment_stats.loc[segment, ('TOTALHOLDING', 'sum')]
        avg_holdings = segment_stats.loc[segment, ('TOTALHOLDING', 'mean')]
        brkg = segment_stats.loc[segment, ('TOTALBRKG', 'sum')]
        active = int(segment_stats.loc[segment, ('IS_ACTIVE', 'sum')])

        md += f"| **{segment}** | {count:,} | {pct:.1f}% | {format_currency(holdings)} | {format_currency(avg_holdings)} | {format_currency(brkg)} | {active:,} |\n"

    md += "\n### AUM Concentration Analysis\n\n"

    # Calculate top percentile concentrations
    df_sorted = df.sort_values('TOTALHOLDING', ascending=False)
    top_1pct = int(total_clients * 0.01)
    top_10pct = int(total_clients * 0.10)

    top_1pct_aum = df_sorted.head(top_1pct)['TOTALHOLDING'].sum()
    top_10pct_aum = df_sorted.head(top_10pct)['TOTALHOLDING'].sum()

    md += f"- **Top 1% ({top_1pct:,} clients):** {format_currency(top_1pct_aum)} ({top_1pct_aum/total_holdings*100:.1f}% of total AUM)\n"
    md += f"- **Top 10% ({top_10pct:,} clients):** {format_currency(top_10pct_aum)} ({top_10pct_aum/total_holdings*100:.1f}% of total AUM)\n"
    md += f"- **Bottom 50%:** {format_currency(df_sorted.tail(int(total_clients*0.5))['TOTALHOLDING'].sum())} ({df_sorted.tail(int(total_clients*0.5))['TOTALHOLDING'].sum()/total_holdings*100:.1f}% of total AUM)\n\n"
    md += "**Insight:** Extreme power law distribution. Focus on top 10% for revenue maximization.\n\n"

    # Age analysis
    md += "---\n\n## 👥 DEMOGRAPHIC ANALYSIS\n\n### Age Distribution\n\n"
    md += "| Age Group | Client Count | Total Holdings | Total Brokerage | Avg Holdings |\n"
    md += "|-----------|--------------|----------------|-----------------|---------------|\n"

    for age_group in age_stats.index:
        count = int(age_stats.loc[age_group, 'OOWNCODE'])
        holdings = age_stats.loc[age_group, 'TOTALHOLDING']
        brkg = age_stats.loc[age_group, 'TOTALBRKG']
        avg = holdings / count if count > 0 else 0

        md += f"| **{age_group}** | {count:,} | {format_currency(holdings)} | {format_currency(brkg)} | {format_currency(avg)} |\n"

    md += f"\n**Key Insights:**\n"
    md += f"- **Peak AUM Age Group:** {age_stats['TOTALHOLDING'].idxmax()} years ({format_currency(age_stats['TOTALHOLDING'].max())})\n"
    md += f"- **Median Client Age:** {age_valid['AGE'].median():.0f} years\n"
    md += f"- **Age Range:** {age_valid['AGE'].min():.0f} to {age_valid['AGE'].max():.0f} years\n\n"

    # Add Gender Analysis Section
    md += "### Gender Distribution\n\n"
    md += "| Gender | Client Count | % of Base | Total Holdings | Avg Holdings | Total Brokerage | Active Clients | Avg Age |\n"
    md += "|--------|--------------|-----------|----------------|--------------|-----------------|----------------|----------|\n"

    gender_total = gender_stats[('OOWNCODE', 'count')].sum()
    for gender in gender_stats.index:
        count = int(gender_stats.loc[gender, ('OOWNCODE', 'count')])
        pct = count / gender_total * 100
        holdings = gender_stats.loc[gender, ('TOTALHOLDING', 'sum')]
        avg_holdings = gender_stats.loc[gender, ('TOTALHOLDING', 'mean')]
        brkg = gender_stats.loc[gender, ('TOTALBRKG', 'sum')]
        active = int(gender_stats.loc[gender, ('IS_ACTIVE', 'sum')])
        avg_age = gender_stats.loc[gender, ('AGE', 'mean')]

        gender_label = "Male" if gender == 'M' else "Female"
        md += f"| **{gender_label}** | {count:,} | {pct:.1f}% | {format_currency(holdings)} | {format_currency(avg_holdings)} | {format_currency(brkg)} | {active:,} | {avg_age:.0f} yrs |\n"

    md += f"\n**Key Gender Insights:**\n"
    if 'M' in gender_stats.index and 'F' in gender_stats.index:
        male_count = int(gender_stats.loc['M', ('OOWNCODE', 'count')])
        female_count = int(gender_stats.loc['F', ('OOWNCODE', 'count')])
        male_aum = gender_stats.loc['M', ('TOTALHOLDING', 'sum')]
        female_aum = gender_stats.loc['F', ('TOTALHOLDING', 'sum')]
        male_avg = gender_stats.loc['M', ('TOTALHOLDING', 'mean')]
        female_avg = gender_stats.loc['F', ('TOTALHOLDING', 'mean')]

        md += f"- **Gender Split:** {male_count/(male_count+female_count)*100:.1f}% Male, {female_count/(male_count+female_count)*100:.1f}% Female\n"
        md += f"- **AUM Split:** Males hold {male_aum/total_holdings*100:.1f}% of total AUM, Females hold {female_aum/total_holdings*100:.1f}%\n"
        md += f"- **Average Holdings:** Male {format_currency(male_avg)} vs Female {format_currency(female_avg)}\n"

        if male_avg > female_avg:
            ratio = male_avg / female_avg
            md += f"- **Gender Gap:** Male clients have {ratio:.1f}x higher average holdings\n"
        else:
            ratio = female_avg / male_avg
            md += f"- **Female Advantage:** Female clients have {ratio:.1f}x higher average holdings\n"

    md += "\n### Top Occupations by Gender\n\n"

    # Top male occupations
    male_occs = gender_occupation_stats.loc['M'].sort_values('TOTALHOLDING', ascending=False).head(5)
    md += "**Male Clients:**\n\n"
    md += "| Rank | Occupation | Client Count | Total Holdings |\n"
    md += "|------|------------|--------------|----------------|\n"
    for idx, (occ, row) in enumerate(male_occs.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']
        md += f"| {idx} | {occ} | {count:,} | {format_currency(holdings)} |\n"

    md += "\n**Female Clients:**\n\n"
    female_occs = gender_occupation_stats.loc['F'].sort_values('TOTALHOLDING', ascending=False).head(5)
    md += "| Rank | Occupation | Client Count | Total Holdings |\n"
    md += "|------|------------|--------------|----------------|\n"
    for idx, (occ, row) in enumerate(female_occs.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']
        md += f"| {idx} | {occ} | {count:,} | {format_currency(holdings)} |\n"

    md += "\n"

    # Occupation analysis
    md += "### Top Occupations by AUM\n\n"
    md += "| Rank | Occupation | Client Count | Total Holdings | Avg Holdings | Total Brokerage |\n"
    md += "|------|------------|--------------|----------------|--------------|------------------|\n"

    for idx, (occ, row) in enumerate(occupation_stats.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']
        avg = holdings / count if count > 0 else 0
        brkg = row['TOTALBRKG']

        md += f"| {idx} | {occ} | {count:,} | {format_currency(holdings)} | {format_currency(avg)} | {format_currency(brkg)} |\n"

        if idx >= 15:
            break

    # Geographic analysis
    md += "\n---\n\n## 📍 GEOGRAPHIC INTELLIGENCE\n\n### Top States by AUM\n\n"
    md += "| Rank | State | Client Count | Total Holdings | Total Brokerage | Active Clients |\n"
    md += "|------|-------|--------------|----------------|-----------------|----------------|\n"

    for idx, (state, row) in enumerate(state_stats.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']
        brkg = row['TOTALBRKG']
        active = int(row['IS_ACTIVE'])

        md += f"| {idx} | **{state}** | {count:,} | {format_currency(holdings)} | {format_currency(brkg)} | {active:,} |\n"

        if idx >= 15:
            break

    md += "\n### Top Cities by AUM\n\n"
    md += "| Rank | City | Client Count | Total Holdings | Total Brokerage | Avg Holdings |\n"
    md += "|------|------|--------------|----------------|-----------------|---------------|\n"

    for idx, (city, row) in enumerate(city_stats.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']
        brkg = row['TOTALBRKG']
        avg = holdings / count if count > 0 else 0

        md += f"| {idx} | **{city}** | {count:,} | {format_currency(holdings)} | {format_currency(brkg)} | {format_currency(avg)} |\n"

        if idx >= 20:
            break

    # Branch analysis
    md += "\n---\n\n## 🏦 BRANCH CHANNEL ANALYSIS\n\n### Service Channel Distribution\n\n"
    md += "| Channel Type | Client Count | % Distribution | Total Holdings | Total Brokerage | Active Clients |\n"
    md += "|--------------|--------------|----------------|----------------|-----------------|----------------|\n"

    for channel, row in branch_stats.iterrows():
        count = int(row['OOWNCODE'])
        pct = count / branch_stats['OOWNCODE'].sum() * 100
        holdings = row['TOTALHOLDING']
        brkg = row['TOTALBRKG']
        active = int(row['IS_ACTIVE'])
        channel_name = "Regular Branch (BR)" if channel == "BR" else "Sub-Branch (SB)"

        md += f"| **{channel_name}** | {count:,} | {pct:.1f}% | {format_currency(holdings)} | {format_currency(brkg)} | {active:,} |\n"

    # RM Performance Analysis
    md += "\n---\n\n## 👔 RELATIONSHIP MANAGER (RM) PERFORMANCE\n\n"

    md += f"**Total RMs with ≥10 Clients:** {len(rm_stats)}\n"
    md += f"**Clients Assigned to RMs:** {df[df['RMNAME'].notna()].shape[0]:,} ({df[df['RMNAME'].notna()].shape[0]/total_clients*100:.1f}%)\n"
    md += f"**Unassigned Clients:** {df[df['RMNAME'].isna()].shape[0]:,} ({df[df['RMNAME'].isna()].shape[0]/total_clients*100:.1f}%)\n\n"

    md += "### Top RMs by AUM Under Management\n\n"
    md += "| Rank | RM Name | Client Count | Total AUM | Avg AUM/Client | Total Brokerage | Activation Rate |\n"
    md += "|------|---------|--------------|-----------|----------------|-----------------|------------------|\n"

    for idx, (rm, row) in enumerate(top_rms_by_aum.iterrows(), 1):
        count = int(row[('OOWNCODE', 'count')])
        aum = row[('TOTALHOLDING', 'sum')]
        avg_aum = row[('TOTALHOLDING', 'mean')]
        brkg = row[('TOTALBRKG', 'sum')]
        activation = float(rm_stats.loc[rm, 'activation_rate'])

        md += f"| {idx} | {rm} | {count:,} | {format_currency(aum)} | {format_currency(avg_aum)} | {format_currency(brkg)} | {activation:.1f}% |\n"

        if idx >= 15:
            break

    md += "\n### Top RMs by Brokerage Generated\n\n"
    md += "| Rank | RM Name | Client Count | Total Brokerage | Avg Brkg/Client | Total AUM | Activation Rate |\n"
    md += "|------|---------|--------------|-----------------|-----------------|-----------|------------------|\n"

    for idx, (rm, row) in enumerate(top_rms_by_brkg.iterrows(), 1):
        count = int(row[('OOWNCODE', 'count')])
        brkg = row[('TOTALBRKG', 'sum')]
        brkg_per_client = float(rm_stats.loc[rm, 'brkg_per_client'])
        aum = row[('TOTALHOLDING', 'sum')]
        activation = float(rm_stats.loc[rm, 'activation_rate'])

        md += f"| {idx} | {rm} | {count:,} | {format_currency(brkg)} | {format_currency(brkg_per_client)} | {format_currency(aum)} | {activation:.1f}% |\n"

        if idx >= 15:
            break

    md += "\n### Top RMs by Client Activation Rate\n\n"
    md += "| Rank | RM Name | Client Count | Activation Rate | Total AUM | Total Brokerage |\n"
    md += "|------|---------|--------------|-----------------|-----------|------------------|\n"

    for idx, (rm, row) in enumerate(top_rms_by_activation.iterrows(), 1):
        count = int(row[('OOWNCODE', 'count')])
        activation = float(rm_stats.loc[rm, 'activation_rate'])
        aum = row[('TOTALHOLDING', 'sum')]
        brkg = row[('TOTALBRKG', 'sum')]

        md += f"| {idx} | {rm} | {count:,} | {activation:.1f}% | {format_currency(aum)} | {format_currency(brkg)} |\n"

        if idx >= 15:
            break

    md += "\n**Key RM Insights:**\n"
    md += f"- **Unassigned Opportunity:** {df[df['RMNAME'].isna()].shape[0]:,} clients without RM assignment (73.7%)\n"
    md += f"- **Top RM Manages:** {int(top_rms_by_aum.iloc[0][('OOWNCODE', 'count')]):,} clients with {format_currency(top_rms_by_aum.iloc[0][('TOTALHOLDING', 'sum')])} AUM\n"
    md += f"- **Average Activation Rate:** {rm_stats['activation_rate'].mean():.1f}% across all RMs\n"
    md += f"- **Best Activation Rate:** {rm_stats['activation_rate'].max():.1f}% (benchmark for training)\n\n"

    # Client Lifetime Value Analysis
    md += "---\n\n## 💰 CLIENT LIFETIME VALUE (CLV) ANALYSIS\n\n"
    md += "**Methodology:** CLV = (Annual Revenue × 5 years), where Annual Revenue = (AUM × 2% mgmt fee) + Brokerage\n\n"

    md += "### CLV by Client Segment\n\n"
    md += "| Segment | Avg Annual Revenue | Avg 5-Year CLV | Client Count | Total CLV Potential |\n"
    md += "|---------|--------------------|--------------------|--------------|---------------------|\n"

    for segment in clv_by_segment.index:
        annual_rev = clv_by_segment.loc[segment, 'annual_revenue']
        clv = clv_by_segment.loc[segment, 'clv_simple']
        count = int(clv_by_segment.loc[segment, 'OOWNCODE'])
        total_clv = clv * count

        md += f"| **{segment}** | {format_currency(annual_rev)} | {format_currency(clv)} | {count:,} | {format_currency(total_clv)} |\n"

    md += "\n### CLV by Age Group (Lifetime Potential)\n\n"
    md += "| Age Group | Avg Annual Revenue | Avg 5-Year CLV | Client Count | Strategic Priority |\n"
    md += "|-----------|--------------------|--------------------|--------------|--------------------|\n"

    for age_group in clv_by_age.index:
        annual_rev = clv_by_age.loc[age_group, 'annual_revenue']
        clv = clv_by_age.loc[age_group, 'clv_simple']
        count = int(clv_by_age.loc[age_group, 'OOWNCODE'])

        # Determine priority based on age
        if age_group in ['25-35', '35-45']:
            priority = "**HIGH** (Long lifetime)"
        elif age_group in ['45-55']:
            priority = "High (Peak wealth)"
        elif age_group in ['55-65']:
            priority = "Medium (Pre-retirement)"
        else:
            priority = "Low"

        md += f"| **{age_group}** | {format_currency(annual_rev)} | {format_currency(clv)} | {count:,} | {priority} |\n"

    total_clv_portfolio = df['clv_simple'].sum()
    md += f"\n**Total Portfolio CLV (5-Year):** {format_currency(total_clv_portfolio)}\n"
    md += f"**Average CLV per Client:** {format_currency(df['clv_simple'].mean())}\n\n"

    md += "**CLV Strategy Insights:**\n"
    md += "- **Focus on 25-45 age group:** Longest lifetime potential with highest total CLV\n"
    md += "- **HNI/UHNI segments:** Highest per-client CLV but lower volume\n"
    md += "- **Affluent segment:** Balance of CLV and volume - optimal growth target\n"
    md += "- **Retention priority:** Ultra HNI clients have 50-100x CLV of micro clients\n\n"

    # City-wise Trends
    md += "---\n\n## 🏙️ CITY-WISE TRENDS & POTENTIAL\n\n"

    md += "### City Activation & Quality Metrics\n\n"
    md += "| Rank | City | Client Count | Activation Rate | Avg AUM/Client | Total AUM | Potential Score |\n"
    md += "|------|------|--------------|-----------------|----------------|-----------|------------------|\n"

    for idx, (city, row) in enumerate(city_potential_sorted.head(20).iterrows(), 1):
        count = int(row[('OOWNCODE', 'count')])
        activation = float(city_potential.loc[city, 'activation_rate'])
        avg_aum = float(city_potential.loc[city, 'aum_per_client'])
        total_aum = row[('TOTALHOLDING', 'sum')]
        potential = float(city_potential.loc[city, 'potential_score'])

        md += f"| {idx} | **{city}** | {count:,} | {activation:.1f}% | {format_currency(avg_aum)} | {format_currency(total_aum)} | {potential:.1f} |\n"

    md += "\n**Potential Score:** Weighted combination of AUM (40%), Activation Rate (30%), and Brokerage (30%)\n\n"

    md += "### City Segmentation Analysis (Top 10 Cities)\n\n"
    md += "| City | Total Clients | HNI+ Clients | % HNI+ | Affluent+ Clients | % Affluent+ |\n"
    md += "|------|---------------|--------------|--------|-------------------|-------------|\n"

    for city in list(city_segments.keys())[:10]:
        seg = city_segments[city]
        total = seg['total']
        hni = seg['hni_plus']
        affluent = seg['affluent_plus']
        hni_pct = (hni / total * 100) if total > 0 else 0
        affluent_pct = (affluent / total * 100) if total > 0 else 0

        md += f"| **{city}** | {total:,} | {hni:,} | {hni_pct:.1f}% | {affluent:,} | {affluent_pct:.1f}% |\n"

    md += "\n**City Strategy Insights:**\n"

    # Identify high-potential cities
    high_potential_cities = city_potential_sorted[city_potential_sorted['potential_score'] > 60].head(5).index.tolist()
    low_activation_cities = city_detailed[city_detailed['activation_rate'] < 40].sort_values(('TOTALHOLDING', 'sum'), ascending=False).head(5).index.tolist()

    md += f"- **High-Potential Cities (Score >60):** {', '.join(high_potential_cities)}\n"
    md += f"- **Low Activation Opportunity (<40%):** {', '.join(low_activation_cities)} - focus on reactivation\n"

    # Emerging cities with high avg AUM
    emerging = city_detailed[(city_detailed[('OOWNCODE', 'count')] < 1000) & (city_detailed['aum_per_client'] > 2000000)].sort_values('aum_per_client', ascending=False).head(5)
    if len(emerging) > 0:
        md += f"- **Emerging High-Value Cities:** {', '.join(emerging.index.tolist())} - low client count but high avg AUM\n"

    md += "\n"

    # Exchange analysis
    md += "---\n\n## 📈 EXCHANGE PARTICIPATION\n\n### Top Exchange Combinations\n\n"
    md += "| Rank | Exchange(s) | Client Count | Total Holdings |\n"
    md += "|------|-------------|--------------|----------------|\n"

    for idx, (exchange, row) in enumerate(exchange_stats.iterrows(), 1):
        count = int(row['OOWNCODE'])
        holdings = row['TOTALHOLDING']

        md += f"| {idx} | {exchange if exchange else 'None'} | {count:,} | {format_currency(holdings)} |\n"

        if idx >= 10:
            break

    # Client Category Analysis
    md += "\n---\n\n## 🏷️ CLIENT CATEGORY ANALYSIS\n\n"

    if len(category_stats) > 0:
        md += "### Client Distribution by Category\n\n"
        md += "| Rank | Category | Client Count | % of Base | Total Holdings | Avg Holdings | Total Brokerage | Active Clients | Equity Holdings | MF/Bond Holdings |\n"
        md += "|------|----------|--------------|-----------|----------------|--------------|-----------------|----------------|-----------------|------------------|\n"

        total_categorized = category_stats[('OOWNCODE', 'count')].sum()
        for idx, (category, row) in enumerate(category_stats.iterrows(), 1):
            count = int(row[('OOWNCODE', 'count')])
            pct = count / total_categorized * 100
            holdings = row[('TOTALHOLDING', 'sum')]
            avg_holdings = row[('TOTALHOLDING', 'mean')]
            brkg = row[('TOTALBRKG', 'sum')]
            active = int(row[('IS_ACTIVE', 'sum')])
            equity = row[('EQUITYHOLD', 'sum')]
            mf_bond = row[('MF_BOND', 'sum')]

            md += f"| {idx} | **{category}** | {count:,} | {pct:.1f}% | {format_currency(holdings)} | {format_currency(avg_holdings)} | {format_currency(brkg)} | {active:,} | {format_currency(equity)} | {format_currency(mf_bond)} |\n"

            if idx >= 15:
                break

        md += f"\n**Total Categorized Clients:** {total_categorized:,} ({total_categorized/total_clients*100:.1f}% of client base)\n"
        md += f"**Uncategorized Clients:** {total_clients - total_categorized:,} ({(total_clients - total_categorized)/total_clients*100:.1f}% of client base)\n\n"

        md += "**Key Category Insights:**\n"
        top_category = category_stats.index[0] if len(category_stats) > 0 else 'N/A'
        top_category_aum = category_stats.iloc[0][('TOTALHOLDING', 'sum')] if len(category_stats) > 0 else 0
        md += f"- **Dominant Category:** {top_category} accounts for {format_currency(top_category_aum)} AUM\n"
        md += f"- **Category Concentration:** Top 3 categories represent {category_stats.head(3)[('TOTALHOLDING', 'sum')].sum()/total_holdings*100:.1f}% of total AUM\n"
        md += f"- **Average Category Size:** {category_stats[('OOWNCODE', 'count')].mean():.0f} clients per category\n\n"
    else:
        md += "**No client category data available**\n\n"

    # Asset Allocation Analysis
    md += "---\n\n## 📊 ASSET ALLOCATION ANALYSIS\n\n"

    # Overall asset allocation
    total_equity = df['EQUITYHOLD'].sum()
    total_mf_bond = df['MF_BOND'].sum()
    total_allocated = total_equity + total_mf_bond

    if total_allocated > 0:
        md += "### Overall Portfolio Composition\n\n"
        md += "| Asset Class | Total Value | % of Total Holdings | % of Allocated Assets |\n"
        md += "|-------------|-------------|---------------------|------------------------|\n"

        equity_pct_holdings = (total_equity / total_holdings * 100) if total_holdings > 0 else 0
        mf_bond_pct_holdings = (total_mf_bond / total_holdings * 100) if total_holdings > 0 else 0
        equity_pct_allocated = (total_equity / total_allocated * 100) if total_allocated > 0 else 0
        mf_bond_pct_allocated = (total_mf_bond / total_allocated * 100) if total_allocated > 0 else 0

        md += f"| **Equity** | {format_currency(total_equity)} | {equity_pct_holdings:.1f}% | {equity_pct_allocated:.1f}% |\n"
        md += f"| **Mutual Funds & Bonds** | {format_currency(total_mf_bond)} | {mf_bond_pct_holdings:.1f}% | {mf_bond_pct_allocated:.1f}% |\n"
        md += f"| **Total Allocated** | {format_currency(total_allocated)} | {(total_allocated/total_holdings*100):.1f}% | 100.0% |\n"
        md += f"| **Cash/Others** | {format_currency(total_holdings - total_allocated)} | {((total_holdings - total_allocated)/total_holdings*100):.1f}% | - |\n\n"

        md += "### Asset Allocation by Client Segment\n\n"
        md += "| Segment | Client Count | Avg Equity % | Avg MF/Bond % | Total Equity | Total MF/Bond | Total Holdings |\n"
        md += "|---------|--------------|--------------|---------------|--------------|---------------|----------------|\n"

        for segment in asset_by_segment.index:
            count = int(asset_by_segment.loc[segment, 'OOWNCODE'])
            equity_pct = asset_by_segment.loc[segment, 'EQUITY_PCT']
            mf_bond_pct = asset_by_segment.loc[segment, 'MF_BOND_PCT']
            equity_total = asset_by_segment.loc[segment, 'EQUITYHOLD']
            mf_bond_total = asset_by_segment.loc[segment, 'MF_BOND']
            holdings = asset_by_segment.loc[segment, 'TOTALHOLDING']

            md += f"| **{segment}** | {count:,} | {equity_pct:.1f}% | {mf_bond_pct:.1f}% | {format_currency(equity_total)} | {format_currency(mf_bond_total)} | {format_currency(holdings)} |\n"

        md += "\n### Asset Allocation by Age Group\n\n"
        md += "| Age Group | Avg Equity % | Avg MF/Bond % | Total Equity | Total MF/Bond | Total Holdings |\n"
        md += "|-----------|--------------|---------------|--------------|---------------|----------------|\n"

        for age_group in asset_by_age_stats.index:
            equity_pct = asset_by_age_stats.loc[age_group, 'EQUITY_PCT']
            mf_bond_pct = asset_by_age_stats.loc[age_group, 'MF_BOND_PCT']
            equity_total = asset_by_age_stats.loc[age_group, 'EQUITYHOLD']
            mf_bond_total = asset_by_age_stats.loc[age_group, 'MF_BOND']
            holdings = asset_by_age_stats.loc[age_group, 'TOTALHOLDING']

            md += f"| **{age_group}** | {equity_pct:.1f}% | {mf_bond_pct:.1f}% | {format_currency(equity_total)} | {format_currency(mf_bond_total)} | {format_currency(holdings)} |\n"

        md += "\n**Key Asset Allocation Insights:**\n"
        md += f"- **Overall Equity Exposure:** {equity_pct_holdings:.1f}% of total holdings in equities\n"
        md += f"- **Risk Profile:** {equity_pct_allocated:.1f}% equity vs {mf_bond_pct_allocated:.1f}% MF/bonds indicates {'aggressive' if equity_pct_allocated > 60 else 'moderate' if equity_pct_allocated > 40 else 'conservative'} portfolio stance\n"

        # Find segment with highest equity allocation
        max_equity_segment = asset_by_segment['EQUITY_PCT'].idxmax() if len(asset_by_segment) > 0 else 'N/A'
        max_equity_pct = asset_by_segment['EQUITY_PCT'].max() if len(asset_by_segment) > 0 else 0
        md += f"- **Most Aggressive Segment:** {max_equity_segment} with {max_equity_pct:.1f}% average equity allocation\n"

        # Find age group with highest equity allocation
        max_equity_age = asset_by_age_stats['EQUITY_PCT'].idxmax() if len(asset_by_age_stats) > 0 else 'N/A'
        max_equity_age_pct = asset_by_age_stats['EQUITY_PCT'].max() if len(asset_by_age_stats) > 0 else 0
        md += f"- **Most Aggressive Age Group:** {max_equity_age} years with {max_equity_age_pct:.1f}% average equity allocation\n"

        md += f"- **Unallocated Assets:** {format_currency(total_holdings - total_allocated)} ({((total_holdings - total_allocated)/total_holdings*100):.1f}%) in cash or other instruments\n\n"
    else:
        md += "**No asset allocation data available**\n\n"

    # Strategic recommendations
    md += "\n---\n\n## 💡 STRATEGIC RECOMMENDATIONS\n\n"
    md += "### 1. Reactivate Dormant Clients\n"
    md += f"**Opportunity:** {dormant_clients:,} clients ({dormant_clients/total_clients*100:.1f}%) with zero activity\n\n"
    md += "**Action Plan:**\n"
    md += "- Segment dormant clients by last activity date and previous AUM\n"
    md += "- Launch \"Win-Back\" campaign with personalized offers\n"
    md += "- Offer free portfolio reviews for dormant HNI/UHNI clients\n"
    md += "- Re-engagement email sequences with market insights\n\n"

    md += "### 2. Age-Based Targeting\n"
    md += f"**Peak Age Group:** {age_stats['TOTALHOLDING'].idxmax()} years (highest AUM)\n\n"
    md += "**Action Plan:**\n"
    md += "- Focus acquisition on 45-65 age group (peak wealth accumulation)\n"
    md += "- Offer retirement planning for 55+ segment\n"
    md += "- Wealth transfer and succession planning for 65+ segment\n"
    md += "- Target young professionals (25-35) for long-term relationship building\n\n"

    md += "### 3. Geographic Expansion\n"
    md += f"**Top State:** {state_stats.index[0]} accounts for {state_stats.iloc[0]['OOWNCODE']/total_clients*100:.1f}% of client base\n\n"
    md += "**Action Plan:**\n"
    md += "- Strengthen presence in top 3 states (70% of AUM)\n"
    md += "- Identify emerging markets (high avg AUM, low client count)\n"
    md += "- City-specific campaigns for metro areas\n"
    md += "- Partnership models for tier-2/tier-3 cities\n\n"

    md += "### 4. Gender-Specific Strategies\n"
    if 'M' in gender_stats.index and 'F' in gender_stats.index:
        female_pct = int(gender_stats.loc['F', ('OOWNCODE', 'count')]) / gender_total * 100
        md += f"**Female Client Representation:** {female_pct:.1f}%\n\n"
    md += "**Action Plan:**\n"
    md += "- **Women-focused Wealth Programs:** Financial independence workshops, investment literacy\n"
    md += "- **Gender Diversity in RM Teams:** Match female RMs with female HNI clients for better engagement\n"
    md += "- **Spousal Advisory Services:** Joint financial planning for married couples\n"
    md += "- **Female Entrepreneur Targeting:** Special products for women business owners\n"
    md += "- **Inheritance & Succession:** Target female beneficiaries (widows, daughters) of HNI estates\n\n"

    md += "### 5. RM Performance Optimization\n"
    md += f"**Unassigned Clients:** {df[df['RMNAME'].isna()].shape[0]:,} (73.7% - major coverage gap)\n\n"
    md += "**Action Plan:**\n"
    md += "- **Immediate RM Assignment:** Prioritize HNI/UHNI unassigned clients for RM allocation\n"
    md += "- **Best Practice Sharing:** Identify and replicate strategies from top-performing RMs\n"
    md += "- **RM Training:** Focus on activation techniques from RMs with >80% activation rate\n"
    md += "- **Portfolio Balancing:** Redistribute clients from overloaded RMs (>200 clients)\n"
    md += "- **Incentive Structures:** Reward RMs for activation, not just acquisition\n\n"

    md += "### 6. CLV-Based Client Prioritization\n"
    md += f"**Total Portfolio 5-Year CLV:** {format_currency(total_clv_portfolio)}\n\n"
    md += "**Action Plan:**\n"
    md += "- **Segment by CLV:** Allocate service levels based on lifetime value, not just current AUM\n"
    md += "- **Young HNI Focus:** Target 25-45 age HNI clients (highest lifetime value)\n"
    md += "- **Retention Programs:** White-glove service for top 1% CLV clients (>₹1 Cr lifetime value)\n"
    md += "- **Upselling Strategy:** Move Affluent clients to HNI tier (2-5x CLV increase)\n"
    md += "- **Early Warning System:** Monitor at-risk high-CLV clients for proactive intervention\n\n"

    md += "### 7. City Expansion Strategy\n"
    md += f"**High-Potential Cities:** {', '.join(high_potential_cities)}\n\n"
    md += "**Action Plan:**\n"
    md += "- **Tier-1 Deepening:** Increase market share in Mumbai, Pune, Vadodara (already strong)\n"
    md += "- **Tier-2 Penetration:** Open sub-branches in Yavatmal, Ahmednagar, Mangalore (high avg AUM)\n"
    md += "- **Activation Campaigns:** Target low-activation cities with reactivation drives\n"
    md += "- **HNI Clustering:** Focus on cities with >5% HNI concentration for premium services\n"
    md += "- **Local Partnerships:** Tie-ups with CAs, lawyers in emerging high-value cities\n\n"

    md += "### 8. Occupation-Based Outreach\n"
    md += f"**Top Occupation:** {occupation_stats.index[0]} ({format_currency(occupation_stats.iloc[0]['TOTALHOLDING'])} AUM)\n\n"
    md += "**Action Plan:**\n"
    md += "- Tailored PMS products for business owners vs professionals\n"
    md += "- Industry-specific advisory (real estate, manufacturing, IT, finance)\n"
    md += "- Professional association partnerships (CA, lawyers, doctors)\n"
    md += "- Employer tie-ups for salaried professionals\n\n"

    md += "### 9. Branch Channel Optimization\n"
    if 'SB' in branch_stats.index and 'BR' in branch_stats.index:
        sb_pct = branch_stats.loc['SB', 'OOWNCODE'] / branch_stats['OOWNCODE'].sum() * 100
        md += f"**Sub-Branch Preference:** {sb_pct:.1f}% of clients\n\n"
    md += "**Action Plan:**\n"
    md += "- Expand high-performing sub-branch locations\n"
    md += "- Standardize best practices across branch network\n"
    md += "- Digital SB experience for remote clients\n"
    md += "- RM training programs for client retention\n\n"

    # Data quality notes
    md += "---\n\n## 📋 DATA QUALITY NOTES\n\n"

    missing_age = (df['AGE'] == 0).sum()
    missing_state = (df['STATE'] == 'nan').sum()
    missing_rm = (df['RMNAME'].isna()).sum()
    missing_gender = (~df['CSTATUS'].isin(['M', 'F'])).sum()

    md += f"- **Missing Age Data:** {missing_age:,} clients ({missing_age/total_clients*100:.1f}%)\n"
    md += f"- **Missing Gender Data:** {missing_gender:,} clients ({missing_gender/total_clients*100:.1f}%)\n"
    md += f"- **Missing State Data:** {missing_state:,} clients ({missing_state/total_clients*100:.1f}%)\n"
    md += f"- **Missing RM Assignment:** {missing_rm:,} clients ({missing_rm/total_clients*100:.1f}%)\n"
    md += f"- **Zero Holdings:** {(df['TOTALHOLDING'] == 0).sum():,} clients ({(df['TOTALHOLDING'] == 0).sum()/total_clients*100:.1f}%)\n\n"
    md += "**Recommendation:** Implement data enrichment campaign to capture missing demographics and assign RMs to unassigned clients.\n\n"

    # Footer
    md += "---\n\n"
    md += "**Document Owner:** PL Capital - Marketing & Business Development\n"
    md += f"**Analysis Date:** {today}\n"
    md += f"**Data Source:** cldetailnew_1.csv ({total_clients:,} records)\n"
    md += "**Next Review:** Quarterly or upon significant data changes\n\n"
    md += "---\n\n"
    md += "*For questions or additional analysis requests, contact the Business Analytics team.*\n"

    return md

if __name__ == '__main__':
    main()
