'''update jgb data from mof web site'''

import requests

url_cur = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/jgbcme.csv"
url_hist = "http://www.mof.go.jp/english/jgbs/reference/interest_rate/historical/jgbcme_all.csv"

fn = 'hist_jgb.csv'

if __name__ == '__main__':
    # get historical jgb interest rate data from MOF japan
    print '> downloading jgb data from [%s]' % url_hist
    r = requests.get(url_hist)

    sc = r.status_code

    if (sc==200):
        print '[+] status code [%d]' % sc    
        # save downloaded data
        print '> save data at "%s"' % fn
        with open(fn, 'w') as f:
            f.write(r.text)

        print '[+] saved data successfly'

    else:
        print '[-] error statsu code [%d]' % sc


