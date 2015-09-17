'''update jgb data from mof web site'''

import requests
import pandas as pd


url_cur = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/jgbcme.csv"
url_hist = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/historical/jgbcme_all.csv"

fn = 'hist_jgb.csv'
new_fn = 'new_hist_jgb.csv'

def process_jgb_data(fn, new_fn, verbose=False):
    ''' delete rows contain "-" value '''
    if verbose: print 'loading [%s]' % fn
    jgb_df = pd.read_csv(fn, index_col=0)
    new_jgb_df = jgb_df[jgb_df.apply(lambda x: not any(x == '-'), 1)]
    new_jgb_df.to_csv('new_hist_jgb.csv', index=True)
    if verbose: print 'write data to [%s]' % new_fn


if __name__ == '__main__':
    # get historical jgb interest rate data from MOF japan
    print '>>> downloading jgb data from [%s] ...' % url_hist
    r = requests.get(url_hist)

    sc = r.status_code

    if (sc==200):
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


