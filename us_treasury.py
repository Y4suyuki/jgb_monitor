''' us treasury '''

import requests, re
import pandas as pd
from lxml import etree
from datetime import datetime

# XML data of daily us treasury yield curve
url = 'http://data.treasury.gov/feed.svc/DailyTreasuryYieldCurveRateData'
ns_prog = re.compile('\{.*\}')


# etree Element, dict -> List[String]
def process_entry(e, ns):
    ''' get etree element return d'''
    entry_id = e.xpath('ns:id', namespaces=ns)[0]
    updated = e.xpath('ns:updated', namespaces=ns)[0]
    content = e.xpath('ns:content', namespaces=ns)[0]
    prop = content.xpath('m:properties', namespaces=ns)[0]
    prop_children = prop.getchildren()
    res = map(lambda x: x.text if x.text!= None else 'NA', prop_children)
    return res

# DataFrame -> DataFrame
def process_data(df):
    '''change column names and change date formatting '''

    # change columns label
    bc_prog = re.compile('BC_')
    year_prog = re.compile('YEAR')
    new_date_prog = re.compile('NEW_DATE')
    df.columns = map(lambda x: new_date_prog.sub('Date', year_prog.sub('', bc_prog.sub('', x))), df.columns)

    # select columns
    new_df = df[['Date', '1', '2', '3', '5', '7', '10', '20', '30']]

    # delete rows contain '-' value
    # new_df = new_df[new_df.apply(lambda x: not any(x=='-'), 1)]
    return new_df
    
    

if __name__ == '__main__':
    print '>>> downloading US Treasury yield curve data from [%s] ...' % url
    r = requests.get(url)
    sc = r.status_code
    if sc == 200:
        print '[+] status code [%d]' % sc
        rc = r.text
        tree = etree.fromstring(str(rc))
        nsmap = tree.nsmap
        itr = tree.iterchildren()
        t = itr.next()
        title = t.text
        d = itr.next()
        u = itr.next()
        updated = pd.to_datetime(u.text).strftime('%Y-%m-%d')
        fn = title + updated + '.csv'

        # xpath not support empty namespace prefix
        nsmap['ns'] = nsmap[None]
        nsmap.pop(None)

        entries = tree.xpath('//ns:entry', namespaces=nsmap)
        res = map(lambda e: process_entry(e, nsmap), entries)

        print '>>> writing data to "%s"' % fn
        with open(fn, 'w') as f:
            prop = entries[0].xpath('ns:content/m:properties', namespaces=nsmap)[0]
            labels = map(lambda x: ns_prog.sub('',x.tag), prop.getchildren())
            f.write(','.join(labels) + '\r\n')
            for r in res:
                f.write(','.join(r) + '\r\n')

        print '>>> sort data by date..'
        df = pd.read_csv(fn)
        df.NEW_DATE = pd.to_datetime(df.NEW_DATE)
        sorted_df = df.sort('NEW_DATE')
        sorted_df.to_csv(fn, index=False, na_rep='-')

        print '>>> process data ...'
        sorted_df = pd.read_csv(fn)
        new_df = process_data(sorted_df)
        new_df.Date = pd.to_datetime(new_df.Date)
        new_df.Date = new_df.Date.apply(lambda x: x.strftime('%Y/%m/%d'))

        new_df.to_csv('final_data.csv', index=False)

        print '[+] process all done.'
        
    else:
        print '[-] error statsu code [%d]' % sc




