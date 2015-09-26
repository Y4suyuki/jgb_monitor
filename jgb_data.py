'''update jgb data from mof web site'''

import requests
import pandas as pd


url_cur = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/jgbcme.csv"
url_hist = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/historical/jgbcme_all.csv"

fn_cur = 'jgbcme.csv'
new_fn_cur = 'new_jgbcme.csv'
fn_hist = 'jgbcme_all.csv'
new_fn_hist = 'new_jgbcme_all.csv'
fn = 'jgb_data.csv'

def process_jgb_data(fn, new_fn, verbose=False):
    ''' delete rows contain "-" value '''
    if verbose: print 'loading [%s]' % fn
    jgb_df = pd.read_csv(fn, index_col=0)
    new_jgb_df = jgb_df[jgb_df.apply(lambda x: not any(x == '-'), 1)]
    new_jgb_df.to_csv(new_fn, index=True)
    if verbose: print 'write data to [%s]' % new_fn


# String -> pandas.dataframe
def get_jgb_data(url, fn, new_fn):
    ''' get data from url and return as pandas.dataframe '''
    
    print '>>> downloading jgb data from [%s] ...' % url
    r = requests.get(url)
    sc = r.status_code
    if (sc == 200):
        print '[+] status code [%d]' % sc
        # save downloaded data
        print '> save data at "%s"' % fn
        with open(fn, 'w') as f:
            f.write(r.text)
            
        print '[+] saved data successfly'
            
        print 'processing "%s"' % fn
        process_jgb_data(fn, new_fn)
        print '[+] processing successfully done. file saved at "%s"' % new_fn

    else:
        print '[-] error statsu code [%d]' % sc

    return r

def merge_jgb(fn_cur, fn_hist):
    jgbcme = pd.read_csv(fn_cur, header=True, index_col=0)
    jgbcme_all = pd.read_csv(fn_hist, header=False, index_col=0)
    jgbcme.columns = jgbcme_all.columns
    res = jgbcme_all.append(jgbcme)
    return res

if __name__ == '__main__':
    # get historical jgb interest rate data from MOF japan
    
    # getting current jgb data
    get_jgb_data(url_cur, fn_cur, new_fn_cur)
    
    # getting historical jgb data
    get_jgb_data(url_hist, fn_hist, new_fn_hist)

    jgbcme_df = merge_jgb(new_fn_cur, new_fn_hist)
    jgbcme_df.to_csv(fn, index=True)
    print '[+] [%s] and [%s] merged data saved at [%s]' % (new_fn_cur, new_fn_hist, fn)
