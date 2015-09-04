'''process downloaded jgb data'''

import pandas as pd


def process_jgb_data(fn, new_fn, verbose=False):
    ''' delete rows contain "-" value '''
    if verbose: print 'loading [%s]' % fn
    jgb_df = pd.read_csv(fn, index_col=0)
    new_jgb_df = jgb_df[jgb_df.apply(lambda x: not any(x == '-'), 1)]
    new_jgb_df.to_csv('new_hist_jgb.csv', index=True)
    if verbose: print 'write data to [%s]' % new_fn


if __name__ == '__main__':
    fn = 'hist_jgb.csv'
    new_fn = 'new_hist_jgb.csv'
    process_jgb_data(fn, new_fn)
